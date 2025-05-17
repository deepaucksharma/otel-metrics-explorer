# Implementation Plan: OTLP Process Metrics Explorer

Below is a **fine-grained work-breakdown structure (WBS)** that slices the project into atomic tickets.
Each ticket is small enough for a single engineer to ship in ≤ 0.5-1 days, has an explicit "ready-to-start when X is true" rule, and publishes stubs/mocks so downstream tasks can run in parallel.

> **Legend**
> `↦` = dependency (must finish before starting)
> **🎯** = milestone (merge cut)
> ⏱ = est. effort (person-days)

---

## Phase 0 · Bootstrap (Week 0) — Foundation

| #         | Ticket ID                                   | Description                                      | ⏱   | Depends |
| --------- | ------------------------------------------- | ------------------------------------------------ | --- | ------- |
| 0-1       | **infra-repo-init**                         | Repo, pnpm mono-workspace, Vite config, Husky, Prettier, ESLint base    | 0.5 | —       |
| 0-2a      | **contracts-core-structs**                  | ParsedSnapshot, ParsedMetric, ParsedDataPoint base TS in contracts pkg | 0.5 | 0-1     |
| 0-2b      | **contracts-derived-stores**                | MetricDefinition, DiffStore, CardinalityStore shapes in contracts pkg | 0.5 | 0-2a    |
| 0-3       | **bus-singleton**                           | event-bus.ts with core event types (e.g., data.snapshot.loaded, ui.select) + dev logger | 0.5 | 0-1     |
| 0-4a      | **store-slices-def**                        | Define all Zustand slice interfaces (MetricsSliceState, UiSliceState etc.) | 0.5 | 0-2b    |
| 0-4b      | **store-slices-impl-stubs**                 | Implement slice actions as stubs (e.g., setSnapshot logs payload) + devtools | 0.5 | 0-4a    |
| 0-5       | **ci-lint-unit-tests**                      | CI: Lint, Prettier check, Vitest/Jest basic unit test execution | 1   | 0-1     |
| 0-6       | **storybook-setup**                         | Basic Storybook configuration for UI component development | 0.5 | 0-1    |
| **🎯 M0** | *Boot passes CI, Storybook runs* |                                                  |     |         |

*All later tasks may proceed once their immediate contract/interface dependency from Phase 0 is defined (even if implementation is a stub).*

---

## Phase 1 · "Hello Metrics" (Week 1-2) — MVP Rails with Max Parallelism

### Track A ─ Data Ingestion & Core Parsing Logic

| #   | Ticket                 | Description                                                              | ⏱ | Depends |
| --- | ---------------------- | ------------------------------------------------------------------------ | - | ------- |
| 1-1a | **worker-parse-json-iface** | Define ParserWorker message protocol (input/output shapes for parse cmd) | 0.25 | 0-2a |
| 1-1b | **worker-parse-json-basic** | ParserWorker: Basic JSON.parse, validate resourceMetrics root, echo snapshot ID | 0.75 | 1-1a |
| 1-2a | **static-provider-iface** | Define StaticFileProvider interaction with EventBus (ui.file.ingest listener) | 0.25 | 0-3 |
| 1-2b | **static-provider-impl-v1** | StaticFileProvider: Read file ➜ postMessage to (mocked) ParserWorker | 0.75 | 1-2a, (mock for 1-1b) |

### Track B ─ UI Shell & Basic Navigation

| #   | Ticket                       | Description                                                | ⏱   | Depends |
| --- | ---------------------------- | ---------------------------------------------------------- | --- | ------- |
| 1-3a | **layout-shell-structure** | AppLayout HTML/CSS structure with placeholder areas for Sidebar & Main Content | 0.25 | 0-4a |
| 1-3b | **layout-shell-routing-stub** | Basic React Router setup for / and /cardinality (rendering placeholder text) | 0.25 | 1-3a |
| 1-4a | **sidebar-ui-structure** | SidebarNavigator visual structure (search box, list area, buttons) in Storybook | 0.5 | 0-6 |
| 1-4b | **sidebar-events-emit** | SidebarNavigator: Emit ui.metric.select, ui.mode.change, ui.file.ingest | 0.5 | 1-4a, 0-3 |

