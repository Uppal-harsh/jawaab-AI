-- Supabase Database Schema for Jawaab AI WhatsApp CRM & Automation

-- 1. Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    whatsapp_number TEXT NOT NULL
);

-- 2. Business Settings Table
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    operating_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
    fallback_number TEXT,
    greeting_message TEXT NOT NULL,
    answering_mode TEXT NOT NULL DEFAULT 'always_answer' -- 'always_answer' or 'forwarded_only'
);

-- 3. Knowledge Cards Table
CREATE TABLE IF NOT EXISTS public.knowledge_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- e.g., 'pricing', 'timings', 'location', 'services', 'faq'
    question_trigger TEXT NOT NULL,
    answer_content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Chats (WhatsApp Sessions) Table
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    telephony_call_id TEXT NOT NULL UNIQUE, -- repurposed for WhatsApp message/chat session ID
    caller_number TEXT NOT NULL,          -- customer WhatsApp number
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,             -- unused/null
    recording_url TEXT                    -- unused/null
);

-- 5. CRM Leads / Chat Summaries Table
CREATE TABLE IF NOT EXISTS public.call_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE UNIQUE,
    customer_name TEXT,
    customer_phone TEXT NOT NULL,
    reason_for_call TEXT NOT NULL,        -- Reason for inquiry / chat
    callback_requested BOOLEAN NOT NULL DEFAULT false, -- Follow up / human requested
    full_transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
    lead_status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Contacted', 'Appointment Booked', 'Closed'
    appointment_date TEXT,                -- Scheduled appointment date/time
    notes TEXT                            -- Owner internal notes
);

-- 6. Prompt Configurations Table
CREATE TABLE IF NOT EXISTS public.prompt_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    system_prompt TEXT NOT NULL,
    safety_rules TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance Optimization
CREATE INDEX IF NOT EXISTS calls_telephony_call_id_idx ON public.calls(telephony_call_id);
CREATE INDEX IF NOT EXISTS calls_business_id_idx ON public.calls(business_id);
CREATE INDEX IF NOT EXISTS knowledge_cards_business_id_idx ON public.knowledge_cards(business_id);
CREATE INDEX IF NOT EXISTS call_summaries_call_id_idx ON public.call_summaries(call_id);
CREATE INDEX IF NOT EXISTS prompt_configurations_business_id_idx ON public.prompt_configurations(business_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_businesses ON public.businesses 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY admin_all_settings ON public.business_settings 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY admin_all_knowledge ON public.knowledge_cards 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY admin_all_calls ON public.calls 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY admin_all_summaries ON public.call_summaries 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY admin_all_prompts ON public.prompt_configurations 
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Onboarding Preferences Table
CREATE TABLE IF NOT EXISTS public.onboarding_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    business_type TEXT NOT NULL,
    missed_calls_per_day TEXT NOT NULL,   -- Repurposed / customer inquiries per day
    current_receptionist_method TEXT NOT NULL,
    primary_goal TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.onboarding_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_onboarding ON public.onboarding_preferences 
    FOR ALL USING (auth.role() = 'authenticated');

-- 8. Phone Trials & OTP Verification Table
CREATE TABLE IF NOT EXISTS public.phone_trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL UNIQUE,
    trial_count INTEGER NOT NULL DEFAULT 0,
    otp_code TEXT,
    otp_attempts INTEGER NOT NULL DEFAULT 0,
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    locked_until TIMESTAMP WITH TIME ZONE,
    trial_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.phone_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY anonymous_all_trials ON public.phone_trials 
    FOR ALL USING (true);
