-- Supabase Database Schema for Jawaab AI WhatsApp CRM & Automation

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.follow_ups CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.ai_responses CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.business_settings CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.prompt_configurations CASCADE;
DROP TABLE IF EXISTS public.onboarding_preferences CASCADE;
DROP TABLE IF EXISTS public.phone_trials CASCADE;

-- Create new WhatsApp-focused schema
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  name text NOT NULL,
  owner_name text NOT NULL,
  whatsapp_number text NOT NULL UNIQUE,
  timezone text DEFAULT 'Asia/Kolkata',
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid UNIQUE REFERENCES public.businesses(id),
  greeting_message text,
  calendar_integration_enabled boolean DEFAULT false,
  google_calendar_id text,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id),
  customer_whatsapp_number text NOT NULL,
  customer_name text,
  first_message_at timestamp with time zone DEFAULT NOW(),
  last_message_at timestamp with time zone DEFAULT NOW(),
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id),
  direction text NOT NULL,
  sender text,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  ai_response_id uuid,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.ai_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id),
  prompt_used text,
  response_generated text NOT NULL,
  confidence_score decimal(3,2),
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id),
  conversation_id uuid REFERENCES public.conversations(id),
  customer_name text,
  customer_phone text NOT NULL,
  customer_email text,
  service_interested text,
  lead_quality_score integer,
  status text DEFAULT 'new',
  source text DEFAULT 'whatsapp',
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id),
  follow_up_number integer DEFAULT 1,
  scheduled_for timestamp with time zone NOT NULL,
  message_content text,
  message_sent boolean DEFAULT false,
  sent_at timestamp with time zone,
  response_received boolean DEFAULT false,
  response_content text,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id),
  business_id uuid REFERENCES public.businesses(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  service text,
  scheduled_time timestamp with time zone NOT NULL,
  status text DEFAULT 'confirmed',
  synced_to_calendar boolean DEFAULT false,
  google_calendar_event_id text,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  plan_name text NOT NULL,
  payment_provider text,
  payment_id text UNIQUE,
  amount_paid decimal(10,2),
  currency text,
  status text DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.onboarding_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  business_type text,
  missed_calls_per_day text,
  current_receptionist_method text,
  primary_goal text,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.phone_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL UNIQUE,
  trial_count integer DEFAULT 0,
  otp_code text,
  otp_attempts integer DEFAULT 0,
  otp_expires_at timestamp with time zone,
  locked_until timestamp with time zone,
  trial_expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Create indices for performance
CREATE INDEX idx_conversations_business_id ON public.conversations(business_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_leads_business_id ON public.leads(business_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_follow_ups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX idx_appointments_business_id ON public.appointments(business_id);
CREATE INDEX idx_follow_ups_scheduled_for ON public.follow_ups(scheduled_for, message_sent);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_trials ENABLE ROW LEVEL SECURITY;
