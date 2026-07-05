import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { validateTwilioWebhook } from '../../../../../../utils/validators';
import { OpenRouterService } from '../../../../../../services/openrouter';
import { PromptBuilder } from '../../../../../../services/prompt-builder';
import { ChatMessage } from '../../../../../../types';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const signature = req.headers.get('x-twilio-signature');
    const requestUrl = req.url;

    if (!validateTwilioWebhook(requestUrl, params, signature)) {
      console.warn('[Twilio Process Webhook] Signature validation failed');
      return new NextResponse('Unauthorized Webhook Signature', { status: 401 });
    }

    const { CallSid, SpeechResult, From } = params;
    const urlParams = new URL(req.url).searchParams;
    const businessId = urlParams.get('business_id');
    const forceAi = urlParams.get('force_ai') === 'true';

    if (!CallSid || !businessId) {
      return NextResponse.json({ error: 'Missing session identifiers' }, { status: 400 });
    }

    // Retrieve active call records
    let { data: call, error: cErr } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('telephony_call_id', CallSid)
      .maybeSingle();

    // Insert call log session if direct dial failed and we are forcing AI answer
    if (!call && forceAi && From) {
      const { data: newCall, error: insertErr } = await supabaseAdmin
        .from('calls')
        .insert({
          business_id: businessId,
          telephony_call_id: CallSid,
          caller_number: From,
          start_time: new Date().toISOString(),
        })
        .select('*')
        .maybeSingle();

      if (insertErr || !newCall) {
        console.error('[Twilio Process] Failed to insert forced call record:', insertErr);
        return NextResponse.json({ error: 'Failed to initialize call session' }, { status: 500 });
      }
      call = newCall;
    }

    if (!call) {
      return NextResponse.json({ error: 'Call session context not found' }, { status: 404 });
    }

    const voiceGender = 'female'; // Default Polly fallback
    let voice = 'Polly.Aditi';
    let isHindi = false;

    // Fetch settings and prompt details
    const { data: business } = await supabaseAdmin.from('businesses').select('*').eq('id', businessId).single();
    const { data: settings } = await supabaseAdmin.from('business_settings').select('*').eq('business_id', businessId).single();
    
    if (settings) {
      voice = settings.voice_gender === 'female' ? 'Polly.Aditi' : 'Polly.Raveena';
      isHindi = settings.language === 'hi' || settings.language === 'auto';
    }

    let callerText = SpeechResult || '';

    if (!callerText) {
      // Fallback if no speech captured
      const fallbackText = isHindi 
        ? "माफ़ कीजियेगा, मुझे कुछ सुनाई नहीं दिया। क्या आप फिर से बोलेंगे?"
        : "I'm sorry, I didn't catch that. Could you please repeat it?";

      const twiXml = `
        <Response>
          <Say voice="${voice}" language="${isHindi ? 'hi-IN' : 'en-IN'}">${fallbackText}</Say>
          <Gather input="speech" action="${req.url}" timeout="5" speechTimeout="auto" />
        </Response>
      `.trim();
      return new Response(twiXml, { headers: { 'Content-Type': 'application/xml' } });
    }

    const { data: promptConfig } = await supabaseAdmin.from('prompt_configurations').select('*').eq('business_id', businessId).eq('is_active', true).maybeSingle();
    const { data: cards } = await supabaseAdmin.from('knowledge_cards').select('*').eq('business_id', businessId).eq('is_active', true);

    // Retrieve conversation history
    const { data: summaryRecord } = await supabaseAdmin
      .from('call_summaries')
      .select('*')
      .eq('call_id', call.id)
      .maybeSingle();

    const history: ChatMessage[] = summaryRecord ? (summaryRecord.full_transcript as ChatMessage[]) : [];

    // Match Knowledge Cards
    const queryLower = callerText.toLowerCase();
    const matchedCards = (cards || []).filter(
      (card) =>
        queryLower.includes(card.question_trigger.toLowerCase()) ||
        card.category.toLowerCase().split(' ').some((kw: string) => queryLower.includes(kw))
    );

    // Build prompt using prompt-builder
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

    // Generate Response using OpenRouter
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

    // Save transcript update to database
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

    // Return TwiML play/say and gather response
    const twiXml = `
      <Response>
        <Say voice="${voice}" language="${isHindi ? 'hi-IN' : 'en-IN'}">${assistantText}</Say>
        <Gather input="speech" action="${req.url}" timeout="5" speechTimeout="auto" />
      </Response>
    `.trim();

    return new Response(twiXml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('[Twilio Process API Error]:', error);
    const fallbackTwiXml = `
      <Response>
        <Say voice="Polly.Aditi" language="en-IN">We are facing technical issues. A representative will call you back shortly.</Say>
        <Hangup />
      </Response>
    `.trim();
    return new Response(fallbackTwiXml, { headers: { 'Content-Type': 'application/xml' } });
  }
}