### Track C ─ Basic Metric Display (Gauge)

| #   | Ticket                       | Description                                                | ⏱   | Depends |
| --- | ---------------------------- | ---------------------------------------------------------- | --- | ------- |
| 1-5a | **gauge-card-structure** | GaugeStatCard visual structure (props for value, unit, title) in Storybook | 0.25 | 0-6, 0-2a |
| 1-5b | **gauge-card-inspect-event** | GaugeStatCard: Emit ui.inspect on click | 0.25 | 1-5a, 0-3 |
| 1-6 | **metrics-view-placeholder** | MetricsView component: Renders "Metrics View Coming Soon" text inside AppLayout | 0.25 | 1-3b |

**🎯 M1 (end W2)** – App loads. File upload can be triggered. Sidebar buttons emit events. Gauge card renders static props in Storybook. Basic routing works. Parser worker can receive messages.

---

## Phase 2 · Parsing, Definitions & Gauge Display (Week 3-4)

### Track A ─ Parser Enhancement & Metric Definition Logic

| #   | Ticket                 | Description                                     | ⏱ | Depends   |
| --- | ---------------------- | ----------------------------------------------- | - | --------- |
| 2-1a | **worker-attr-flatten-util** | Utility function flattenOTLPAttributes in contracts or utils | 0.5 | 0-2a |
| 2-1b | **worker-serieskey-impl** | ParserWorker: Implement seriesKey generation using flattenOTLPAttributes | 0.5 | 1-1b, 2-1a |
| 2-2a | **metricsSlice-setSnapA-def** | MetricsSlice: Define setSnapshot('A') action signature | 0.25 | 0-4b |
| 2-2b | **metricsSlice-metricDefs-util** | Util buildMetricDefinitionsFromSnapshots (stub returning mock MetricDefs) | 0.5 | 0-2b |
| 2-2c | **metricsSlice-setSnapA-impl** | MetricsSlice: setSnapshot('A') consumes ParsedSnapshot, calls buildMetricDefinitions (stub), updates store | 0.75 | 2-2a, 2-1b, 2-2b |

### Track B ─ UI Integration with Real Data (Sidebar & Metrics View)

| #   | Ticket                  | Description                                  | ⏱   | Depends   |
| --- | ---------------------- | -------------------------------------------- | --- | --------- |
| 2-3a | **sidebar-list-selector** | SidebarNavigator: Selector selectDistinctMetricNamesWithCounts for MetricsSlice | 0.5 | 1-4b, 2-2c |
| 2-3b | **sidebar-list-render** | SidebarNavigator: Render real metric list from selector; implement search filter | 0.5 | 2-3a |
| 2-4a | **metrics-view-layout** | MetricsView: Basic CSS grid layout for metric cards | 0.25 | 1-6 |
| 2-4b | **metrics-view-map-defs** | MetricsView: Map MetricDefinition[] from selector to (stubbed) GaugeStatCards | 0.25 | 2-4a, 2-2c |
| 2-5a | **gauge-card-data-selector** | GaugeStatCard: Selector to get latest value for its metricKey from snapshotA | 0.5 | 1-5b, 2-2c |
| 2-5b | **gauge-card-render-real** | GaugeStatCard: Integrate selector to display real data from snapshotA | 0.5 | 2-5a |

### Track X ─ Detail Panel (Early Start)

| #   | Ticket                  | Description                                  | ⏱   | Depends   |
| --- | ---------------------- | -------------------------------------------- | --- | --------- |
| 2-6 | **detail-panel-ui-shell** | DetailPanel structure (header, tabs for Schema/Attrs/JSON) in Storybook | 0.5 | 0-6 |
| 2-7 | **detail-panel-schema-view-stub** | DetailPanel: Schema tab renders static MetricDefinition props from Storybook | 0.5 | 2-6, 0-2b |

