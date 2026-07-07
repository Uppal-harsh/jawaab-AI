# Conversational Call Flow & Execution Pipeline

This document maps out the processing lifecycle of a caller turn within Jawaab AI from voice capture to synthesized speech output.

```
Caller Speech
     │
     ▼
Telephony Webhook ──> Validate Signature ──> Load Call Session
                                                  │
                                                  ▼
Flow Orchestrator <─────────────────────── processCallTurn
   ├── 1. Publish Event (speech_input)
   ├── 2. Fetch Business Context & Settings
   ├── 3. Semantic Card Retrieval (RAG)
   ├── 4. Compile Multilingual Prompt
   ├── 5. Query OpenRouter LLM
   ├── 6. Parse & Execute Intents (Actions Engine)
   └── 7. Save Session History (Memory Engine)
                                                  │
                                                  ▼
Telephony Response <── Generate TwiML XML <───────┴── Speak Speech Response
```

## 🔄 Execution Sequence Details

1.  **Call Webhook Capture**: The caller's voice response is captured by Exotel (and transcribed via Sarvam Service). A webhook triggers the process API.
2.  **Validation & Handshake**: Webhook signatures are validated. The active database call session is fetched.
3.  **Context Fetching**: Settings, prompts, and knowledge cards are loaded via the `StorageProvider`.
4.  **RAG Semantic Search**: The retrieval engine parses the caller's text and selects only the top 3 most relevant Knowledge Cards.
5.  **Prompt Assembly**: The Prompt Builder wraps tone settings, safety constraints, language selection instructions, and matched cards into an optimized system prompt.
6.  **LLM Call**: The `LLMProvider` invokes the OpenRouter API with a fallback chain, auto-retries, and token-logging trackers.
7.  **Intent Parsing & Execution**: The `ActionExecutor` searches the response for tags like `[INTENT: BookAppointment]`. If found:
    *   The raw intent is executed (e.g. sending a WhatsApp notification to the owner).
    *   The tag is stripped from the spoken text.
8.  **XML Generation**: The response is returned to the telephony provider in standard XML format (`<Say>` + `<Gather>`) to read the text back to the caller and keep the call active.
