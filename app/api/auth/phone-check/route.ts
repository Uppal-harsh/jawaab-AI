import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const { data: record, error } = await supabaseAdmin
      .from('phone_trials')
      .select('phone_number, trial_expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Phone Check] Error querying DB:', error);
      return NextResponse.json({ verified: false });
    }

    if (record && record.trial_expires_at) {
      const expired = new Date(record.trial_expires_at) < new Date();
      return NextResponse.json({ 
        verified: !expired,
        phoneNumber: record.phone_number,
        trialExpiresAt: record.trial_expires_at
      });
    }

    return NextResponse.json({ verified: false });
  } catch (err: any) {
    console.error('[Phone Check Route Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
