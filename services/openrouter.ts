import { env } from '../lib/env';
import { LLMResponse } from '../types';

export class OpenRouterService {
  private static apiKey = env.OPENROUTER_API_KEY;
  private static apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  // High quality, low-latency instruction model suitable for conversational voice tasks
  private static defaultModel = 'anthropic/claude-3.5-haiku';

  /**
   * Execute chat completions with OpenRouter
   */
  static async executeChat(
    messages: { role: string; content: string }[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      responseFormat?: { type: 'json_object' };
    } = {}
  ): Promise<LLMResponse> {
    const payload = {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 150,
      response_format: options.responseFormat,
    };

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://jawaab-ai.vercel.app/', // Required by OpenRouter rules
      'X-Title': 'Jawaab AI MVP Receptionist',
    };

    let attempts = 3;
    let delay = 1000;

    while (attempts > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s strict timeout for voice pipeline latency

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API returned HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('OpenRouter response contains no output choices.');
        }

        return {
          content: data.choices[0].message.content.trim(),
          model: data.model || payload.model,
        };
      } catch (error) {
        attempts--;
        if (attempts <= 0) {
          console.error('[OpenRouterService] Failed executeChat operations:', error);
          throw error;
        }
        console.warn(`[OpenRouterService] Error encountered. Retrying in ${delay}ms. Error: ${error instanceof Error ? error.message : String(error)}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error('OpenRouter API request failed after maximum retry attempts.');
  }
}
