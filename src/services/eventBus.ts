/**
 * Event Bus Service
 * 
 * A centralized event bus for decoupled component communication
 */

type EventHandler<T = any> = (data: T) => void | Promise<void>;
type UnsubscribeFn = () => void;

class EventBusService {
  private events: Map<string, Set<EventHandler>> = new Map();
  private historyEnabled: boolean = false;
  private eventHistory: Array<{timestamp: number, event: string, data: any}> = [];

  /**
   * Subscribe to an event
   * @param event Event name
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  on<T = any>(event: string, handler: EventHandler<T>): UnsubscribeFn {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    this.events.get(event)!.add(handler as EventHandler);
    
    return () => {
      this.events.get(event)?.delete(handler as EventHandler);
      if (this.events.get(event)?.size === 0) {
        this.events.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event once
   * @param event Event name
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  once<T = any>(event: string, handler: EventHandler<T>): UnsubscribeFn {
    const onceHandler: EventHandler = (data: T) => {
      unsubscribe();
      handler(data);
    };
    
    const unsubscribe = this.on(event, onceHandler);
    return unsubscribe;
  }

  /**
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  emit<T = any>(event: string, data: T): void {
    if (this.historyEnabled) {
      this.eventHistory.push({
        timestamp: Date.now(),
        event,
        data
      });
      
      // Limit history to 100 events
      if (this.eventHistory.length > 100) {
        this.eventHistory.shift();
      }
    }
    
    if (!this.events.has(event)) {
      console.warn(`No handlers registered for event: ${event}`);
      return;
    }
    
    const handlers = this.events.get(event)!;
    
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Emit an event and wait for all async handlers to complete
   * @param event Event name
   * @param data Event data
   * @returns Promise that resolves when all handlers have completed
   */
  async emitAsync<T = any>(event: string, data: T): Promise<void> {
    if (this.historyEnabled) {
      this.eventHistory.push({
        timestamp: Date.now(),
        event,
        data
      });
    }
    
    if (!this.events.has(event)) {
      console.warn(`No handlers registered for event: ${event}`);
      return;
    }
    
    const handlers = this.events.get(event)!;
    const promises: Promise<void>[] = [];
    
    handlers.forEach(handler => {
      try {
        const result = handler(data);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
    
    await Promise.all(promises);
  }

  /**
   * Check if an event has any subscribers
   * @param event Event name
   * @returns True if the event has subscribers
   */
  hasListeners(event: string): boolean {
    return this.events.has(event) && this.events.get(event)!.size > 0;
  }

  /**
   * Get the number of subscribers for an event
   * @param event Event name
   * @returns Number of subscribers
   */
  listenerCount(event: string): number {
    return this.events.has(event) ? this.events.get(event)!.size : 0;
  }

  /**
   * Remove all subscribers for a specific event
   * @param event Event name
   */
  clearEvent(event: string): void {
    this.events.delete(event);
  }

  /**
   * Remove all subscribers for all events
   */
  clearAll(): void {
    this.events.clear();
  }

  /**
   * Enable or disable event history recording
   * @param enabled Whether to enable event history
   */
  setHistoryEnabled(enabled: boolean): void {
    this.historyEnabled = enabled;
    if (!enabled) {
      this.eventHistory = [];
    }
  }

  /**
   * Get the event history
   * @returns Array of event history entries
   */
  getEventHistory(): Array<{timestamp: number, event: string, data: any}> {
    return [...this.eventHistory];
  }
}

// Create a singleton instance
export const eventBus = new EventBusService();
