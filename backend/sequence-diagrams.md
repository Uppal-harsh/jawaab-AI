# Sequence Diagrams — Call Lifecycle Hooks

These sequence diagrams outline the message passings between the telephony provider, our backend routes, the event orchestrator, and external API providers.

## 1. Active Conversation Turn Loop

```mermaid
sequenceDiagram
    autonumber
    actor Caller
    participant Phone as Telephony Provider
    participant API as Process Webhook Route
    participant Flow as Flow Orchestrator
    participant RAG as Knowledge Retrieval
    participant LLM as LLM Provider (OpenRouter)
    participant DB as Storage Provider (Supabase)
    participant Bus as Event Bus

    Caller->>Phone: Speaks "What are your business hours?"
    Phone->>API: HTTP POST Webhook (SpeechResult: "What are your business hours?")
    Note over API: Validate Webhook Signature
    
    API->>Flow: processCallTurn(callSid, query, businessId)
    Flow->>Bus: publish(speech_input)
    
    Flow->>DB: getBusinessSettings(businessId)
    DB-->>Flow: Settings context (language, voice_gender)
    
    Flow->>DB: getKnowledgeCards(businessId)
    DB-->>Flow: Raw Q&A Cards
    
    Flow->>RAG: retrieveRelevantCards(query, cards)
    RAG-->>Flow: Matched timing cards
    
    Flow->>LLM: generateText(compiledMessages)
    LLM->>LLM: Attempt OpenRouter Chat Completions
    LLM-->>Flow: Response content + Latency/Token metrics
    
    Flow->>Bus: publish(llm_end)
    Flow->>DB: saveCallSession(callSid, updatedHistory)
    
    Flow-->>API: Response text ("We are open from 9 AM to 6 PM.")
    API->>Phone: HTTP 200 XML (<Say>We are open...</Say><Gather/>)
    Phone->>Caller: Speaks response & waits for input
```

## 2. Intent Action Execution Flow

```mermaid
sequenceDiagram
    autonumber
    participant Flow as Flow Orchestrator
    participant Exec as Action Executor
    participant Bus as Event Bus
    participant Notify as Notification Provider

    Note over Flow: LLM response contains "[INTENT: BookAppointment]"
    Flow->>Exec: parseIntent(rawResponseText)
    Exec-->>Flow: { type: "BookAppointment", cleanText: "I'll request the owner..." }
    
    Flow->>Bus: publish(action_execute)
    Flow->>Exec: execute(intent, context)
    Exec->>Notify: sendWhatsAppNotification(ownerPhone, message)
    Notify-->>Exec: WhatsApp dispatched successfully
    Note over Flow: Returns cleanText to Caller (stripping intent tag)
```