**🎯 M2** – User uploads snapshot A ➜ Parser generates series keys ➜ MetricsSlice builds MetricDefinitions (using stubbed util initially) ➜ Sidebar shows real, filterable metric list ➜ MetricsView shows real GaugeStatCards with data from Snapshot A. Detail Panel shell exists.

---

## Phase 3 · Diff Engine & Rate Cards (Week 5-6)

### Track C ─ Diff Logic & State

| #   | Ticket                  | Description                                        | ⏱   | Depends   |
| --- | ----------------------- | -------------------------------------------------- | --- | --------- |
| 3-1a | **diff-engine-core-logic** | DiffEngine: Implement computeDiffs core logic (delta, rate, reset detection) | 0.75 | 2-1b (for seriesKey on DP) |
| 3-1b | **diff-engine-tests** | Comprehensive unit tests for computeDiffs with edge cases | 0.25 | 3-1a |
| 3-2a | **diffSlice-def** | DiffSlice: Define state shape and setDiffStore action signature | 0.25 | 0-4b |
| 3-2b | **diffRunner-impl** | diffRunner: Listens for snapshotB loaded, calls computeDiffs, calls setDiffStore | 0.5 | 3-1b, 3-2a, 2-2c |

### Track D ─ UI Wiring

| #   | Ticket                     | Description                                | ⏱   | Depends |
| --- | -------------------------- | ------------------------------------------ | --- | ------- |
| 3-3a | **rate-card-structure** | RateDeltaCard: Visual structure (props for rate, delta, breakdown) in Storybook | 0.5 | 0-6, 0-2b |
| 3-3b | **rate-card-reset-display** | RateDeltaCard: Implement display logic for "counter reset" flag | 0.5 | 3-3a |
| 3-4a | **rate-card-data-selector** | RateDeltaCard: Selector to get DiffedSeries[] for its otelMetricName from DiffSlice | 0.5 | 3-3b, 3-2b |
| 3-4b | **rate-card-render-real** | RateDeltaCard: Integrate selector to display real diff/rate data | 0.5 | 3-4a |
| 3-5 | **metrics-view-choose-card** | MetricsView: Logic to choose RateDeltaCard (if diff data exists) or GaugeStatCard | 0.5 | 2-4b, 3-4b, 2-5b |

### Track X ─ Detail Panel Data Integration

| #   | Ticket                     | Description                                | ⏱   | Depends |
| --- | -------------------------- | ------------------------------------------ | --- | ------- |
| 3-6 | **detail-panel-schema-real** | DetailPanel: Schema tab consumes real MetricDefinition from selector | 0.5 | 2-7, 2-2c |
| 3-7 | **detail-panel-attrs-view-real** | DetailPanel: Resource/Metric Attributes tabs consume data from selectors | 1 | 2-6, 2-2c, 3-2b (for diffed attrs) |
| 3-8 | **detail-panel-rawjson-view** | DetailPanel: Raw JSON tab consumes (stubbed) raw JSON snippet from selector | 0.5 | 2-6, 2-2c |

**🎯 M3** – Upload snapshots A+B → Rate card shows Δ & rate, reset badge works. Detail Panel shows real schema and attribute data.

---

## Phase 4 · Cardinality Analyzer (Week 7-8)

### Track E ─ Cardinality Engine & State

| #   | Ticket                 | Description                              | ⏱   | Depends |
| --- | ---------------------- | ---------------------------------------- | --- | ------- |
| 4-1a | **card-engine-core-sync** | CardinalityEngine: Implement analyzeSnapshotCardinality (sync version) | 0.75 | 2-1b |
| 4-1b | **card-engine-tests** | Unit tests for analyzeSnapshotCardinality | 0.25 | 4-1a |
| 4-2a | **cardSlice-def** | CardinalitySlice: Define state shape and setCardinalityStore action signature | 0.25 | 0-4b |
| 4-2b | **cardinalityRunner-impl** | cardinalityRunner: Listens for snapshot, calls analyzeSnapshotCardinality, calls setCardinalityStore | 0.5 | 4-1b, 4-2a, 2-2c |
| 4-3a | **card-engine-simulate-api** | CardinalityEngine: Define API for simulateAttributeDrop (sync version) | 0.25 | 4-1a |
| 4-3b | **card-engine-simulate-impl** | CardinalityEngine: Implement simulateAttributeDrop (sync version) | 0.75 | 4-3a |

