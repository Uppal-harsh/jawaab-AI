import { ConversationEngine } from './conversation/engine';
import { KnowledgeRetrievalEngine } from './knowledge/retrieval';
import { PromptBuilder } from './prompt/builder';
import { MemoryStore } from './memory/store';
import { ActionExecutor } from './actions/executor';
import { AnalyticsTracker } from './analytics/tracker';
import { eventBus } from './services/event-bus';
import { IStorageProvider, ILLMProvider, INotificationProvider } from './providers';
import { ChatMessage, CallEvent } from './types';
import { supabaseAdmin } from '../lib/supabase';

export class FlowOrchestrator {
  private engine: ConversationEngine;
  private memory: MemoryStore;
  private executor: ActionExecutor;
  private analytics: AnalyticsTracker;

  constructor(
    storage: IStorageProvider,
    llm: ILLMProvider,
    notification: INotificationProvider
  ) {
    this.engine = new ConversationEngine(storage, llm);
    this.memory = new MemoryStore(storage);
    this.executor = new ActionExecutor(notification);
    this.analytics = new AnalyticsTracker();

    // Wire up Event Bus listeners for decoupled operations
    eventBus.subscribe('speech_input', (e) => {
      console.log(`[Event: Message Input] ChatSid: ${e.callSid}, Query: "${e.payload.query}"`);
    });

    eventBus.subscribe('llm_end', (e) => {
      this.analytics.logMetrics({
        callSid: e.callSid,
        provider: 'openrouter',
        latencyMs: e.payload.latencyMs || 0,
        tokensUsed: e.payload.tokensUsed || 0,
        cost: e.payload.cost || 0,
        timestamp: new Date().toISOString(),
      });
    });

    eventBus.subscribe('action_execute', (e) => {
      console.log(`[Event: Action Triggered] ChatSid: ${e.callSid}, Intent: ${e.payload.intentType}`);
    });
  }

  async processCallTurn(
    callSid: string,
    callerText: string,
    businessId: string
  ): Promise<string> {
    const turnTimestamp = new Date().toISOString();

    // 1. Publish message input event
    eventBus.publish({
      id: Math.random().toString(),
      callSid,
      type: 'speech_input',
      timestamp: turnTimestamp,
      payload: { query: callerText },
    });

    // 2. Fetch business context from storage
    const { business, settings, promptConfig, cards } = await this.engine.getContext(businessId);

    // 3. Retrieve relevant Knowledge Cards (RAG)
    const matchedCards = KnowledgeRetrievalEngine.retrieveRelevantCards(callerText, cards, 3);

    // Fetch active scheduled appointments to avoid conflicts
    const { data: bookings } = await supabaseAdmin
      .from('call_summaries')
      .select('customer_name, appointment_date')
      .not('appointment_date', 'is', null);

    const activeBookings = bookings || [];

    // 4. Build system prompt
    const systemPrompt = PromptBuilder.buildSystemPrompt(business, settings, promptConfig, matchedCards, activeBookings);

    // 5. Load short term session history
    const history = await this.memory.loadSessionHistory(callSid);
    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: 'user', content: callerText, timestamp: turnTimestamp }
    ];

    // 6. Invoke LLM Engine
    eventBus.publish({
      id: Math.random().toString(),
      callSid,
      type: 'llm_start',
      timestamp: new Date().toISOString(),
      payload: { model: 'OpenRouter-Default' },
    });

    const response = await this.engine.generateResponse(updatedHistory, systemPrompt);

    eventBus.publish({
      id: Math.random().toString(),
      callSid,
      type: 'llm_end',
      timestamp: new Date().toISOString(),
      payload: {
        latencyMs: response.latencyMs,
        tokensUsed: response.tokensUsed,
        cost: response.cost,
      },
    });

    let assistantText = response.content;

    // 7. Parse and execute intents (Actions Engine)
    const parsedIntent = this.executor.parseIntent(assistantText);
    if (parsedIntent) {
      assistantText = parsedIntent.payload.cleanText || assistantText;
      eventBus.publish({
        id: Math.random().toString(),
        callSid,
        type: 'action_execute',
        timestamp: new Date().toISOString(),
        payload: { intentType: parsedIntent.type },
      });

      await this.executor.execute(parsedIntent, {
        businessPhone: business?.phone_number || '',
        whatsappNumber: business?.whatsapp_number || '',
      });
    }

    // 8. Save updated transcript history
    updatedHistory.push({
      role: 'assistant',
      content: assistantText,
      timestamp: new Date().toISOString(),
    });
    await this.memory.saveSessionHistory(callSid, updatedHistory);

    return assistantText;
  }
}
