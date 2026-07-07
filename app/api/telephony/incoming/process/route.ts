import { NextResponse } from 'next/server';
import { validateExotelWebhook } from '../../../../../utils/validators';
import { SarvamService } from '../../../../../services/sarvam';
import { SupabaseStorageProvider } from '../../../../../backend/providers/supabase-storage';
import { OpenRouterLLMProvider } from '../../../../../backend/providers/openrouter';
import { WhatsAppNotificationProvider } from '../../../../../backend/providers/whatsapp';
import { ExotelVoiceProvider } from '../../../../../backend/providers/exotel';
import { FlowOrchestrator } from '../../../../../backend/flow';

export async function POST(req: Request) {
  const storage = new SupabaseStorageProvider();
  const llm = new OpenRouterLLMProvider();
  const notification = new WhatsAppNotificationProvider();
  const voiceProvider = new ExotelVoiceProvider();
  const orchestrator = new FlowOrchestrator(storage, llm, notification);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-exotel-signature');

    if (!validateExotelWebhook(rawBody, signature)) {
      console.warn('[Process Webhook] Unauthorized signature attempt');
      return new NextResponse('Unauthorized Webhook Signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { call_sid, RecordingUrl, SpeechResult } = payload;

    if (!call_sid) {
      return NextResponse.json({ error: 'Missing call session identifier' }, { status: 400 });
    }

    // Retrieve active call records
    const call = await storage.getCallSession(call_sid);

    if (!call) {
      return NextResponse.json({ error: 'Call session context not found' }, { status: 404 });
    }

    const businessId = call.business_id;

    // 1. STT: Transcribe caller's input
    let callerText = SpeechResult || '';
    if (!callerText && RecordingUrl) {
      const transcription = await SarvamService.speechToText(RecordingUrl);
      callerText = transcription.text;
    }

    if (!callerText) {
      const fallbackXml = voiceProvider.createResponseXML(
        "I'm sorry, I didn't hear anything. Could you please repeat that?",
        "female",
        "en-IN",
        req.url
      );
      return new Response(fallbackXml, { headers: { 'Content-Type': 'application/xml' } });
    }

    // 2. Fetch settings to configure voice output
    const settings = await storage.getBusinessSettings(businessId);

    // 3. Process call turn via orchestrator pipeline
    const assistantText = await orchestrator.processCallTurn(call_sid, callerText, businessId);

    // 4. Generate speech with TTS via Exotel/Sarvam playback
    const voiceResult = await SarvamService.textToSpeech(assistantText, (settings?.voice_gender as "male" | "female") || 'female');

    const voiceXml = `
<Response>
  <Play>${voiceResult.audioUrl}</Play>
  <Gather input="speech" action="${req.url}" timeout="5" speechTimeout="auto" />
</Response>
    `.trim();

    return new Response(voiceXml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('[Telephony Process API Error]:', error);
    const fallbackXml = voiceProvider.createErrorXML('female', 'en-IN');
    return new Response(fallbackXml, { headers: { 'Content-Type': 'application/xml' } });
  }
}
