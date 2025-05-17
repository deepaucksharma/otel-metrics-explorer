# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The OTLP Process Metrics Explorer is a specialized web-based tool designed to offer deep, schema-aware insights into OpenTelemetry (OTLP) process-level metrics. It targets Site Reliability Engineers (SREs), developers, and observability engineers who need to understand the structure, dimensionality, and potential cost implications of their metrics data.

## Core Technology Stack

- **Frontend Framework**: React 18 with Vite for bundling
- **State Management**: Zustand (with Immer middleware)
- **Charting/Visualization**: ECharts
- **Event Bus**: mitt for decoupled inter-component communication
- **Web Workers**: For offloading heavy tasks
- **Styling**: Tailwind CSS

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Start Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook

# Generate GitHub issues from implementation plan
pnpm generate-issues
```

## Architecture Principles

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
   - UI components access state only via selector hooks

4. **Event Bus Contract (mitt)**
   - `data.snapshot.loaded`: `{frame:'A'|'B', snapshot}`
   - `ui.metric.select`: `metricKey:string`
   - `ui.mode.change`: `'metrics'|'cardinality'`
   - `ui.inspect`: `metricKey|string`
   - `config.ready`: `yaml:string`

5. **Worker-First Heavy Lifting**
   - Parsing and cardinality math run in Web Workers
   - Main thread budget: < 16 ms blocking per UI action

## Project Structure

```
src/
├── components/        # React components
├── context/           # React context providers
├── services/          # Shared services (eventBus, stateStore)
├── state/             # Zustand state slices
│   ├── metricsSlice.ts
│   ├── diffSlice.ts
│   ├── cardinalitySlice.ts
│   └── uiSlice.ts
├── types/             # TypeScript type definitions
├── utils/             # Shared utilities
└── workers/           # Web Worker implementations
```

## File Naming Conventions

- UI Components: `ui-[ComponentName].tsx`
- Logic Modules: `logic-[purpose].ts`
- Data Providers: `data-[ProviderName].ts`
- Workers: `[purpose].worker.ts`
- Tests: `[file-being-tested].spec.ts[x]`

## Testing Strategy

- Unit tests live in `src/**/__tests__` using Vitest
- Cypress is used for E2E testing
- Coverage target is 90%+

## Import Guidelines

- UI components may only import from state slices or other UI components
- Logic modules must not import from UI
- Data providers must not import from UI or logic
- Shared utilities (`utils/`) can be imported by any layer

## Environment Setup

- Node.js >= 16.x
- pnpm >= 7.x
- Git