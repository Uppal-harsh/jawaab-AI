import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../lib/supabase';

function isAuthorized(req: Request): boolean {
  const cookie = req.headers.get('cookie') || '';
  return cookie.includes('jawaab_admin_session=authenticated_token_active');
}

const cardSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1),
  question_trigger: z.string().min(1),
  answer_content: z.string().min(1),
  is_active: z.boolean().default(true),
});

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: cards, error } = await supabaseAdmin
      .from('knowledge_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('[Knowledge Cards GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = cardSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { category, question_trigger, answer_content, is_active } = result.data;

    // Retrieve global business ID context
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: 'No business profile initialized. Configure business settings first.' }, { status: 400 });
    }

    const { data: card, error } = await supabaseAdmin
      .from('knowledge_cards')
      .insert({
        business_id: business.id,
        category,
        question_trigger,
        answer_content,
        is_active,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error('[Knowledge Cards POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = cardSchema.extend({ id: z.string().uuid() }).safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { id, category, question_trigger, answer_content, is_active } = result.data;

    const { data: card, error } = await supabaseAdmin
      .from('knowledge_cards')
      .update({
        category,
        question_trigger,
        answer_content,
        is_active,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error('[Knowledge Cards PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing card ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('knowledge_cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Knowledge Cards DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
