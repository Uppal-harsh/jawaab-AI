import { IStorageProvider, ILLMProvider } from '../providers';
import { ChatMessage, BusinessContext, BusinessSettings, PromptConfig, KnowledgeCard, LLMResponse } from '../types';

export class ConversationEngine {
  private storage: IStorageProvider;
  private llm: ILLMProvider;
  private maxHistoryWindow = 12; // Retain last 12 messages to prevent token bloat

  constructor(storage: IStorageProvider, llm: ILLMProvider) {
    this.storage = storage;
    this.llm = llm;
  }

  async getContext(businessId: string): Promise<{
    business: BusinessContext;
    settings: BusinessSettings;
    promptConfig: PromptConfig;
    cards: KnowledgeCard[];
  }> {
    const [business, settings, promptConfig, cards] = await Promise.all([
      this.storage.getBusinessDetails(businessId),
      this.storage.getBusinessSettings(businessId),
      this.storage.getPromptConfig(businessId),
      this.storage.getKnowledgeCards(businessId),
    ]);

    const fallbackSettings: BusinessSettings = {
      id: '',
      business_id: businessId,
      operating_hours: {},
      voice_gender: 'female',
      greeting_message: `Hello. Welcome to ${business?.name || 'our clinic'}. How can we help you?`,
      telephony_provider: 'exotel',
      answering_mode: 'always_answer',
      language: 'auto'
    };

    return { 
      business, 
      settings: settings || fallbackSettings, 
      promptConfig, 
      cards 
    };
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    options: { model?: string; temperature?: number } = {}
  ): Promise<LLMResponse> {
    const prunedHistory = this.pruneHistory(messages);
    const compiledMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt, timestamp: new Date().toISOString() },
      ...prunedHistory,
    ];

    return this.llm.generateText(compiledMessages, {
      model: options.model,
      temperature: options.temperature,
    });
  }

  private pruneHistory(history: ChatMessage[]): ChatMessage[] {
    if (history.length <= this.maxHistoryWindow) {
      return history;
    }
    // Retain last N messages
    return history.slice(-this.maxHistoryWindow);
  }

  async summarizeSession(history: ChatMessage[]): Promise<string> {
    if (history.length === 0) return 'No conversation logged.';
    
    const summaryPrompt: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an analytics compiler. Summarize this telephone conversation transcript between a voice assistant and a caller in exactly two sentences.',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'user',
        content: JSON.stringify(history),
        timestamp: new Date().toISOString(),
      }
    ];

    try {
      const response = await this.llm.generateText(summaryPrompt, { temperature: 0.1, maxTokens: 80 });
      return response.content;
    } catch (e) {
      console.warn('[ConversationEngine] Failed to summarize conversation session:', e);
      return 'Call summary generation failed.';
    }
  }
}
