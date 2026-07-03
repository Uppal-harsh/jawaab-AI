import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { validateExotelWebhook } from '../../../../../utils/validators';
import { SarvamService } from '../../../../../services/sarvam';
import { OpenRouterService } from '../../../../../services/openrouter';
import { PromptBuilder } from '../../../../../services/prompt-builder';
import { ChatMessage } from '../../../../../types';

export async function POST(req: Request) {
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
    const { data: call, error: cErr } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('telephony_call_id', call_sid)
      .maybeSingle();

    if (cErr || !call) {
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
      // Fallback if no speech captured
      const voiceXml = `
        <Response>
          <Say voice="female" language="en-IN">I'm sorry, I didn't hear anything. Could you please repeat that?</Say>
          <Gather input="speech" action="${req.url}" timeout="5" speechTimeout="auto" />
        </Response>
      `.trim();
      return new Response(voiceXml, { headers: { 'Content-Type': 'application/xml' } });
    }

    // 2. Fetch business, settings, prompt configuration, and knowledge cards
    const { data: business } = await supabaseAdmin.from('businesses').select('*').eq('id', businessId).single();
    const { data: settings } = await supabaseAdmin.from('business_settings').select('*').eq('business_id', businessId).single();
    const { data: promptConfig } = await supabaseAdmin.from('prompt_configurations').select('*').eq('business_id', businessId).eq('is_active', true).maybeSingle();
    const { data: cards } = await supabaseAdmin.from('knowledge_cards').select('*').eq('business_id', businessId).eq('is_active', true);

    // 3. Retrieve conversation history
    const { data: summaryRecord } = await supabaseAdmin
      .from('call_summaries')
      .select('*')
      .eq('call_id', call.id)
      .maybeSingle();

    const history: ChatMessage[] = summaryRecord ? (summaryRecord.full_transcript as ChatMessage[]) : [];

    // 4. Match Knowledge Cards
    const queryLower = callerText.toLowerCase();
    const matchedCards = (cards || []).filter(
      (card) =>
        queryLower.includes(card.question_trigger.toLowerCase()) ||
        card.category.toLowerCase().split(' ').some((kw: string) => queryLower.includes(kw))
    );

    // 5. Build prompts
    const systemPrompt = PromptBuilder.buildSystemPrompt(
      business,
      settings,
      promptConfig,
      matchedCards
    );

    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: 'user', content: callerText, timestamp: new Date().toISOString() },
    ];

    const messages = PromptBuilder.compileMessages(systemPrompt, updatedHistory);

    // 6. Generate Response using OpenRouter LLM
    const llmResponse = await OpenRouterService.executeChat(messages, {
      temperature: 0.2,
      maxTokens: 100,
    });

    const assistantText = llmResponse.content;
    updatedHistory.push({
      role: 'assistant',
      content: assistantText,
      timestamp: new Date().toISOString(),
    });

    // 7. Save conversation transcript to database
    if (summaryRecord) {
      await supabaseAdmin
        .from('call_summaries')
        .update({ full_transcript: updatedHistory })
        .eq('id', summaryRecord.id);
    } else {
      await supabaseAdmin.from('call_summaries').insert({
        call_id: call.id,
        customer_phone: call.caller_number,
        reason_for_call: 'In conversation...',
        full_transcript: updatedHistory,
      });
    }

    // 8. Generate speech with TTS
    const voiceResult = await SarvamService.textToSpeech(assistantText, settings.voice_gender);

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
    const fallbackXml = `
      <Response>
        <Say voice="female" language="en-IN">We are facing technical issues. A representative will call you back shortly.</Say>
        <Hangup />
      </Response>
    `.trim();
    return new Response(fallbackXml, { headers: { 'Content-Type': 'application/xml' } });
  }
}
