// Core TypeScript Types for Jawaab AI MVP

export interface Business {
  id: string;
  created_at: string;
  name: string;
  owner_name: string;
  phone_number: string;
  whatsapp_number: string;
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  operating_hours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  fallback_number: string | null;
  voice_gender: 'male' | 'female';
  greeting_message: string;
}

export interface KnowledgeCard {
  id: string;
  business_id: string;
  category: 'pricing' | 'timings' | 'location' | 'services' | 'faq' | string;
  question_trigger: string;
  answer_content: string;
  is_active: boolean;
  created_at: string;
}

export interface Call {
  id: string;
  business_id: string;
  telephony_call_id: string;
  caller_number: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CallSummary {
  id: string;
  call_id: string;
  customer_name: string | null;
  customer_phone: string;
  reason_for_call: string;
  callback_requested: boolean;
  full_transcript: ChatMessage[];
  whatsapp_sent_at: string | null;
}

export interface PromptConfiguration {
  id: string;
  business_id: string;
  system_prompt: string;
  safety_rules: string;
  is_active: boolean;
  created_at: string;
}

// Service Interface Types

export interface TranscribeResult {
  text: string;
  language: string;
  confidence: number;
}

export interface SynthesizeResult {
  audioUrl: string;
  durationSeconds?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
}

export interface WhatsAppNotificationPayload {
  callerName: string;
  callerPhone: string;
  reason: string;
  summary: string;
  urgency: 'high' | 'medium' | 'low';
  callbackRequested: boolean;
  durationSeconds: number;
  recordingUrl?: string;
}
