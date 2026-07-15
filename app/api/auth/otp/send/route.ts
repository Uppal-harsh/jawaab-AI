import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { phone, email } = await req.json();

    if (!phone || !phone.startsWith('+')) {
      return NextResponse.json({ error: 'Valid phone number with country code is required (e.g. +91...)' }, { status: 400 });
    }

    const now = new Date();

    // 1. Retrieve existing phone trials record
    const { data: record, error: getErr } = await supabaseAdmin
      .from('phone_trials')
      .select('*')
      .eq('phone_number', phone)
      .maybeSingle();

    if (getErr) {
      console.error('[OTP Send] Error getting phone_trials:', getErr);
    }

    // 2. Check if phone is locked (24-hour lockout)
    if (record && record.locked_until && new Date(record.locked_until) > now) {
      const hoursLeft = Math.ceil((new Date(record.locked_until).getTime() - now.getTime()) / (1000 * 60 * 60));
      return NextResponse.json({ 
        error: `Phone number is temporarily locked due to 3 incorrect attempts. Try again in ${hoursLeft} hours.` 
      }, { status: 403 });
    }

    // 3. Check if phone has reached the limit of 3 trials
    if (record && record.trial_count >= 3) {
      return NextResponse.json({ 
        error: "You've used your trial limit. Upgrade to Starter or contact sales." 
      }, { status: 400 });
    }

    // 4. Generate 6-digit OTP code & 10-minute expiry
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 5. Upsert trial OTP state in database
    const { error: upsertErr } = await supabaseAdmin
      .from('phone_trials')
      .upsert({
        phone_number: phone,
        otp_code: otpCode,
        otp_attempts: 0, // Reset attempts on new OTP request
        otp_expires_at: otpExpiresAt,
        locked_until: null, // Clear past lockouts
      }, { onConflict: 'phone_number' });

    if (upsertErr) {
      console.error('[OTP Send] Database upsert error:', upsertErr);
      return NextResponse.json({ error: 'Failed to initialize verification state' }, { status: 500 });
    }

    // 6. Send OTP via Twilio if credentials exist; fallback to simulated debug response
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    let smsSent = false;
    if (accountSid && authToken && twilioPhone && !accountSid.includes('your-')) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', phone);
        params.append('From', twilioPhone);
        params.append('Body', `Your Jawaab AI verification code is ${otpCode}. It expires in 10 minutes.`);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (res.ok) {
          smsSent = true;
          console.log(`[OTP Send] Twilio SMS dispatched successfully to ${phone}`);
        } else {
          console.error('[OTP Send] Twilio API responded with error status:', res.status, await res.text());
        }
      } catch (smsErr) {
        console.error('[OTP Send] Twilio fetch failed:', smsErr);
      }
    }

    // If Twilio isn't active or fails, return a success with simulated fallback for developer ease
    return NextResponse.json({
      success: true,
      simulated: !smsSent,
      // For developer verification without active Twilio credits, expose code in mock responses
      debugCode: !smsSent ? otpCode : undefined, 
      message: smsSent ? 'OTP sent successfully via SMS' : 'OTP verification simulated (see console / debugCode)'
    });

  } catch (err: any) {
    console.error('[OTP Send Route Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
