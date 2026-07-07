# Dependency Injection Graph

This graph outlines the service layers and concrete providers injected into the core conversational engine of Jawaab AI.

```mermaid
graph TD
    A[Webhook Controllers / API Routes] -->|Instantiates| B(Concrete Providers)
    B -->|SupabaseStorageProvider| C[IStorageProvider]
    B -->|OpenRouterLLMProvider| D[ILLMProvider]
    B -->|WhatsAppNotificationProvider| E[INotificationProvider]
    B -->|ExotelVoiceProvider| F[IVoiceProvider]
    
    C -->|Injected Into| G[FlowOrchestrator]
    D -->|Injected Into| G
    E -->|Injected Into| G
    
    G -->|Instantiates| H[ConversationEngine]
    G -->|Instantiates| I[MemoryStore]
    G -->|Instantiates| J[ActionExecutor]
    G -->|Instantiates| K[AnalyticsTracker]
    
    H -.->|Uses| C
    H -.->|Uses| D
    I -.->|Uses| C
    J -.->|Uses| E
```

---

## 🔌 Decoupled Integration Pattern

Every module is built to depend on abstract interfaces instead of specific database clients, network addresses, or API keys:

1.  **Orchestrator Boundaries**: `FlowOrchestrator` receives interfaces `IStorageProvider`, `ILLMProvider`, and `INotificationProvider` inside its constructor.
2.  **No Global Scope Pollution**: Services never create client wrappers internally, preventing testing locks and making it simple to swap providers (e.g., swapping Exotel for other carriers, or OpenRouter for a direct Anthropic SDK integration).
