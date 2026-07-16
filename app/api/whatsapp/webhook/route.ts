import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { OpenRouterService } from '../../../../services/openrouter';
import { WhatsAppService } from '../../../../services/whatsapp';
import { GoogleCalendarService } from '../../../../services/google-calendar';

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

    // 2. Retrieve or create active conversation
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('business_id', business.id)
      .eq('customer_whatsapp_number', customerPhone)
      .eq('status', 'active')
      .maybeSingle();

    if (!conversation) {
      const { data: newConv, error: cErr } = await supabaseAdmin
        .from('conversations')
        .insert({
          business_id: business.id,
          customer_whatsapp_number: customerPhone,
          customer_name: customerName,
          status: 'active'
        })
        .select('*')
        .single();

      if (cErr || !newConv) {
        console.error('[WhatsApp Webhook] Failed to create conversation:', cErr);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
      }
      conversation = newConv;
    } else {
      await supabaseAdmin
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
    }

    // 3. Log inbound user message
    await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'inbound',
        sender: customerName,
        content: messageText,
        message_type: 'text'
      });

    // 4. Load recent history
    const { data: dbMsgs } = await supabaseAdmin
      .from('messages')
      .select('direction, sender, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    const history = (dbMsgs || []).map(m => ({
      role: m.direction === 'inbound' ? 'user' as const : 'assistant' as const,
      content: m.content
    }));

    // 5. Fetch settings and build system prompt
    const { data: settings } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle();

    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('customer_name, scheduled_time, service')
      .eq('business_id', business.id)
      .eq('status', 'confirmed');

    const bookingList = (appointments || [])
      .map(app => `- ${app.customer_name}: ${new Date(app.scheduled_time).toLocaleString('en-IN')} (${app.service || 'General'})`)
      .join('\n');

    const systemPrompt = `You are an AI receptionist for "${business.name}", owned by ${business.owner_name}.
Your job is to answer customer questions politely on WhatsApp, qualify them as a lead, and help them book an appointment.

Guidelines:
1. Always greet the user warmly. Greeting template: "${settings?.greeting_message || 'Hello! How can we help you today?'}"
2. Keep your answers brief, friendly, and helpful.
3. If they want to book an appointment, qualify their interest (find out what service they want) and coordinate a time.
4. Once you agree on a specific appointment time and service, format your output with special tag markers:
   - Include "[INTENT: BookAppointment]" in your response when they finalize an appointment.
   - Include "[DATE: YYYY-MM-DD HH:MM]" with the agreed scheduled slot (use the user's timezone ${business.timezone || 'Asia/Kolkata'}).
5. If the customer requests human assistance or asks for things you cannot handle, include "[INTENT: RequestHuman]".

Today's date and time is: ${new Date().toLocaleString('en-US', { timeZone: business.timezone || 'Asia/Kolkata' })}.

Here are the existing booked slots (prevent double booking these times):
${bookingList || 'None'}`;

    // 6. Generate reply with Claude 3.5 Haiku via OpenRouter
    const chatMsgs = [
      { role: 'system', content: systemPrompt },
      ...history
    ];

    const llmResponse = await OpenRouterService.executeChat(chatMsgs, { temperature: 0.3, maxTokens: 200 });
    const replyText = llmResponse.content;

    // 7. Save AI response generated
    const { data: aiRes } = await supabaseAdmin
      .from('ai_responses')
      .insert({
        conversation_id: conversation.id,
        prompt_used: systemPrompt,
        response_generated: replyText,
        confidence_score: 0.95
      })
      .select('*')
      .single();

    // 8. Log outbound response message
    await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'outbound',
        sender: 'AI Assistant',
        content: replyText,
        message_type: 'text',
        ai_response_id: aiRes?.id || null
      });

    // 9. Process intents
    if (replyText.includes('[INTENT: BookAppointment]')) {
      let bookedDateText = '';
      const dateMatch = replyText.match(/\[DATE:\s*([^\]]+)\]/);
      if (dateMatch) {
        bookedDateText = dateMatch[1].trim();
      } else {
        bookedDateText = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString() + ' 15:00';
      }

      let startISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      let endISO = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
      try {
        const parsedDate = new Date(bookedDateText);
        if (!isNaN(parsedDate.getTime())) {
          startISO = parsedDate.toISOString();
          endISO = new Date(parsedDate.getTime() + 60 * 60 * 1000).toISOString();
        }
      } catch (e) {
        console.error('[Calendar Sync] Failed parsing bookedDateText', e);
      }

      // Sync event directly to Google Calendar
      const calendarSync = await GoogleCalendarService.createEvent(
        `Appointment: ${customerName}`,
        `Customer Phone: ${customerPhone}\nReason: WhatsApp CRM Automated Booking`,
        startISO,
        endISO
      );

      // Create / upsert lead
      let { data: lead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('business_id', business.id)
        .eq('customer_phone', customerPhone)
        .maybeSingle();

      if (!lead) {
        const { data: newLead } = await supabaseAdmin
          .from('leads')
          .insert({
            business_id: business.id,
            conversation_id: conversation.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            lead_quality_score: 4,
            status: 'qualified',
            source: 'whatsapp'
          })
          .select('*')
          .single();
        lead = newLead;
      } else {
        await supabaseAdmin
          .from('leads')
          .update({ status: 'qualified' })
          .eq('id', lead.id);
      }

      if (lead) {
        // Create appointment record
        await supabaseAdmin
          .from('appointments')
          .insert({
            lead_id: lead.id,
            business_id: business.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            service: 'General Consultation',
            scheduled_time: startISO,
            status: 'confirmed',
            synced_to_calendar: calendarSync.success,
            google_calendar_event_id: calendarSync.eventId || null
          });

        // Schedule follow-ups: 3-day follow-up
        const scheduledTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from('follow_ups')
          .insert({
            lead_id: lead.id,
            follow_up_number: 1,
            scheduled_for: scheduledTime,
            message_content: `Hi ${customerName}, just checking in to see if you have any questions before your appointment!`,
            message_sent: false
          });
      }

      // Notify owner
      const alertPayload = {
        callerName: customerName,
        callerPhone: customerPhone,
        reason: 'Booked Appointment',
        summary: `Customer successfully booked an appointment for: ${bookedDateText}. Calendar Sync status: ${calendarSync.success ? 'Success' : 'Failed'}.`,
        urgency: 'high' as const,
        callbackRequested: false,
        durationSeconds: 0
      };
      await WhatsAppService.sendCallSummaryNotification(business.whatsapp_number, alertPayload);

    } else if (replyText.includes('[INTENT: RequestHuman]')) {
      // Create lead if not exists
      let { data: lead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('business_id', business.id)
        .eq('customer_phone', customerPhone)
        .maybeSingle();

      if (!lead) {
        const { data: newLead } = await supabaseAdmin
          .from('leads')
          .insert({
            business_id: business.id,
            conversation_id: conversation.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            lead_quality_score: 3,
            status: 'new',
            source: 'whatsapp'
          })
          .select('*')
          .single();
        lead = newLead;
      }

      // Notify owner
      const alertPayload = {
        callerName: customerName,
        callerPhone: customerPhone,
        reason: 'Requested Human Assistance',
        summary: `Customer requested manual support. Message text: "${messageText}".`,
        urgency: 'high' as const,
        callbackRequested: true,
        durationSeconds: 0
      };
      await WhatsAppService.sendCallSummaryNotification(business.whatsapp_number, alertPayload);
    }

    // Strip out tags before replying
    const cleanedReply = replyText
      .replace(/\[INTENT:\s*[A-Za-z]+\]/g, '')
      .replace(/\[DATE:\s*[^\]]+\]/g, '')
      .trim();

    const isSent = await WhatsAppService.sendTextMessage(customerPhone, cleanedReply);
    return NextResponse.json({ ok: isSent, reply: cleanedReply });
  } catch (error) {
    console.error('[WhatsApp Webhook POST Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
