import { NextResponse } from 'next/server';
import { OpenRouterService } from '../../../../services/openrouter';

export async function POST(req: Request) {
  try {
    const { name, owner_name, phone_number, greeting_message } = await req.json();

    const systemPrompt = `You are an expert AI system prompt copywriter. Your task is to generate a comprehensive, professional system prompt for a WhatsApp bot assistant.`;
    const userPrompt = `
Generate a system prompt based on these business details:
- Business Name: ${name || 'N/A'}
- Owner Name: ${owner_name || 'N/A'}
- Business Phone: ${phone_number || 'N/A'}
- Welcome Greeting: ${greeting_message || 'N/A'}

Rules for the generated system prompt:
1. Write in the 2nd person (e.g. "You are an assistant...").
2. Detail how to greet clients, answer FAQs politely, gather appointment preferences, and avoid double booking.
3. Keep the prompt instructions concise, clear, and structured (under 1000 characters). Do not include any tags or intro text like "Here is your prompt". Only output the prompt instructions.
`.trim();

    const response = await OpenRouterService.executeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        temperature: 0.7,
        maxTokens: 500
      }
    );

    return NextResponse.json({ script: response.content.trim() });
  } catch (err: any) {
    console.error('[Script Generator API Error]:', err);
    return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
  }
}
