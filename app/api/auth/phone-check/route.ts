import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    // 1. Check if user has an active subscription
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();

    if (sub && sub.status === 'active') {
      return NextResponse.json({ 
        verified: true,
        phoneNumber: '',
        trialExpiresAt: null,
        subscriptionActive: true
      });
    }

    // 2. Check if phone trial record exists (meaning they verified phone in the past)
    const { data: record, error } = await supabaseAdmin
      .from('phone_trials')
      .select('phone_number, trial_expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Phone Check] Error querying DB:', error);
      return NextResponse.json({ verified: false });
    }

    // For now, phone verification is optional. Return verified: true.
    return NextResponse.json({ 
      verified: true,
      phoneNumber: record?.phone_number || '',
      trialExpiresAt: record?.trial_expires_at || null
    });
  } catch (err: any) {
    console.error('[Phone Check Route Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
