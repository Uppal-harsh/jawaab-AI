import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { validateTwilioWebhook } from '../../../../../utils/validators';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const signature = req.headers.get('x-twilio-signature');
    // For validation, we need the request URL. Twilio signs with the exact URL it POSTs to.
    const requestUrl = req.url;

    if (!validateTwilioWebhook(requestUrl, params, signature)) {
      console.warn('[Twilio Incoming Webhook] Signature validation failed');
      return new NextResponse('Unauthorized Webhook Signature', { status: 401 });
    }

    const { CallSid, From, To, ForwardedFrom } = params;

    if (!CallSid || !From || !To) {
      return NextResponse.json({ error: 'Missing required Twilio parameters' }, { status: 400 });
    }

    // Match business by forwarded number (owner's cell) or directly by twilio number
    const targetNumber = ForwardedFrom || To;
    const { data: business, error: bErr } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('phone_number', targetNumber)
      .maybeSingle();

    if (bErr || !business) {
      console.error(`[Twilio Incoming] Business not found for number: ${targetNumber}`);
      // Fallback: dial a default number or reject call
      const fallbackTwiXml = `
        <Response>
          <Say voice="Polly.Aditi" language="en-IN">We are unable to connect your call at this moment. Thank you.</Say>
          <Hangup />
        </Response>
      `.trim();
      return new Response(fallbackTwiXml, { headers: { 'Content-Type': 'application/xml' } });
    }

    // Fetch settings including answering mode & telephony provider
    const { data: settings } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle();

    const answeringMode = settings?.answering_mode || 'always_answer';
    const fallbackNumber = settings?.fallback_number || business.whatsapp_number || '';

    // Mode 1: Answer only if forwarded.
    // If Mode is 'forwarded_only' and call was NOT forwarded (no ForwardedFrom), we Dial the owner directly.
    if (answeringMode === 'forwarded_only' && !ForwardedFrom) {
      console.log(`[Twilio Incoming] Direct dial call to twilio. Routing call to owner fallback: ${fallbackNumber}`);
      const dialTwiXml = `
        <Response>
          <Dial timeout="20">${fallbackNumber}</Dial>
          <Say voice="Polly.Aditi" language="en-IN">The owner is currently busy. Connecting you to Jawaab AI receptionist.</Say>
          <Redirect>/api/telephony/twilio/incoming/process?business_id=${business.id}&amp;force_ai=true</Redirect>
        </Response>
      `.trim();
      return new Response(dialTwiXml, { headers: { 'Content-Type': 'application/xml' } });
    }

    // Mode 2: Always answer (or it's forwarded). AI Answering flow starts here.
    const greeting = settings?.greeting_message || `Namaste. Welcome to ${business.name}. How can we help you?`;
    const voiceGender = settings?.voice_gender || 'female';
    const voice = voiceGender === 'female' ? 'Polly.Aditi' : 'Polly.Raveena'; // Aditi (warm female), Raveena (professional female/male fallback)

    // Insert call log session
    const { error: insertErr } = await supabaseAdmin
      .from('calls')
      .insert({
        business_id: business.id,
        telephony_call_id: CallSid,
        caller_number: From,
        start_time: new Date().toISOString(),
      });

    if (insertErr) {
      console.error('[Twilio Incoming] Failed to create call record:', insertErr);
    }

    // Return TwiML response directing Twilio to play greeting and gather response
    const twiXml = `
      <Response>
        <Say voice="${voice}" language="en-IN">${greeting}</Say>
        <Gather input="speech" action="/api/telephony/twilio/incoming/process?business_id=${business.id}" timeout="5" speechTimeout="auto" />
      </Response>
    `.trim();

    return new Response(twiXml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('[Twilio Incoming API Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
