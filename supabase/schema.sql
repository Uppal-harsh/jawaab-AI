-- Supabase Database Schema for Jawaab AI

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
    voice_gender TEXT NOT NULL DEFAULT 'female',
    greeting_message TEXT NOT NULL,
    telephony_provider TEXT NOT NULL DEFAULT 'exotel', -- 'exotel' or 'twilio'
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

-- 4. Calls Table
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    telephony_call_id TEXT NOT NULL UNIQUE,
    caller_number TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    recording_url TEXT
);

-- 5. Call Summaries Table
CREATE TABLE IF NOT EXISTS public.call_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE UNIQUE,
    customer_name TEXT,
    customer_phone TEXT NOT NULL,
    reason_for_call TEXT NOT NULL,
    callback_requested BOOLEAN NOT NULL DEFAULT false,
    full_transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE
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

-- Note: Because this is a single-administrator MVP app, all authenticated dashboard users
-- have global control or belong to the only admin context. 
-- Policies below verify that the user is authenticated.

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
    missed_calls_per_day TEXT NOT NULL,
    current_receptionist_method TEXT NOT NULL,
    primary_goal TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.onboarding_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_onboarding ON public.onboarding_preferences 
    FOR ALL USING (auth.role() = 'authenticated');