### Track F ─ Analyzer UI

| #   | Ticket                  | Description                                    | ⏱   | Depends |
| --- | ----------------------- | ---------------------------------------------- | --- | ------- |
| 4-4a | **card-overview-ui-structure** | CardinalityOverview: Table structure for metrics list in Storybook | 0.5 | 0-6 |
| 4-4b | **card-overview-data-render** | CardinalityOverview: Populate table from CardinalitySlice, add heat column, click handler | 1 | 4-4a, 4-2b |
| 4-5a | **whatif-ui-structure** | WhatIfSimulator: UI shell (checkbox list, summary panel) in Storybook | 0.5 | 0-6 |
| 4-5b | **whatif-load-metric-details** | WhatIfSimulator: Load attribute list for selected metric from CardinalitySlice | 0.5 | 4-5a, 4-2b |
| 4-6a | **whatif-run-simulation** | WhatIfSimulator: On checkbox change, call requestAttributeDropSimulation (facade, initially sync) | 0.5 | 4-5b, 4-3b |
| 4-6b | **whatif-display-sim-results** | WhatIfSimulator: Update summary panel & charts with cardinality.simulated event data | 0.5 | 4-6a |

### Track Y ─ Worker Offloading (Parallel Start)

| #   | Ticket                  | Description                                    | ⏱   | Depends |
| --- | ----------------------- | ---------------------------------------------- | --- | ------- |
| 4-7 | **parser-worker-full-impl** | ParserWorker: Full implementation of OTLP parsing logic (types, temporality etc.) | 1 | 2-1b |
| 4-8 | **card-engine-worker-setup** | Adapt CardinalityEngine to run in Web Worker, setup message protocol | 1 | 4-1a, 4-3a |
| 4-9 | **card-facade-impl** | CardinalityFacade: Implement threshold logic to call sync engine or Worker | 1 | 4-8, 4-1a, 4-3a |

**🎯 M4** – Cardinality Analyzer functional & interactive. ParserWorker is fully implemented. Overview table populates, selecting a metric allows interactive "what-if" simulation.

---

## Phase 5 · Config Generation & Live WS (Week 9-10)

### Track G ─ Config Generation

| #   | Ticket                     | Description                                 | ⏱   | Depends |
| --- | -------------------------- | ------------------------------------------- | --- | ------- |
| 5-1 | **config-templates** | Handlebars templates for OTel attributes and filter processors | 0.5 | 0-2b (for DropPlan shape) |
| 5-2a | **configGenerator-iface** | ConfigGenerator: Define API generateCollectorYaml(DropPlan[], MetricExclusionPlan?) | 0.25 | 5-1 |
| 5-2b | **configGenerator-impl** | ConfigGenerator: Implement YAML generation logic, emit config.ready event | 0.75 | 5-2a |
| 5-3a | **config-modal-ui-shell** | ConfigExportModal: UI structure (YAML viewer, copy/download buttons) in Storybook | 0.5 | 0-6 |
| 5-3b | **config-modal-data-render** | ConfigExportModal: Display YAML from config.ready event, implement copy/download | 0.5 | 5-3a, 5-2b |
| 5-4 | **whatif-to-config-integration** | Button in WhatIfSimulator calls ui.config.generate event, triggering ConfigGenerator | 0.5 | 4-6b, 5-2b, 5-3b |

### Track H ─ Live Stream

