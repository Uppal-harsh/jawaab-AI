import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

function isAuthorized(req: Request): boolean {
  const cookie = req.headers.get('cookie') || '';
  return cookie.includes('jawaab_admin_session=authenticated_token_active');
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        customer_whatsapp_number,
        customer_name,
        created_at,
        last_message_at,
        status,
        leads (
          id,
          lead_quality_score,
          status,
          source,
          customer_email,
          service_interested,
          appointments (
            id,
            scheduled_time,
            service,
            status,
            google_calendar_event_id
          )
        ),
        messages (
          direction,
          sender,
          content,
          created_at
        )
      `)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    
    // Map database model to expected client interface to avoid breaking UI components
    const calls = (conversations || []).map((conv: any) => {
      const lead = conv.leads?.[0] || null;
      const appt = lead?.appointments?.[0] || null;
      const lastInboundMsg = conv.messages?.filter((m: any) => m.direction === 'inbound').pop();

      return {
        id: conv.id,
        telephony_call_id: conv.id,
        caller_number: conv.customer_whatsapp_number,
        start_time: conv.created_at,
        end_time: conv.last_message_at,
        duration_seconds: null,
        recording_url: null,
        call_summaries: {
          customer_name: conv.customer_name,
          customer_phone: conv.customer_whatsapp_number,
          reason_for_call: lastInboundMsg?.content || 'WhatsApp Inquiry',
          callback_requested: lead?.status === 'new',
          full_transcript: (conv.messages || []).map((m: any) => ({
            role: m.direction === 'inbound' ? 'user' : 'assistant',
            content: m.content,
            timestamp: m.created_at
          })),
          whatsapp_sent_at: conv.last_message_at,
          lead_status: lead?.status === 'qualified' ? 'Appointment Booked' : lead?.status === 'closed' ? 'Closed' : 'New',
          appointment_date: appt ? new Date(appt.scheduled_time).toLocaleString('en-IN') : null,
          notes: lead?.service_interested ? `Interested in: ${lead.service_interested}` : 'No active notes'
        }
      };
    });

    return NextResponse.json({ calls });
  } catch (error) {
    console.error('[Calls API GET] Error retrieving calls list:', error);
    return NextResponse.json({ error: 'Failed to retrieve call logs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { callId, leadStatus, appointmentDate, notes, callbackRequested } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
    }

    // 1. Get or create lead associated with this conversation
    let { data: lead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('conversation_id', callId)
      .maybeSingle();

    if (!lead) {
      const { data: conv } = await supabaseAdmin
        .from('conversations')
        .select('business_id, customer_name, customer_whatsapp_number')
        .eq('id', callId)
        .single();

      if (conv) {
        const { data: newLead } = await supabaseAdmin
          .from('leads')
          .insert({
            business_id: conv.business_id,
            conversation_id: callId,
            customer_name: conv.customer_name || 'Customer',
            customer_phone: conv.customer_whatsapp_number,
            status: leadStatus === 'Appointment Booked' ? 'qualified' : leadStatus === 'Closed' ? 'closed' : 'new'
          })
          .select('*')
          .single();
        lead = newLead;
      }
    } else {
      await supabaseAdmin
        .from('leads')
        .update({
          status: leadStatus === 'Appointment Booked' ? 'qualified' : leadStatus === 'Closed' ? 'closed' : 'new'
        })
        .eq('id', lead.id);
    }

    // 2. Manage appointment details
    if (appointmentDate && lead) {
      const { data: appt } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('lead_id', lead.id)
        .maybeSingle();

      let parsedDateISO = new Date().toISOString();
      try {
        parsedDateISO = new Date(appointmentDate).toISOString();
      } catch (e) {}

      if (appt) {
        await supabaseAdmin
          .from('appointments')
          .update({ scheduled_time: parsedDateISO })
          .eq('id', appt.id);
      } else {
        await supabaseAdmin
          .from('appointments')
          .insert({
            lead_id: lead.id,
            business_id: lead.business_id,
            customer_name: lead.customer_name,
            customer_phone: lead.customer_phone,
            scheduled_time: parsedDateISO,
            status: 'confirmed'
          });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Calls API POST] Error updating lead details:', error);
    return NextResponse.json({ error: 'Failed to update lead details' }, { status: 500 });
  }
}
