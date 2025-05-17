# State Management Service

## Overview

The State Management Service provides a centralized, reactive state store for the OTLP Process Metrics Explorer. It ensures a consistent source of truth for application data, facilitates component communication through state changes, and supports features like time-travel debugging and state persistence.

## Responsibilities

1. Maintain a centralized, structured state for the entire application
2. Provide reactive state access with selective subscriptions
3. Enable controlled state mutations through actions
4. Support middleware for cross-cutting concerns (logging, persistence, etc.)
5. Facilitate state slicing for performance optimization
6. Enable time-travel debugging during development
7. Support state serialization and hydration for persistence

## Public Interface

```typescript
interface StateStore {
  // Get the current value of the entire state or a specific slice
  getState<T = AppState>(selector?: (state: AppState) => T): T;
  
  // Subscribe to changes in the entire state or a specific slice
  subscribe<T = AppState>(
    listener: StateChangeListener<T>,
    selector?: (state: AppState) => T,
    equalityFn?: (a: T, b: T) => boolean
  ): Unsubscribe;
  
  // Dispatch an action to modify state
  dispatch<T extends keyof ActionMap>(
    actionType: T,
    payload: ActionPayloadMap[T]
  ): void;
  
  // Create a local state slice that's synchronized with the global state
  createSlice<T>(
    selector: (state: AppState) => T,
    equalityFn?: (a: T, b: T) => boolean
  ): StateSlice<T>;
  
  // Reset the entire state or a specific slice to its initial value
  reset(path?: string): void;
  
  // Add middleware to process actions or state changes
  addMiddleware(middleware: StoreMiddleware): void;
  
  // Get the action history for debugging
  getActionHistory(): ActionHistoryEntry[];
  
  // Save the current state to local storage
  saveState(key?: string): void;
  
  // Load state from local storage
  loadState(key?: string): boolean;
}

// Type definitions
type StateChangeListener<T> = (newValue: T, oldValue: T) => void;
type Unsubscribe = () => void;

interface StateSlice<T> {
  get(): T;
  set(updater: (draft: T) => void): void;
  subscribe(listener: StateChangeListener<T>): Unsubscribe;
}

interface StoreMiddleware {
  beforeAction?: (actionType: string, payload: any) => any;
  afterAction?: (actionType: string, payload: any, newState: AppState, prevState: AppState) => void;
  onError?: (actionType: string, payload: any, error: Error) => void;
}

interface ActionHistoryEntry {
  timestamp: number;
  actionType: string;
  payload: any;
  stateBefore: Partial<AppState>;
  stateAfter: Partial<AppState>;
  duration: number;
}

// Application state structure
interface AppState {
  snapshots: Record<string, ParsedSnapshot>;
  uiState: {
    selectedSnapshotId: string | null;
    comparisonSnapshotId: string | null;
    selectedMetricId: string | null;
    expandedMetricIds: string[];
    viewMode: 'list' | 'grid' | 'treemap';
    sortBy: string;
    filterText: string;
    showMetadata: boolean;
  };
  analysisState: {
    cardinalityAnalysis: Record<string, CardinalityAnalysis>;
    recommendations: Record<string, MetricRecommendations>;
    costModel: CostModel;
  };
  // Additional state slices...
}
```

## Implementation Details

### Core Functionality

The State Management Service is built on a combination of the Flux architecture and immutable state patterns:

1. The store maintains a single source of truth for application state
2. State changes occur only through dispatched actions
3. Reducers process actions to produce new state
4. Subscribers are notified of state changes

### Performance Optimizations

- Selective subscriptions allow components to listen only to relevant state slices
- Equality functions prevent unnecessary re-renders for unchanged data
- Memoization of selectors reduces computation overhead
- Batched updates when multiple state changes occur together
- State normalization to avoid duplication of data

### Middleware Support

The store supports pluggable middleware for cross-cutting concerns:

- **Logger Middleware**: Records actions and state changes
- **Persistence Middleware**: Automatically saves state to localStorage
- **Event Bus Middleware**: Bridges state changes to the event bus
- **Validation Middleware**: Ensures state integrity
- **Performance Middleware**: Tracks action processing time

### Immutability

State immutability is enforced using Immer's produce function:

1. Actions never directly modify state
2. Reducers use Immer to create immutable updates
3. Components receive frozen state objects
4. Direct mutation attempts throw errors in development

## Error Handling

