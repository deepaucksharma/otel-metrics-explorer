# Event Bus Service

## Overview

The Event Bus Service provides a centralized, decoupled communication mechanism for components throughout the OTLP Process Metrics Explorer. It implements the publish-subscribe pattern, allowing components to communicate without direct dependencies on each other.

## Responsibilities

1. Enable communication between decoupled components
2. Provide typed event definitions for compile-time safety
3. Support synchronous and asynchronous event handling
4. Allow for event filtering and prioritization
5. Enable event replay for debugging and testing
6. Provide monitoring and debugging capabilities
7. Ensure memory safety by cleaning up unused subscriptions

## Public Interface

```typescript
interface EventBus {
  // Subscribe to an event with a handler function
  on<T extends keyof EventMap>(event: T, handler: EventHandler<EventMap[T]>): Subscription;
  
  // Subscribe to an event once, handler auto-removes after first execution
  once<T extends keyof EventMap>(event: T, handler: EventHandler<EventMap[T]>): Subscription;
  
  // Emit an event with payload data
  emit<T extends keyof EventMap>(event: T, data: EventMap[T]): void;
  
  // Emit an event and return a promise that resolves when all async handlers complete
  emitAsync<T extends keyof EventMap>(event: T, data: EventMap[T]): Promise<void>;
  
  // Check if an event has any subscribers
  hasListeners<T extends keyof EventMap>(event: T): boolean;
  
  // Get the number of subscribers for an event
  listenerCount<T extends keyof EventMap>(event: T): number;
  
  // Remove all subscribers for a specific event
  clearEvent<T extends keyof EventMap>(event: T): void;
  
  // Remove all subscribers for all events
  clearAll(): void;
  
  // Get event history for debugging
  getEventHistory(): EventHistoryEntry[];
  
  // Enable/disable event history recording
  setHistoryEnabled(enabled: boolean): void;
}

// Type definitions for event map
type EventMap = {
  'snapshot.loading': SnapshotLoadingEvent;
  'snapshot.loaded': SnapshotLoadedEvent;
  'snapshot.error': SnapshotErrorEvent;
  'snapshot.removed': SnapshotRemovedEvent;
  'metric.selected': MetricSelectedEvent;
  'metric.analyzed': MetricAnalyzedEvent;
  'cardinality.analyzed': CardinalityAnalyzedEvent;
  'recommendations.generated': RecommendationsGeneratedEvent;
  // Additional events...
};

// Type for subscription returned by on() and once()
interface Subscription {
  unsubscribe(): void;
  isActive(): boolean;
}

// Type for event history
interface EventHistoryEntry {
  timestamp: number;
  event: string;
  data: any;
  handlerCount: number;
  processingTimeMs?: number;
}

// Handler type
type EventHandler<T> = (data: T) => void | Promise<void>;
```

## Implementation Details

### Core Functionality

The Event Bus is implemented using a simple but efficient publish-subscribe pattern:

1. Subscribers register interest in specific events with handler functions
2. Publishers emit events without knowledge of subscribers
3. The Event Bus maintains a registry of event-to-handler mappings
4. When an event is emitted, all registered handlers are invoked
5. Asynchronous handlers return promises that can be awaited

### Handler Management

- Handlers are stored in a Map structure for efficient lookup
- Weak references are used to prevent memory leaks when possible
- One-time handlers are automatically removed after execution
- Subscriptions provide an explicit unsubscribe mechanism

### Performance Considerations

- Synchronous handlers are executed immediately in the current call stack
- Asynchronous handlers return promises that can be awaited or ignored
- Event emission is optimized for the common case of few listeners
- Error handling ensures one faulty handler doesn't break others

### Debugging Support

- Optional event history recording for debugging purposes
- Performance metrics for event handling time
- Warning for events with no subscribers
- Detection of potential memory leaks from lingering subscriptions

## Error Handling

- Handler exceptions are caught and logged to prevent disrupting event flow
- Asynchronous handler failures are reported but don't block other handlers
- Emission of undefined events produces a warning
- Subscription to non-existent events is allowed (for future events)

## Dependencies

The Event Bus is a foundational service with no dependencies on other application components, though it may use:

- Logger: For logging errors and warnings
- Performance API: For measuring handler execution time

## Usage Example

```typescript
// Import the global event bus instance
import { eventBus } from './services/event-bus';

// Component subscribing to events
class MetricAnalyzer {
  constructor() {
    // Subscribe to snapshot loaded events
    this.subscription = eventBus.on('snapshot.loaded', this.onSnapshotLoaded.bind(this));
    
    // One-time subscription
    eventBus.once('application.initialized', () => {
      console.log('Application initialized, analyzer ready');
    });
  }
  
  private async onSnapshotLoaded(event: SnapshotLoadedEvent) {
    console.log(`Analyzing snapshot: ${event.snapshotId}`);
    
    try {
      const analysis = await this.analyzeSnapshot(event.snapshotId);
      
      // Emit a new event with analysis results
      eventBus.emit('metric.analyzed', {
        snapshotId: event.snapshotId,
        analysis,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }
  
  private async analyzeSnapshot(snapshotId: string) {
    // Perform analysis...
    return { /* analysis results */ };
  }
  
  public dispose() {
    // Clean up subscription when component is destroyed
    this.subscription.unsubscribe();
  }
}

// Component emitting events
class FileUploader {
  async uploadFile(file: File) {
    // Notify that a snapshot is being loaded
    eventBus.emit('snapshot.loading', {
      fileName: file.name,
      fileSize: file.size,
      timestamp: Date.now()
    });
    
    try {
      const content = await this.readFile(file);
      const snapshotId = await this.parseContent(content);
      
      // Notify that the snapshot is loaded
      eventBus.emit('snapshot.loaded', {
        snapshotId,
        fileName: file.name,
        timestamp: Date.now()
      });
      
      return snapshotId;
    } catch (error) {
      // Notify of error
      eventBus.emit('snapshot.error', {
        fileName: file.name,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  private async readFile(file: File) {
    // Read file...
  }
  
  private async parseContent(content: string) {
    // Parse content...
  }
}
```

The Event Bus is a crucial architectural component that enables the micro-component architecture of the OTLP Process Metrics Explorer, allowing for flexible, decoupled communication between components.
