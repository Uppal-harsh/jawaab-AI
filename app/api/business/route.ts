import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../lib/supabase';

// Session Validator helper
function isAuthorized(req: Request): boolean {
  const cookie = req.headers.get('cookie') || '';
  return cookie.includes('jawaab_admin_session=authenticated_token_active');
}

const businessSchema = z.object({
  name: z.string().min(1),
  owner_name: z.string().min(1),
  phone_number: z.string().min(10),
  whatsapp_number: z.string().min(10),
  operating_hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  })),
  fallback_number: z.string().nullable(),
  greeting_message: z.string().min(1),
  answering_mode: z.enum(['always_answer', 'forwarded_only']).default('always_answer'),
});

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // For the MVP, retrieve the first business configuration record
    const { data: business, error: bErr } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .maybeSingle();

    if (bErr) throw bErr;
    if (!business) {
      return NextResponse.json({ message: 'No business configured yet' }, { status: 404 });
    }

    const { data: settings, error: sErr } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle();

    if (sErr) throw sErr;

    return NextResponse.json({ business, settings });
  } catch (error) {
    console.error('[Business API GET] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve configuration' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = businessSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const val = result.data;

    // Check if business exists, upsert if so
    const { data: existingBusiness } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .limit(1)
      .maybeSingle();

    let businessId = existingBusiness?.id;

    if (businessId) {
      // Update
      const { error } = await supabaseAdmin
        .from('businesses')
        .update({
          name: val.name,
          owner_name: val.owner_name,
          phone_number: val.phone_number,
          whatsapp_number: val.whatsapp_number,
        })
        .eq('id', businessId);
      
      if (error) throw error;
    } else {
      // Insert
      const { data, error } = await supabaseAdmin
        .from('businesses')
        .insert({
          name: val.name,
          owner_name: val.owner_name,
          phone_number: val.phone_number,
          whatsapp_number: val.whatsapp_number,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      businessId = data.id;
    }

    // Upsert business settings
    const { error: settingsError } = await supabaseAdmin
      .from('business_settings')
      .upsert({
        business_id: businessId,
        operating_hours: val.operating_hours,
        fallback_number: val.fallback_number,
        greeting_message: val.greeting_message,
        answering_mode: val.answering_mode,
      }, { onConflict: 'business_id' });

    if (settingsError) throw settingsError;

    return NextResponse.json({ success: true, businessId });
  } catch (error) {
    console.error('[Business API POST] Error updating details:', error);
    return NextResponse.json({ error: 'Failed to save business details' }, { status: 500 });
  }
}