- Invalid action types: Reported with descriptive error
- Failed reducers: Captured and logged, preventing state corruption
- Middleware errors: Isolated to avoid breaking the application
- Circular dependencies: Detected and reported
- State schema violations: Validated in development builds

## Dependencies

- Zustand: Core state management library
- Immer: For immutable state updates
- EventBus: For optional event emission on state changes
- Logger: For debugging information

## Usage Example

```typescript
// Import the global state store instance
import { stateStore } from './services/state-store';

// Component using the state
function MetricList() {
  // Subscribe to a specific slice of state
  const [metrics, selectedId] = React.useMemo(() => {
    const selectedId = stateStore.getState(state => state.uiState.selectedMetricId);
    const snapshotId = stateStore.getState(state => state.uiState.selectedSnapshotId);
    const snapshot = stateStore.getState(state => state.snapshots[snapshotId]);
    const metrics = snapshot ? Object.values(snapshot.metrics) : [];
    
    return [metrics, selectedId];
  }, []);
  
  // Set up subscription for updates
  React.useEffect(() => {
    return stateStore.subscribe(
      (newMetrics) => {
        // Component will re-render with new metrics
        console.log(`Metrics updated: ${newMetrics.length} metrics available`);
      },
      (state) => {
        const snapshotId = state.uiState.selectedSnapshotId;
        const snapshot = state.snapshots[snapshotId];
        return snapshot ? Object.values(snapshot.metrics) : [];
      }
    );
  }, []);
  
  // Handle selection
  const handleSelectMetric = (metricId) => {
    stateStore.dispatch('SET_SELECTED_METRIC', { metricId });
  };
  
  return (
    <div className="metric-list">
      {metrics.map(metric => (
        <MetricItem
          key={metric.id}
          metric={metric}
          isSelected={metric.id === selectedId}
          onSelect={() => handleSelectMetric(metric.id)}
        />
      ))}
    </div>
  );
}

// Component modifying state
function SnapshotSelector() {
  const snapshots = stateStore.getState(state => 
    Object.keys(state.snapshots).map(id => ({
      id,
      label: state.snapshots[id].label || id
    }))
  );
  
  const selectedId = stateStore.getState(state => state.uiState.selectedSnapshotId);
  
  const handleSelectSnapshot = (snapshotId) => {
    stateStore.dispatch('SET_SELECTED_SNAPSHOT', { snapshotId });
  };
  
  const handleRemoveSnapshot = (snapshotId) => {
    stateStore.dispatch('REMOVE_SNAPSHOT', { snapshotId });
  };
  
  return (
    <div className="snapshot-selector">
      {snapshots.map(snapshot => (
        <div 
          key={snapshot.id}
          className={`snapshot-item ${snapshot.id === selectedId ? 'selected' : ''}`}
          onClick={() => handleSelectSnapshot(snapshot.id)}
        >
          {snapshot.label}
          <button onClick={() => handleRemoveSnapshot(snapshot.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

// Creating a service that uses state
class MetricsAnalysisService {
  constructor() {
    // Create a state slice for efficient access
    this.analysisSlice = stateStore.createSlice(
      state => state.analysisState.cardinalityAnalysis
    );
    
    // Subscribe to snapshot changes
    this.unsubscribe = stateStore.subscribe(
      this.handleSnapshotChange.bind(this),
      state => state.uiState.selectedSnapshotId
    );
  }
  
  private async handleSnapshotChange(newSnapshotId, oldSnapshotId) {
    if (!newSnapshotId) return;
    
    // Check if we already have analysis for this snapshot
    const analysis = this.analysisSlice.get()[newSnapshotId];
    if (analysis) return;
    
    // Perform analysis for the new snapshot
    await this.analyzeSnapshot(newSnapshotId);
  }
  
  private async analyzeSnapshot(snapshotId) {
    try {
      // Get the snapshot data
      const snapshot = stateStore.getState(state => state.snapshots[snapshotId]);
      if (!snapshot) return;
      
      // Perform analysis (simplified)
      const analysis = { /* analysis results */ };
      
      // Update the state with analysis results
      stateStore.dispatch('SET_CARDINALITY_ANALYSIS', {
        snapshotId,
        analysis
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }
  
  public dispose() {
    this.unsubscribe();
  }
}
```

The State Management Service is a foundational component of the OTLP Process Metrics Explorer, enabling a unidirectional data flow architecture that enhances predictability, testability, and performance.
