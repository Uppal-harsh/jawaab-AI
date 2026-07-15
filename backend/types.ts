export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
}

export interface LLMResponse {
  content: string;
  tokensUsed?: number;
  cost?: number;
  latencyMs?: number;
}

export interface KnowledgeCard {
  id: string;
  business_id: string;
  category: string;
  question_trigger: string;
  answer_content: string;
  is_active: boolean;
}

export interface BusinessContext {
  id: string;
  name: string;
  owner_name: string;
  phone_number: string;
  whatsapp_number: string;
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  operating_hours: any;
  fallback_number?: string;
  voice_gender?: string;
  greeting_message: string;
  telephony_provider?: string;
  answering_mode: string;
  language?: string;
}

export interface PromptConfig {
  id: string;
  business_id: string;
  system_prompt: string;
  safety_rules: string;
  is_active: boolean;
}

export interface ActionIntent {
  type: 'BookAppointment' | 'SendWhatsApp' | 'TransferCall' | 'CollectLead' | 'EndConversation' | 'RequestHuman' | 'AnswerQuestion';
  payload: Record<string, any>;
}

export interface CallEvent {
  id: string;
  callSid: string;
  type: 'call_start' | 'speech_input' | 'llm_start' | 'llm_end' | 'action_execute' | 'call_end' | 'error';
  timestamp: string;
  payload: any;
}
