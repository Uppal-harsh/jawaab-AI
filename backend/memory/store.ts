import { ChatMessage } from '../types';
import { IStorageProvider } from '../providers';

export class MemoryStore {
  private storage: IStorageProvider;

  constructor(storage: IStorageProvider) {
    this.storage = storage;
  }

  async loadSessionHistory(callSid: string): Promise<ChatMessage[]> {
    try {
      const session = await this.storage.getCallSession(callSid);
      if (session) {
        const summary = await this.storage.getCallSummaryByCallId(session.id);
        if (summary && summary.full_transcript) {
          return summary.full_transcript as ChatMessage[];
        }
      }
    } catch (e) {
      console.warn('[MemoryStore] Failed to load history, starting clean session:', e);
    }
    return [];
  }

  async saveSessionHistory(callSid: string, history: ChatMessage[]): Promise<void> {
    try {
      const session = await this.storage.getCallSession(callSid);
      if (session) {
        await this.storage.saveCallSummary(session.id, session.caller_number, {
          full_transcript: history,
          reason_for_call: 'In conversation...'
        });
      }
    } catch (e) {
      console.error('[MemoryStore] Failed to persist session history:', e);
    }
  }

  async loadLongTermMemory(callerNumber: string): Promise<string | null> {
    // In production, this can query historical calls from callerNumber to get context on prior requests
    return null;
  }
}
