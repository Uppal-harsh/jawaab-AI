import { ILLMProvider } from './index';
import { ChatMessage, LLMOptions, LLMResponse } from '../types';
import { env } from '../../lib/env';

export class OpenRouterLLMProvider implements ILLMProvider {
  private apiKey: string;
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private defaultModel = 'meta-llama/llama-3.1-8b-instruct'; // Balanced latency & accuracy

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.OPENROUTER_API_KEY;
  }

  async generateText(messages: ChatMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const modelName = options.model || this.defaultModel;
    const payload = {
      model: modelName,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 120,
      response_format: options.responseFormat,
    };

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://jawaab-ai.vercel.app/',
      'X-Title': 'Jawaab AI Production Engine',
    };

    let attempts = 3;
    let delay = 1000;
    const startTime = Date.now();

    while (attempts > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Strict 8s voice limit

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API returned ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const latencyMs = Date.now() - startTime;

        if (!data.choices || data.choices.length === 0) {
          throw new Error('OpenRouter response has no choices.');
        }

        const content = data.choices[0].message.content || '';
        const inputTokens = data.usage?.prompt_tokens || 0;
        const outputTokens = data.usage?.completion_tokens || 0;
        const totalTokens = inputTokens + outputTokens;

        // Estimated cost based on typical Gemini 1.5 Flash rates ($0.075 / 1M input, $0.3 / 1M output)
        const cost = (inputTokens * 0.000075 / 1000) + (outputTokens * 0.0003 / 1000);

        return {
          content,
          tokensUsed: totalTokens,
          cost,
          latencyMs,
        };
      } catch (error) {
        attempts--;
        if (attempts === 0) {
          console.error('[OpenRouterLLMProvider] Exhausted all LLM fetch retries:', error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error('OpenRouter call failed');
  }
}
