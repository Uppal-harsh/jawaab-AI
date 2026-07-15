import { ChatMessage, LLMOptions, LLMResponse } from '../types';

export interface ILLMProvider {
  generateText(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse>;
}


export interface IStorageProvider {
  getCallSession(callSid: string): Promise<any>;
  saveCallSession(callSid: string, data: any): Promise<void>;
  getCallSummaryByCallId(callId: string): Promise<any>;
  saveCallSummary(callId: string, customerPhone: string, data: any): Promise<void>;
  getBusinessDetails(businessId: string): Promise<any>;
  getBusinessSettings(businessId: string): Promise<any>;
  getPromptConfig(businessId: string): Promise<any>;
  getKnowledgeCards(businessId: string): Promise<any[]>;
}

export interface INotificationProvider {
  sendWhatsAppNotification(to: string, message: string): Promise<void>;
}
