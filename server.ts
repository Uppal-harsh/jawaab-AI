import fs from 'fs';
import path from 'path';

// Native env loader
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

import http from 'http';
import next from 'next';
import { parse } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { FlowOrchestrator } from './backend/flow';
import { SupabaseStorageProvider } from './backend/providers/supabase-storage';
import { OpenRouterLLMProvider } from './backend/providers/openrouter';
import { WhatsAppNotificationProvider } from './backend/providers/whatsapp';
import { SarvamService } from './services/sarvam';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

function addWavHeader(pcmBuffer: Buffer, sampleRate = 16000): Buffer {
  const header = Buffer.alloc(44);
  const fileSizeBytes = pcmBuffer.length + 36;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(fileSizeBytes, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const parsedUrl = parse(request.url || '', true);
    if (parsedUrl.pathname === '/api/telephony/stream') {
      const businessIdFromUrl = parsedUrl.query.business_id as string;
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, businessIdFromUrl);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, request: http.IncomingMessage, businessIdParam: string) => {
    console.log('[WebSocket] Exotel media stream connection established');
    const storage = new SupabaseStorageProvider();
    const llm = new OpenRouterLLMProvider();
    const notification = new WhatsAppNotificationProvider();
    const orchestrator = new FlowOrchestrator(storage, llm, notification);

    let streamSid = '';
    let callSid = '';
    let businessId = businessIdParam || '';
    let audioBuffer: Buffer[] = [];
    let isProcessing = false;
    let hasSpoken = false;
    let speakerSilenceStart: number | null = null;
    let playbackIntervalId: NodeJS.Timeout | null = null;

    const silenceThreshold = 300; // RMS amplitude noise threshold
    const silenceDurationMs = 1200; // Wait 1.2s before generating turn

    function calculateRMS(buf: Buffer): number {
      let sum = 0;
      const samplesCount = buf.length / 2;
      for (let i = 0; i < buf.length; i += 2) {
        if (i + 1 < buf.length) {
          const sample = buf.readInt16LE(i);
          sum += sample * sample;
        }
      }
      return Math.sqrt(sum / samplesCount);
    }

    async function processSpeech() {
      if (audioBuffer.length === 0 || !businessId) {
        console.warn('[WebSocket] Cannot process speech: no audio or no businessId');
        isProcessing = false;
        return;
      }

      console.log(`[WebSocket] Triggered turn processing for call ${callSid}`);
      const rawPcm = Buffer.concat(audioBuffer);
      audioBuffer = []; // Clear active buffer

      try {
        const wavFile = addWavHeader(rawPcm, 16000);
        
        // 1. STT Transcribe via Sarvam
        const transcription = await SarvamService.speechToText(wavFile);
        const text = transcription.text.trim();
        console.log(`[WebSocket] Transcribed caller speech: "${text}"`);

        if (!text) {
          console.log('[WebSocket] Empty text output, resuming listening');
          isProcessing = false;
          hasSpoken = false;
          speakerSilenceStart = null;
          return;
        }

        // 2. Process conversation turn
        const assistantText = await orchestrator.processCallTurn(callSid, text, businessId);
        console.log(`[WebSocket] AI Receptionist text: "${assistantText}"`);

        // 3. Synthesize speech via Sarvam
        const settings = await storage.getBusinessSettings(businessId);
        const voiceGender = settings?.voice_gender || 'female';
        
        const ttsResult = await SarvamService.textToSpeech(assistantText, voiceGender as 'male' | 'female');
        const base64Data = ttsResult.audioUrl.replace(/^data:audio\/wav;base64,/, '');
        const audioBufferResult = Buffer.from(base64Data, 'base64');
        const pcmAudio = audioBufferResult.slice(44); // Slice out the 44-byte WAV header

        // 4. Stream response PCM back to Exotel
        streamResponsePCM(pcmAudio);
      } catch (err) {
        console.error('[WebSocket] Error inside conversation loop:', err);
        isProcessing = false;
        hasSpoken = false;
        speakerSilenceStart = null;
      }
    }

    function streamResponsePCM(pcmBuffer: Buffer) {
      if (playbackIntervalId) clearInterval(playbackIntervalId);

      const chunkSize = 640; // 20ms frames at 16kHz 16-bit PCM (16000 * 2 bytes * 0.02)
      let offset = 0;

      playbackIntervalId = setInterval(() => {
        if (offset >= pcmBuffer.length) {
          if (playbackIntervalId) {
            clearInterval(playbackIntervalId);
            playbackIntervalId = null;
          }
          isProcessing = false;
          hasSpoken = false;
          speakerSilenceStart = null;
          audioBuffer = [];
          console.log('[WebSocket] Playback finished. Listening resumed.');
          return;
        }

        const chunk = pcmBuffer.slice(offset, offset + chunkSize);
        offset += chunkSize;

        const mediaPayload = {
          event: 'media',
          streamSid: streamSid,
          media: {
            payload: chunk.toString('base64')
          }
        };

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(mediaPayload));
        }
      }, 20);
    }

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.event === 'start') {
          streamSid = data.streamSid;
          callSid = data.callSid;
          console.log(`[WebSocket] Session start received: streamSid=${streamSid}, callSid=${callSid}`);
          return;
        }

        if (data.event === 'media') {
          const payloadBuffer = Buffer.from(data.media.payload, 'base64');
          const rms = calculateRMS(payloadBuffer);

          if (rms > silenceThreshold) {
            // Barge-in check: Caller spoke while bot is playing
            if (playbackIntervalId) {
              console.log('[WebSocket] Barge-in! Stopping assistant playback.');
              clearInterval(playbackIntervalId);
              playbackIntervalId = null;
              ws.send(JSON.stringify({ event: 'clear', streamSid }));
              audioBuffer = [];
              isProcessing = false;
            }

            hasSpoken = true;
            speakerSilenceStart = null;
          } else if (hasSpoken) {
            if (speakerSilenceStart === null) {
              speakerSilenceStart = Date.now();
            } else {
              const elapsed = Date.now() - speakerSilenceStart;
              if (elapsed > silenceDurationMs && !isProcessing) {
                isProcessing = true;
                processSpeech();
              }
            }
          }

          if (!isProcessing) {
            audioBuffer.push(payloadBuffer);
          }
          return;
        }

        if (data.event === 'stop') {
          console.log(`[WebSocket] Session stop received for call ${callSid}`);
          if (playbackIntervalId) clearInterval(playbackIntervalId);
          ws.close();
        }
      } catch (err) {
        console.error('[WebSocket] Error processing socket payload:', err);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Connection closed by remote');
      if (playbackIntervalId) clearInterval(playbackIntervalId);
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Server listening on http://localhost:${port}`);
  });
});
