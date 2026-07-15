import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { phone, code, userId } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and 6-digit verification code are required' }, { status: 400 });
    }

    const now = new Date();

    // 1. Retrieve the OTP verification record
    const { data: record, error: getErr } = await supabaseAdmin
      .from('phone_trials')
      .select('*')
      .eq('phone_number', phone)
      .maybeSingle();

    if (getErr || !record) {
      return NextResponse.json({ error: 'No verification record found for this number' }, { status: 404 });
    }

    // 2. Check lockout expiration
    if (record.locked_until && new Date(record.locked_until) > now) {
      return NextResponse.json({ error: 'Phone number locked due to multiple failed attempts. Try again in 24 hours.' }, { status: 403 });
    }

    // 3. Verify code expiry
    if (record.otp_expires_at && new Date(record.otp_expires_at) < now) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    // 4. Handle mismatch verification
    if (record.otp_code !== code) {
      const attempts = record.otp_attempts + 1;
      
      if (attempts >= 3) {
        // Lock phone for 24 hours
        const lockTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from('phone_trials')
          .update({
            otp_attempts: attempts,
            locked_until: lockTime,
            otp_code: null // invalidate code on lockout
          })
          .eq('phone_number', phone);

        return NextResponse.json({ 
          error: 'Failed 3 verification attempts. This number has been locked for 24 hours.' 
        }, { status: 403 });
      }

      // Record incremented failed attempt
      await supabaseAdmin
        .from('phone_trials')
        .update({ otp_attempts: attempts })
        .eq('phone_number', phone);

      return NextResponse.json({ 
        error: `Incorrect verification code. Attempts left: ${3 - attempts}` 
      }, { status: 400 });
    }

    // 5. Verification Successful: Grant 7-day trial access
    const trialCount = record.trial_count + 1;
    const trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from('phone_trials')
      .update({
        user_id: userId || null,
        trial_count: trialCount,
        otp_attempts: 0,
        otp_code: null,
        otp_expires_at: null,
        trial_expires_at: trialExpiresAt
      })
      .eq('phone_number', phone);

    if (updateErr) {
      console.error('[OTP Verify] DB update error:', updateErr);
      return NextResponse.json({ error: 'Failed to record successful trial' }, { status: 500 });
    }

    // 6. Send SMS confirmation via Twilio if configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && twilioPhone && !accountSid.includes('your-')) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', phone);
        params.append('From', twilioPhone);
        params.append('Body', `Congratulations! Your Jawaab AI 7-Day Free Trial has been activated. Expires on ${new Date(trialExpiresAt).toLocaleDateString()}.`);

        await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });
      } catch (smsErr) {
        console.error('[OTP Verify] Twilio confirmation SMS failed:', smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      trialCount,
      trialExpiresAt,
      message: 'OTP verified successfully. Free trial granted.'
    });

  } catch (err: any) {
    console.error('[OTP Verify Route Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
