# 01 · Architecture Principles

This document outlines the architectural principles that guide the OTLP Process Metrics Explorer project. All contributions must adhere to these principles to maintain consistency, performance, and maintainability.

## Foundational Principles

1. **Single-Responsibility Micro-Components**
   - Each file implements exactly one concern
   - UI components must not perform data parsing or heavy math
   - Logic components must not render DOM or import React
   - Data providers must not know about UI state

2. **Allowed Dependency Flow**
   - DataProvider → ParserWorker → StoreSlices
   - StoreSlices → UI (via hooks/selectors)
   - UI ↔ EventBus (fire & listen)
   - UI (Analyzer) → CardinalityEngine (worker)
   - UI (Config) → ConfigGenerator
   - No reverse imports (e.g., logic importing UI)
   - Shared helpers live in `utils/`

3. **State Isolation (Zustand Slices)**
   - `metrics`: ParsedSnapshots, MetricDefs
   - `diff`: Delta / Rate store
   - `cardinality`: Counts & attr maps
   - `ui`: View selections & panel toggles
   - `temporal`: Time series and trend data
   - UI components access state only via selector hooks

4. **Event Bus Contract (mitt)**
   - `snapshot.loaded`: `{snapshotId: string, timestamp: number, source: 'file'|'live'}`
   - `snapshot.select`: `{id: string, role: 'active'|'baseline'}`
   - `ui.metric.select`: `{metricKey: string}`
   - `ui.series.select`: `{metricKey: string, seriesKey: string}`
   - `ui.mode.change`: `'metrics'|'cardinality'|'temporal'`
   - `ui.attribute.select`: `{metricKey: string, path: string[]}`
   - `ui.definition.history`: `{metricKey: string}`
   - `config.ready`: `{yaml: string}`
   - `live.toggle`: `{enabled: boolean}`

5. **Worker-First Heavy Lifting**
   - Parsing, cardinality math, and temporal analysis run in Web Workers
   - Main thread budget: < 16 ms blocking per UI action
   - Threshold-based offloading for large datasets
   - Fallback to synchronous processing for small datasets

6. **Temporal Awareness**
   - Support for multiple snapshots with clear relationships
   - Timeline navigation with previous/next functionality
   - Trend visualization for series over time
   - Change detection between snapshots

7. **Proactive Insights**
   - Contextual recommendations based on data patterns
   - Educational tooltips for OTLP concepts
   - Visualization of change and stability
   - Automatic detection of high-impact attributes

## UI Component Principles

1. **Deep Contextual Information**
   - Every metric display includes complete context
   - Schema information is always accessible
   - Series relationships are visually clear
   - Dimensional hierarchy is explorable

2. **Progressive Disclosure**
   - Essential information visible by default
   - Details available through expansion/interaction
   - Complex features in dedicated views
   - Educational content accessible when needed

3. **Visual Consistency**
   - Uniform component styling and interaction patterns
   - Consistent terminology and labeling
   - Clear visual hierarchy
   - Spatial stability during state changes

4. **Accessibility First**
   - ARIA roles and labels for all components
   - Keyboard navigation for all interactive elements
   - Screen reader compatibility
   - Sufficient color contrast and focus indicators

## Performance Principles

1. **Virtualization for Large Datasets**
   - React virtualized lists for large metric collections
   - Paginated loading for high-cardinality attributes
   - Windowed rendering for time series

2. **Memoization and Selective Rendering**
   - Component memoization to prevent unnecessary renders
   - Selector optimization to minimize computation
   - Debounced updates for rapid changing values
   - Asynchronous rendering for complex visualizations

3. **Efficient State Management**
   - Immutable state updates via Immer middleware
   - Granular state subscriptions with selectors
   - Event-based communication for cross-component updates
   - Lazy initialization for expensive computations

4. **Background Processing**
   - Web Workers for CPU-intensive tasks
   - Deferred calculations for non-critical information
   - Optimistic UI updates with async confirmation
   - Background prefetching for likely navigation paths

## Data Flow Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Data Sources   │       │  Logic Layer    │       │  State Layer    │
│  (Providers)    │──────▶│  (Workers)      │──────▶│  (Store Slices) │
└─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Action Layer   │◀──────│  UI Layer       │◀──────│  Selector Layer │
│  (EventBus)     │       │  (Components)   │       │  (Hooks)        │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

## Implementation Contracts

1. **Component Interface Stability**
   - Public API of components must remain stable
   - Breaking changes require explicit version bumps
   - Component documentation must be updated with changes
   - Props requirements must be clearly documented

2. **Type Safety**
   - All code must be fully typed with TypeScript
   - No `any` types in public interfaces
   - Generic types for reusable components
   - Runtime type checking for external data

3. **Error Handling**
   - Graceful degradation for all failure modes
   - Detailed error messages for developers
   - User-friendly error displays
   - Recovery paths for common errors

4. **Testing Requirements**
   - Core logic must have unit tests
   - UI components must have functional/integration tests
   - Event flows must have contract tests
   - Visual regression tests for key components

## Conclusion

These architecture principles provide the foundation for a maintainable, performant, and user-friendly application. They balance the need for technical excellence with the practical constraints of development, ensuring a consistent and coherent codebase that can evolve over time.

All contributions should be evaluated against these principles, with deviations requiring explicit justification and team consensus.