# Jawaab AI — 24/7 WhatsApp Chat Automation & CRM

Jawaab AI automates WhatsApp inquiries for Indian salons, clinics, and service businesses. Qualify leads with AI, book appointments automatically, and never miss a customer again. All for just ₹799/month.

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

*   **24/7 WhatsApp Chat Automation**: Natural conversation qualifying leads (Inbound lead → AI qualification → appointment booking) and responding instantly.
*   **Conflict-Free Booking Scheduler**: Dynamically validates prospective slots against existing schedules in the database to prevent overlapping appointments.
*   **Google Calendar Integration**: Schedules booking dates dynamically directly into Google Calendar via OAuth2 JWT server-to-server credentials.
*   **Differentiated Dashboards**: 
    *   **Starter**: Clean, minimal 3 metrics, recent leads stream, read-only calendar sync, and quick settings.
    *   **Growth**: Advanced conversion metrics, interactive lead status funnel charts, AI rating scores (1-5), templates suggestion panel, Gmail/Calendar/Sheets integrations, and data exports.
*   **Onboarding plan setup**: Smooth wizard directing users from login/questionnaire to selecting Starter (7-Day Trial) or Growth (redirects to Stripe payment checkout).
*   **SMS/OTP Trial Verification**: Protects trial signups using Twilio-backed phone verification (optional skip option enabled).

---

## 💳 Subscription Tiers (v1 Capabilities Only)

### Starter (₹799/month)
- 7-day free trial (no credit card required)
- Up to 500 WhatsApp AI responses/month
- Basic lead capture from WhatsApp
- Single integration (Google Calendar)
- Email support (24-48hr response)
- Phone verification optional

### Growth (₹1,499/month)
- Unlimited WhatsApp AI responses
- Advanced lead qualification with AI scoring (1-5 rating)
- Automated follow-ups (every 3 days, max 3 attempts)
- Full graphical dashboard & analytics (Funnel chart)
- Multi-integrations (Calendar, Gmail, Sheets)
- Suggested AI responses on dashboard
- Lead tracking & history
- Priority chat support

---

## 🛠️ Tech Stack

*   **Frontend & Routing**: [Next.js 14](https://nextjs.org/) (App Router), TypeScript, Vanilla CSS
*   **Database & Authentication**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Client Auth APIs)
*   **Animations**: [Anime.js](https://animejs.com/) for page loads and progress updates
*   **AI Routing**: [OpenRouter](https://openrouter.ai/) (supporting low-latency models like `meta-llama/llama-3-8b-instruct` or `google/gemini-flash-1.5`)
*   **Communications & Payments**: Meta WhatsApp Cloud API and [Stripe Payments](https://stripe.com/)

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
