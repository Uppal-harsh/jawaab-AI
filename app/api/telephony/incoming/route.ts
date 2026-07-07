import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { validateExotelWebhook } from '../../../../utils/validators';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Jawaab AI Telephony Webhook Endpoint is Active. Send an Exotel POST request to initialize a call.'
  });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-exotel-signature');

    if (!validateExotelWebhook(rawBody, signature)) {
      console.warn('[Telephony Incoming Webhook] Unauthorized signature attempt');
      return new NextResponse('Unauthorized Webhook Signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { call_sid, from, to } = payload;

    if (!call_sid || !from || !to) {
      return NextResponse.json({ error: 'Missing required telephony fields' }, { status: 400 });
    }

    // Match business by number called
    const { data: business, error: bErr } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('phone_number', to)
      .maybeSingle();

    if (bErr || !business) {
      console.error(`[Incoming Call] Business not found for destination number: ${to}`);
      return NextResponse.json({ error: 'Destination business number not configured' }, { status: 404 });
    }

    // Fetch greeting settings
    const { data: settings } = await supabaseAdmin
      .from('business_settings')
      .select('greeting_message, voice_gender')
      .eq('business_id', business.id)
      .maybeSingle();

    const greeting = settings?.greeting_message || `Namaste. Welcome to ${business.name}. How can we help you?`;
    const voice = settings?.voice_gender || 'female';

    // Insert call log session
    const { error: insertErr } = await supabaseAdmin
      .from('calls')
      .insert({
        business_id: business.id,
        telephony_call_id: call_sid,
        caller_number: from,
        start_time: new Date().toISOString(),
      });

    if (insertErr) {
      console.error('[Incoming Call] Failed to create call record:', insertErr);
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'ws' : 'wss';
    const streamUrl = `${protocol}://${host}/api/telephony/stream?business_id=${business.id}`;

    const exotelXml = `
<Response>
  <Say voice="${voice}" language="en-IN">${greeting}</Say>
  <Stream url="${streamUrl}" />
  <Hangup />
</Response>
    `.trim();

    return new Response(exotelXml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('[Telephony Incoming API Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
