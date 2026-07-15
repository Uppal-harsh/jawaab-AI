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
    // Select all calls joined with call_summaries data
    const { data: calls, error } = await supabaseAdmin
      .from('calls')
      .select(`
        id,
        telephony_call_id,
        caller_number,
        start_time,
        end_time,
        duration_seconds,
        recording_url,
        call_summaries (
          customer_name,
          customer_phone,
          reason_for_call,
          callback_requested,
          full_transcript,
          whatsapp_sent_at
        )
      `)
      .order('start_time', { ascending: false });

    if (error) throw error;
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

    const { data, error } = await supabaseAdmin
      .from('call_summaries')
      .update({
        lead_status: leadStatus,
        appointment_date: appointmentDate,
        notes,
        callback_requested: callbackRequested
      })
      .eq('call_id', callId)
      .select('*');

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Calls API POST] Error updating lead details:', error);
    return NextResponse.json({ error: 'Failed to update lead details' }, { status: 500 });
  }
}

