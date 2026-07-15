# Jawaab AI — 24/7 WhatsApp Chat Automation & CRM

Jawaab AI is an intelligent WhatsApp-based chat automation assistant and CRM system built for Indian SMBs (salons, clinics, coaching institutes). It automatically replies to customer inquiries, captures lead logs, schedules non-overlapping appointments, syncs bookings directly with Google Calendar, and alerts business owners on WhatsApp.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Customer Message] -->|WhatsApp| B(Meta Cloud API Webhook)
    B -->|Trigger webhook| C[Next.js App Server]
    C -->|Fetch profile, cards & schedules| D[(Supabase DB)]
    C -->|Construct context & prompts| E[OpenRouter LLM]
    E -->|Generate natural response| C
    C -->|1. Reply to customer| A
    C -->|2. Sync Booking Event| F[Google Calendar Sync]
    C -->|3. Notify Owner| G[Owner WhatsApp Alert]
    H[Admin Dashboard] -->|Manage settings, Q&As & view CRM logs| D
```

### Flow Breakdown:
1. **WhatsApp Webhook Interception**: When a customer messages the business's WhatsApp number, Meta Cloud API sends a webhook to the Next.js API router.
2. **Context Assembly**: The webhook handler queries active Q&A Knowledge Cards and upcoming booked appointments from Supabase to prevent scheduling conflicts.
3. **LLM Engine Routing**: The orchestrator sends the context to the OpenRouter LLM service to produce an optimized Hinglish, Hindi, or English reply.
4. **Calendar Sync & Owner Alert**: If the customer books a slot, the system maps the appointment to the database, syncs it dynamically with Google Calendar (using signed Google JWT tokens), and forwards a summary notification directly to the owner's WhatsApp number.

---

## 📁 Project Structure (Codebase Skeleton)

```
jawaab-ai/
├── app/                              # Next.js App Router Pages & APIs
│   ├── api/                          # Backend API Handlers
│   │   ├── auth/                     # Session, Cookie, & OTP verification routes
│   │   ├── business/                 # Profile management & AI script generator
│   │   ├── calls/                    # CRM chat history logs
│   │   ├── knowledge-cards/          # Q&A fact card CRUD
│   │   └── whatsapp/                 # WhatsApp Webhook receiver
│   ├── dashboard/                    # CRM Console (Leads charts, History logs, settings)
│   ├── demo/                         # Sandbox sandbox layout
│   ├── login/                        # Dual-panel login with phone verification interrupts
│   ├── onboarding/                   # Onboarding setup wizard
│   ├── pricing/                      # Pricing plans with SMS/OTP signup popup
│   └── page.tsx                      # Landing/Home page
├── components/                       # Shared React Components (Navbar, Button, BrandLogo)
├── hooks/                            # Custom React hooks (anime animations)
├── lib/                              # Shared configs (Supabase client init, env validation)
├── public/                           # Static Assets (favicon /icon.png, /logo.png, /panda-404.png)
├── services/                         # External services (OpenRouter LLM & Google Calendar sync)
├── supabase/                         # Database schema configuration
│   └── schema.sql                    # Postgres DB structure setup script
└── types/                            # Shared TypeScript interfaces
```

---

## 🚀 Key Features

*   **24/7 WhatsApp Chat Automation**: Natural conversation answering custom FAQ inquiries and capturing leads instantly.
*   **Conflict-Free Booking Scheduler**: Dynamically validates prospective slots against existing schedules in the database to prevent overlapping appointments.
*   **Google Calendar Integration**: Schedules booking dates dynamically directly into Google Calendar via OAuth2 JWT server-to-server credentials.
*   **WhatsApp CRM Alerts**: Instantly notifies the business owner's WhatsApp when a booking succeeds or a human fallback is requested.
*   **Circular Progress Gauge**: Displays profile completion rates (General details, Greeting, Bot Script) with locks to ensure bots are configured before starting.
*   **AI script Builder**: Drafts optimized conversational instructions using OpenRouter based on profile characteristics.
*   **SMS/OTP Trial Verification**: Protects trial signups using Twilio-backed phone verification and automatic 24-hour lockout rules.

---

## 🛠️ Tech Stack

*   **Frontend & Routing**: [Next.js 14](https://nextjs.org/) (App Router), TypeScript, Vanilla CSS
*   **Database & Authentication**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Client Auth APIs)
*   **Animations**: [Anime.js](https://animejs.com/) for page loads and progress updates
*   **AI Routing**: [OpenRouter](https://openrouter.ai/) (supporting low-latency models like `meta-llama/llama-3-8b-instruct` or `google/gemini-flash-1.5`)
*   **Communications (SMS & CRM)**: [Twilio SMS](https://www.twilio.com/) (for OTP validation) and Meta WhatsApp Cloud API

---

## ⚙️ Project Setup & Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` or `.env.local` file at the root of your project:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenRouter API Configuration
OPENROUTER_API_KEY=your-openrouter-key

# Meta WhatsApp Business API Credentials
WHATSAPP_API_KEY=your-meta-access-token
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-id

# Twilio Credentials (SMS OTP Verification)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Google Service Account JSON credentials (For Calendar sync)
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."
GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com
```

### 3. Setup Database Schema (Supabase)
Import the schema located in `supabase/schema.sql` into your Supabase SQL Editor:
*   `businesses` — Stores registration info and owner details.
*   `business_settings` — Handles operating hours, greeting templates, and answering rules.
*   `knowledge_cards` — Custom business Q&A facts.
*   `calls` — Logs client phone numbers, sessions, and chat activity status.
*   `call_summaries` — Analyzes client transcripts and schedules.
*   `prompt_configurations` — Custom system prompts and bot script guidelines.
*   `phone_trials` — Manages trial lockouts, OTP codes, and active expirations.
*   `onboarding_preferences` — Configuration choices made during setup.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the landing page and dashboard.
