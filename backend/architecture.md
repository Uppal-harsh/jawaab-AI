# System Architecture — Jawaab AI Production Backend

Jawaab AI's Phase 2 Backend is designed as a modular, decoupled, and event-driven voice processing platform. By abstracting integrations behind provider interfaces, the platform can scale to handle high concurrency and adapt to new models or telephony networks without rewriting core logic.

```
                  ┌────────────────────────────────────────┐
                  │            Event Bus (Hub)             │
                  └──────────────────┬─────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐        ┌──────────────────┐
│  Voice Provider  │       │   LLM Provider   │        │ Storage Provider │
│     (Exotel)     │       │   (OpenRouter)   │        │    (Supabase)    │
└──────────────────┘       └──────────────────┘        └──────────────────┘
```

---

## 🧩 Architectural Components

### 1. Conversation Engine (`backend/conversation/engine.ts`)
*   **Orchestrator of States**: Maintains the context list, limits token window size by slicing past messages, and handles transcript summarization.
*   **No DB or Network calls**: Interacts with the external systems solely through injected interface drivers.

### 2. Knowledge Engine (`backend/knowledge/retrieval.ts`)
*   **Dynamic Q&A Retrieval (RAG)**: Scores all active Q&A business cards against the caller's text using matching categories, keyword frequencies, and trigger phrases. Returns only the top $N$ relevant cards.

### 3. Prompt Engine (`backend/prompt/builder.ts`)
*   **Prompt Assembly**: Packages prompt payloads matching voice settings, tone, safety constraints, multilingual directives (Hinglish/Hindi/English), and injects context facts.

### 4. Memory Engine (`backend/memory/store.ts`)
*   **Storage decoupled**: Loads, saves, and continues conversation history across sessions via the storage provider.

### 5. Action Engine (`backend/actions/executor.ts`)
*   **LLM Intents Executor**: Intercepts structural tags like `[INTENT: BookAppointment]` or `[INTENT: RequestHuman]` emitted by the LLM and dispatches execution blocks.

### 6. Analytics Tracker (`backend/analytics/tracker.ts`)
*   Logs performance parameters (LLM latency, costs, token usage, durations) separate from main business transcripts.

---

## ⚡ Event-Driven Decoupling
An event broker (`EventBus`) publishes lifecycle triggers for call turns:
*   `speech_input`: Captures caller questions.
*   `llm_start` & `llm_end`: Measures latency, counts tokens, and computes cost.
*   `action_execute`: Executes WhatsApp dispatches or transfers.
*   `error`: Safely records failures and triggers recovery actions.
