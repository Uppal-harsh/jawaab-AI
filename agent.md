# AGENT.md

# Jawaab AI

## Mission

Your goal is to help build Jawaab AI.

Jawaab AI is an AI receptionist for Indian small businesses.

The mission is simple:

> Never let a small business lose a customer because nobody answered the phone.

Every design decision should support this mission.

If a feature does not improve lead capture, missed-call recovery, or receptionist quality, do not build it.

---

# Development Philosophy

This is a startup MVP.

It is NOT an enterprise application.

Optimize for:

- shipping quickly
- simplicity
- maintainability
- readability
- reliability

Do not optimize for millions of users.

Optimize for the first 100 paying customers.

---

# Product Principles

The product should feel:

- invisible
- trustworthy
- fast
- natural
- premium

Never overcomplicate the experience.

---

# Engineering Principles

Prefer:

Simple code.

Simple architecture.

Simple database.

Simple APIs.

Simple deployment.

Never introduce complexity unless there is a measurable benefit.

---

# Allowed Technologies

Frontend

- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui
- Anime.js

Backend

- Next.js API Routes

Database

- Supabase

Deployment

- Vercel

AI

- OpenRouter

Voice

- Exotel
- Sarvam AI

Notifications

- WhatsApp Business API

Do not replace these technologies unless explicitly instructed.

---

# Do Not Add

Never introduce:

- Redis
- Docker
- Kubernetes
- Kafka
- RabbitMQ
- Microservices
- GraphQL
- Event sourcing
- CQRS
- DDD
- Generic repositories
- Abstract factories
- Plugin systems
- Feature flags
- Analytics dashboards
- Billing
- CRM
- Multi-tenant architecture
- Admin roles
- User permissions
- Notification centers

Unless specifically requested.

---

# UX Philosophy

The UI should feel like:

Linear

Vercel

Raycast

Stripe

Arc Browser

Modern.

Minimal.

Professional.

No visual clutter.

---

# Code Philosophy

Every function should have one responsibility.

Every component should solve one problem.

Avoid deeply nested abstractions.

Prefer explicit code over clever code.

Readable code is better than reusable code when building an MVP.

---

# Data Philosophy

Store only what is necessary.

Avoid unnecessary tables.

Avoid premature normalization.

Do not build for hypothetical future requirements.

---

# AI Philosophy

Never hallucinate business information.

Never invent API responses.

Never fabricate implementation details.

If something is unknown, clearly state assumptions.

---

# Decision Filter

Before generating anything ask internally:

Does this help a business recover a missed customer?

If the answer is no,

do not build it.

---

# Success Metric

A business owner should be able to:

Miss a call

↓

Receive a WhatsApp summary

↓

Call the customer back

↓

Recover the lead

Everything else is secondary.