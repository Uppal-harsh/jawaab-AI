import { env } from '../lib/env';
import { TranscribeResult, SynthesizeResult } from '../types';

/**
 * Helper to execute fetch operations with Exponential Backoff Retries
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (res.ok) return res;
    
    // Retriable HTTP status codes
    if (res.status === 429 || res.status >= 500) {
      throw new Error(`Server returned status: ${res.status}`);
    }
    return res;
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`[Sarvam API Warning] Request failed. Retrying in ${delayMs}ms. Error: ${error instanceof Error ? error.message : String(error)}`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchWithRetry(url, options, retries - 1, delayMs * 2);
  }
}

/**
 * Sarvam AI API Wrapper
 */
export class SarvamService {
  private static apiKey = env.SARVAM_API_KEY;
  private static baseUrl = 'https://api.sarvam.ai';

  /**
   * Transcribe audio from an external URL or direct audio Buffer
   */
  static async speechToText(audioSource: Buffer | string, model: 'speech-to-text-translate' | 'transcribe' = 'transcribe'): Promise<TranscribeResult> {
    const url = `${this.baseUrl}/speech-to-text`;
    const headers = {
      'api-subscription-key': this.apiKey,
    };

    const formData = new FormData();
    formData.append('model', model === 'transcribe' ? 'saaras:v1' : 'saaras:v1');
    formData.append('language_code', 'hi-IN'); // Default to Hinglish / Indian Hindi context

    if (typeof audioSource === 'string') {
      formData.append('audio_url', audioSource);
    } else {
      const blob = new Blob([audioSource as any], { type: 'audio/wav' });
      formData.append('file', blob, 'speech.wav');
    }

    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam STT failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return {
        text: data.transcript || '',
        language: data.language_code || 'hi-IN',
        confidence: data.confidence || 1.0,
      };
    } catch (error) {
      console.error('[SarvamService.speechToText] Error transcribing audio:', error);
      throw error;
    }
  }

  /**
   * Synthesize text to speech returning a base64 audio stream or audio URL
   */
  static async textToSpeech(
    text: string,
    voiceGender: 'male' | 'female' = 'female',
    languageCode = 'hi-IN'
  ): Promise<SynthesizeResult> {
    const url = `${this.baseUrl}/text-to-speech`;
    const speaker = voiceGender === 'female' ? 'meera' : 'ravish'; // meera and ravish are high quality Indic voices in Sarvam

    const body = {
      inputs: [text],
      target_language_code: languageCode,
      speaker,
      pitch: 0,
      pace: 1.0,
      loudness: 1.5,
      speech_rate: 1.0,
    };

    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam TTS failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Sarvam TTS usually returns base64 audios array in 'audios' key
      if (!data.audios || data.audios.length === 0) {
        throw new Error('Sarvam TTS returned an empty audio payload.');
      }

      // In a production setup, we might upload this base64 chunk to a public Supabase Storage bucket 
      // to yield a public URL for Exotel's play commands. We return standard base64 audio payload uri here.
      const audioBase64 = data.audios[0];
      const audioUrl = `data:audio/wav;base64,${audioBase64}`;

      return {
        audioUrl,
        durationSeconds: text.length * 0.1, // Approximate fallback duration estimation
      };
    } catch (error) {
      console.error('[SarvamService.textToSpeech] Error generating speech:', error);
      throw error;
    }
  }
}
