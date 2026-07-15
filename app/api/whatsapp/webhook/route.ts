import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { FlowOrchestrator } from '../../../../backend/flow';
import { SupabaseStorageProvider } from '../../../../backend/providers/supabase-storage';
import { OpenRouterLLMProvider } from '../../../../backend/providers/openrouter';
import { WhatsAppNotificationProvider } from '../../../../backend/providers/whatsapp';
import { WhatsAppService } from '../../../../services/whatsapp';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const verifyToken = 'jawaab_verify_token_123'; // Default Meta Webhook verify token

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Verification successful');
    return new Response(challenge, { status: 200 });
  }

  console.warn('[WhatsApp Webhook] Verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Check if it is a WhatsApp message callback
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const val = change?.value;
    const message = val?.messages?.[0];
    const contact = val?.contacts?.[0];

    if (!message || message.type !== 'text') {
      return NextResponse.json({ ok: true });
    }

    const customerPhone = message.from;
    const customerName = contact?.profile?.name || 'Customer';
    const messageText = message.text?.body || '';

    console.log(`[WhatsApp Webhook] Incoming message from ${customerName} (${customerPhone}): "${messageText}"`);

    // 1. Resolve business profile
    const { data: business, error: bErr } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (bErr || !business) {
      console.error('[WhatsApp Webhook] No business profile found');
      return NextResponse.json({ error: 'Business not configured' }, { status: 404 });
    }

    // 2. Retrieve or create active chat session (reusing calls table)
    let chat = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('caller_number', customerPhone)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data);

    let chatId = chat?.id;
    let telephonyCallId = chat?.telephony_call_id;

    if (!chat) {
      // Create new session
      telephonyCallId = `wa_session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const { data: newChat, error: cErr } = await supabaseAdmin
        .from('calls')
        .insert({
          business_id: business.id,
          telephony_call_id: telephonyCallId,
          caller_number: customerPhone,
          start_time: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (cErr || !newChat) {
        console.error('[WhatsApp Webhook] Failed to create chat session:', cErr);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
      }

      chatId = newChat.id;

      // Create CRM lead / chat summary record
      const { error: sErr } = await supabaseAdmin
        .from('call_summaries')
        .insert({
          call_id: chatId,
          customer_name: customerName,
          customer_phone: customerPhone,
          reason_for_call: 'WhatsApp Inquiry',
          lead_status: 'New',
          full_transcript: []
        });

      if (sErr) {
        console.error('[WhatsApp Webhook] Failed to create CRM lead summary:', sErr);
      }
    }

    // 3. Process turn with FlowOrchestrator
    const storage = new SupabaseStorageProvider();
    const llm = new OpenRouterLLMProvider();
    const notification = new WhatsAppNotificationProvider();
    const orchestrator = new FlowOrchestrator(storage, llm, notification);

    const replyText = await orchestrator.processCallTurn(telephonyCallId, messageText, business.id);

    // 4. Update CRM status if specific intent is parsed
    if (replyText.includes('[INTENT: BookAppointment]')) {
      // Transition CRM lead status
      await supabaseAdmin
        .from('call_summaries')
        .update({
          lead_status: 'Appointment Booked',
          appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString() + ' 3:00 PM', // Fallback placeholder to tomorrow 3pm
          reason_for_call: 'Booked appointment via WhatsApp'
        })
        .eq('call_id', chatId);
    } else if (replyText.includes('[INTENT: RequestHuman]')) {
      await supabaseAdmin
        .from('call_summaries')
        .update({ lead_status: 'Contacted', callback_requested: true })
        .eq('call_id', chatId);
    }

    // Strip out LLM intents formatting before sending to client
    const cleanedReply = replyText
      .replace(/\[INTENT:\s*[A-Za-z]+\]/g, '')
      .trim();

    // 5. Send message response back to Meta API
    const isSent = await WhatsAppService.sendTextMessage(customerPhone, cleanedReply);

    return NextResponse.json({ ok: isSent, reply: cleanedReply });
  } catch (error) {
    console.error('[WhatsApp Webhook POST Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
