import { CallEvent } from '../types';

type EventCallback = (event: CallEvent) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private listeners: Record<string, EventCallback[]> = {};

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe(eventType: string, callback: EventCallback): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  }

  publish(event: CallEvent): void {
    const targets = [event.type, '*'];
    
    targets.forEach(target => {
      if (this.listeners[target]) {
        this.listeners[target].forEach(async (callback) => {
          try {
            await callback(event);
          } catch (e) {
            console.error(`[EventBus] Error in event listener for ${event.type}:`, e);
          }
        });
      }
    });
  }
}
export const eventBus = EventBus.getInstance();