| #   | Ticket                  | Description                              | ⏱ | Depends   |
| --- | --------------------- | ---------------------------------------- | - | --------- |
| 5-5a | **ws-provider-core** | LiveWsProvider: Basic WebSocket connect, disconnect, message handling, status events | 0.75 | 0-3, 1-1a (parser iface) |
| 5-5b | **ws-provider-parser-integ** | LiveWsProvider: Send incoming WS frames to (mocked or real) ParserWorker | 0.25 | 5-5a, 4-7 |
| 5-6 | **ws-provider-reconnect** | LiveWsProvider: Implement exponential backoff and auto-reconnection logic | 1 | 5-5a |
| 5-7a | **diffRunner-live-mode-iface** | diffRunner: Adapt to handle continuous 'live' frames (e.g., A=prev_live, B=curr_live) | 0.5 | 3-2b |
| 5-7b | **diffRunner-live-mode-impl** | diffRunner: Implement sliding window diff for live data, update DiffSlice | 0.5 | 5-7a, 5-5b |

### Track Z ─ Documentation & Testing Infrastructure

| #   | Ticket                  | Description                              | ⏱ | Depends   |
| --- | --------------------- | ---------------------------------------- | - | --------- |
| 5-8 | **docs-update-all-components** | Review and update all /docs/*.md files for accuracy based on implementation | 1 | M4 |
| 5-9 | **ci-e2e-cypress-setup** | CI: Basic Cypress setup and one "happy path" E2E test for static file load & view | 1 | 0-5, M4 |

**🎯 M5** – Users can drop labels → generate YAML; experimental live mode works. Core documentation updated. Basic E2E test in CI.

---

## Phase 6 · Polish & GA (Week 11-12)

This phase is less about parallel tracks and more about concerted effort on quality.

| # | Ticket | Description | ⏱ | Depends |
|---|--------|-------------|---|---------|
| 6-1 | **a11y-audit-fixes** | Run accessibility audit (e.g., axe-core), fix violations (color contrast, ARIA attributes, keyboard nav) | 1.5 | M5 |
| 6-2 | **perf-benchmarking-tuning** | Run Lighthouse CI, Vitest benchmarks against budgets; optimize critical paths, lazy-load workers/views | 1.5 | M5 |
| 6-3 | **e2e-test-suite-expansion** | Add E2E tests for Cardinality Analyzer flow and Config Export | 1 | 5-9 |
| 6-4 | **visual-regression-setup** | Integrate Percy/Chromatic for key components and views | 1 | M5 |
| 6-5 | **user-docs-readme-gifs** | Create README quick-start, add GIF demos of key features | 1 | M5 |
| 6-6 | **manual-qa-exploratory** | Manual QA checklist execution (dark mode, cross-browser spot checks, edge cases) | 1 | M5 |
| 6-7 | **final-code-cleanup-todos** | Address FIXMEs, TODOs; final code style pass; dependency audit | 1 | M5 |

**🎯 GA Milestone** – `v0.1.0` release tag.

---

## Visual Timeline (condensed)

```
Week 0  | Phase0 ■■■■■■
Week 1-2| Phase1 A■■ B■■ C■■
Week 3-4| Phase2 A■■■ B■■■■ X■■
Week 5-6| Phase3    C■■■ D■■■■ X■■■
Week 7-8| Phase4       E■■■ F■■■■ Y■■■
Week 9-10|Phase5          G■■■■ H■■■ Z■■
Week 11-12|Phase6              POLISH ■■■■■■■
```

Legend: ■ work spans; tracks overlap but rely only on finished upstream tickets.

---

## Coordination Rules

1. **Interface-First Delivery**: For any *-iface or *-def ticket, the deliverable is the committed TypeScript interface/type definition and a fully mocked implementation (*.mock.ts) that downstream consumers can immediately use. The mock must adhere strictly to the interface.

2. **Contract Tests are King**: Every *-impl ticket that consumes an interface from another ticket must include an integration/contract test that uses the mock from the dependency. When the real implementation of the dependency is ready, these contract tests should pass without change.

3. **Daily Integration Branch**: Continue merging to integration daily. main is updated only at Milestones.

4. **Storybook for UI Stubs**: *-ui-structure tickets for UI components must deliver a Storybook story showcasing the component with static/mocked props that match the defined contracts.

5. **Dedicated Review for Interfaces**: Before an *-impl ticket starts, a quick (~15 min) "interface handshake" meeting/PR comment thread between the implementer and a primary consumer of that interface to confirm the defined contract (and its mock) is sufficient.

---

With this granular WBS, **eight engineers** can work almost continuously
without blocking each other, yet the dependencies are still obvious and
checked by CI contract tests.

## Progress Status (Current)

As of the current repository setup, we have completed:

### Phase 0 - Bootstrap
- ✅ **0-1 infra-repo-init**: Repository setup with git, initial React/Vite configuration
- ✅ **0-2a contracts-core-structs**: Partial implementation of data contracts as TypeScript types
- ✅ **0-2b contracts-derived-stores**: Implemented MetricDefinition interfaces
- ✅ **0-3 bus-singleton**: Event bus service with types and basic logging 
- ✅ **0-4a store-slices-def**: Slices and actions exist in the store
- ✅ **0-4b store-slices-impl-stubs**: Implementation completed for all slices
- ✅ **0-5 ci-lint-unit-tests**: Basic CI workflow added
- ✅ **0-6 storybook-setup**: Storybook configuration completed

### Phase 1 - "Hello Metrics"
- ✅ **1-3a layout-shell-structure**: AppLayout structure with placeholders
- ✅ **1-3b layout-shell-routing-stub**: Basic React Router setup
- ✅ **1-4a sidebar-ui-structure**: SidebarNavigator visual structure
- ✅ **1-4b sidebar-events-emit**: Event emission from sidebar
- ✅ **1-5a gauge-card-structure**: GaugeStatCard visual structure
- ✅ **1-5b gauge-card-inspect-event**: Inspect event on click
- ✅ **1-6 metrics-view-placeholder**: Basic MetricsView component

### Phase 2 - Parsing & Gauge Display
- ✅ **2-1a worker-attr-flatten-util**: Utility for flattening attributes
- ✅ **2-1b worker-serieskey-impl**: Series key generation implementation
- ✅ **2-2a metricsSlice-setSnapA-def**: MetricsSlice action definitions
- ✅ **2-2b metricsSlice-metricDefs-util**: Utility for metric definitions
- ✅ **2-2c metricsSlice-setSnapA-impl**: Implementation of snapshot handling
- ✅ **2-3a sidebar-list-selector**: Selectors for metric lists
- ✅ **2-3b sidebar-list-render**: Rendering metrics in sidebar
- ✅ **2-4a metrics-view-layout**: Grid layout for cards
- ✅ **2-4b metrics-view-map-defs**: Mapping definitions to cards
- ✅ **2-5a gauge-card-data-selector**: Data selectors for gauge cards
- ✅ **2-5b gauge-card-render-real**: Real data rendering in gauge cards
- ✅ **2-6 detail-panel-ui-shell**: Detail panel UI structure
- ✅ **2-7 detail-panel-schema-view-stub**: Schema tab for detail panel

### Phase 3 - Diff Engine & Rate Cards
- ✅ **3-1a diff-engine-core-logic**: Implemented computeDiffs core logic
- ✅ **3-1b diff-engine-tests**: Added comprehensive unit tests for computeDiffs
- ✅ **3-2a diffSlice-def**: Defined DiffSlice state shape and actions
- ✅ **3-2b diffRunner-impl**: Implemented diffRunner to process snapshots and update store
- ✅ **3-3a rate-card-structure**: Created RateDeltaCard component with proper visualization
- ✅ **3-3b rate-card-reset-display**: Added support for counter reset detection
- ✅ **3-4a rate-card-data-selector**: Implemented selectors for accessing diff data
- ✅ **3-4b rate-card-render-real**: Integrated selectors to display real diff/rate data
- ✅ **3-5 metrics-view-choose-card**: Added logic to choose between RateDeltaCard and GaugeStatCard

Current Status: We have completed Phases 0, 1, 2, and 3, reaching milestone M3. The application now handles two snapshots, computes diffs between them, and displays delta/rate cards with counter reset detection. We've implemented error handling throughout the application, added a sample data loading mechanism, and provided static HTML alternatives for easier demonstration.

Next steps would be to:
1. Implement the Cardinality Analyzer (Phase 4)
2. Address TypeScript errors and improve test coverage
3. Create more comprehensive documentation for the implemented features
