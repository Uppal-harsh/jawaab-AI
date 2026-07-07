import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { validateExotelWebhook } from '../../../../utils/validators';
import { OpenRouterService } from '../../../../services/openrouter';
import { PromptBuilder } from '../../../../services/prompt-builder';
import { WhatsAppService } from '../../../../services/whatsapp';
import { ChatMessage } from '../../../../types';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Jawaab AI Telephony Status Webhook Endpoint is Active. Send a POST request on call completion.'
  });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-exotel-signature');

    if (!validateExotelWebhook(rawBody, signature)) {
      console.warn('[Status Webhook] Unauthorized signature attempt');
      return new NextResponse('Unauthorized Webhook Signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { call_sid, duration, recording_url } = payload;

    if (!call_sid) {
      return NextResponse.json({ error: 'Missing required call session id' }, { status: 400 });
    }

    // 1. Update Call Telemetry
    const { data: call, error: cErr } = await supabaseAdmin
      .from('calls')
      .update({
        end_time: new Date().toISOString(),
        duration_seconds: duration ? parseInt(duration, 10) : null,
        recording_url: recording_url || null,
      })
      .eq('telephony_call_id', call_sid)
      .select('*')
      .maybeSingle();

    if (cErr || !call) {
      console.error(`[Status Webhook] Call session context not found: ${call_sid}`);
      return NextResponse.json({ error: 'Call context not found' }, { status: 404 });
    }

    // Fetch call summary record to access transcript history
    const { data: summaryRecord } = await supabaseAdmin
      .from('call_summaries')
      .select('*')
      .eq('call_id', call.id)
      .maybeSingle();

    if (!summaryRecord) {
      console.warn(`[Status Webhook] No transcript history to summarize for call: ${call.id}`);
      return NextResponse.json({ message: 'No transcript history to process' });
    }

    const transcript: ChatMessage[] = summaryRecord.full_transcript as ChatMessage[];
    
    // 2. Generate structured call intelligence via OpenRouter LLM
    const summaryPrompt = PromptBuilder.buildSummaryPrompt(transcript);
    const llmResponse = await OpenRouterService.executeChat([
      { role: 'user', content: summaryPrompt }
    ], {
      temperature: 0.1,
      maxTokens: 250,
      responseFormat: { type: 'json_object' }
    });

    // Parse structured JSON output from LLM
    let summaryData;
    try {
      summaryData = JSON.parse(llmResponse.content);
    } catch {
      // JSON parser fallback in case formatting rules were violated
      summaryData = {
        customer_name: null,
        reason_for_call: 'Call finished. Summary processing failed.',
        callback_requested: true,
        urgency: 'medium',
        summary: 'Dialogue transcription extraction failed.',
      };
    }

    // 3. Update summary record in database
    await supabaseAdmin
      .from('call_summaries')
      .update({
        customer_name: summaryData.customer_name,
        reason_for_call: summaryData.reason_for_call,
        callback_requested: summaryData.callback_requested,
      })
      .eq('id', summaryRecord.id);

    // 4. Retrieve owner business configurations for WhatsApp delivery
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', call.business_id)
      .single();

    if (business && business.whatsapp_number) {
      // Send alerts through WhatsApp Service
      const success = await WhatsAppService.sendCallSummaryNotification(
        business.whatsapp_number,
        {
          callerName: summaryData.customer_name || 'Anonymous Lead',
          callerPhone: call.caller_number,
          reason: summaryData.reason_for_call,
          summary: summaryData.summary,
          urgency: summaryData.urgency || 'medium',
          callbackRequested: summaryData.callback_requested,
          durationSeconds: duration ? parseInt(duration, 10) : 0,
          recordingUrl: recording_url || undefined,
        }
      );

      if (success) {
        // Record delivery timestamp in Database
        await supabaseAdmin
          .from('call_summaries')
          .update({ whatsapp_sent_at: new Date().toISOString() })
          .eq('id', summaryRecord.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Telephony Status Webhook Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
