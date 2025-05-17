# 80 · ui-MetricInstanceWidget
_The cornerstone visualization component in the **UI layer**_

---

## Ultimate Metric Instance Widget 3.1 — The Hyper-Focused OTLP Metric Observatory

This component provides a hyper-focused, deeply interactive view of a single metric instance with rich contextual information. It combines OTLP fidelity with an enhanced dimensional and temporal explorer to give users unprecedented insight into their metrics.

---

## Core Responsibilities

* Display complete OTLP schema information with contextual help
* Provide temporal navigation through snapshots with comparison capabilities
* Visualize rich dimensional hierarchy (Resource → Scope → DataPoint attributes)
* Show detailed context for selected series with contribution analysis
* Integrate exemplars directly into the metric visualization
* Provide quick access to cardinality insights and attribute stability
* Enable contextual actions based on the selected metric/series

---

## Component Architecture

The MetricInstanceWidget is composed of several interlinked sections:

1. **Snapshot Timeline** - Navigation through temporal snapshots
2. **Schema Summary Strip** - OTLP schema properties with contextual help
3. **Rich Dimensional Explorer** - Hierarchical view of metric dimensions
4. **Detail Pane** - Contextual information for selected series
5. **Cardinality Insights** - Quick cardinality metrics and stability indicators
6. **Action Footer** - Contextual actions for the selected metric/series

---

## Visual Design

```text
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ⏱ Snapshot Timeline:   ◀ previous | Active: B (14:37:10Z) | A (14:32:10Z) | next ▶  Δ +300s  │
│                          └─ (compare with A)        └─ (baseline)           [Live Update ⏸]  │
│─────────────────────────────────────────────────────────────────────────── View: [Schema+] │
│  Metric • process.cpu.time                                                                  │
│  ─────────────────────────────────────────────────────────────────────────────────────────── │
│  INSTRUMENT  Sum (Counter)                UNIT   s (seconds)       i⃝ Hover for details      │
│  TEMPORALITY CUMULATIVE                   MONOTONIC  yes                                    │
│  DESCRIPTION  "CPU time consumed by the process"                                              │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ RICH DIMENSIONAL EXPLORER (Filter: [state:user...          ]) (Tree | Flat List)             │
│                                                                                               │
│  Resource ⤵ (2 attributes, 48 series impacted by this group)                               │
│  ├─ host.name            = "alpha"   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  42 srs  (stable)                    │
│  └─ process.pid          = 4321      ▒▒▒▒                 6 srs  (new in B) ❗             │
│                                                                                               │
│  Scope ⤵ (1 attribute, 128 series)                                                        │
│  └─ io.opentelemetry.runtime 1.18.0                                                          │
│                                                                                               │
│  DataPoint Attributes (drill-down) ⤵ (showing top 3 by series count)                        │
│  ├─ state = user          ████████████████████  87 srs (68%)  Δ +5 srs                      │
│  ├─ state = system        ████              23 srs (18%)  Δ -2 srs                      │
│  └─ state = idle          ██                18 srs (14%)  (stable)                      │
│  [Show all 7 attributes...]                                                                   │
│  ───────────  ← click any leaf to pivot detail | Ctrl+Click to add to comparison  ─────────── │
│                                                                                               │
│  ⮕  Total Series for "process.cpu.time"            128 (Δ +3 vs A)                           │
│      •  Avg labels per-series                      3.2 (stable)                              │
│      •  Attribute with max uniq-values             host.name (32 values)                     │
│      ⤷  [Open full Cardinality Analyzer]   [View Attribute Stability Report]                  │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ DETAIL PANE (Selected: host.name="alpha", state="user")   [Pin Series] [Compare Series]     │
│                                                                                               │
│  ▸ Current Value (Snapshot B)        801.2 s      📈 Mini-Trend (last 10m):  ▂▃▄▅▆▇          │
│    Delta vs A                         +75.3 s  ▲                                             │
│    Rate / s (over Δ)                  0.251 s/s                                              │
│                                                                                               │
│  ▸ Contribution & Comparison (for "state=user" on "alpha")                                  │
│    – % of total "process.cpu.time" on "alpha": 55% (B) vs 52% (A)                           │
│    – % of total "state=user" across all hosts: 30% (B) vs 28% (A)                           │
│                                                                                               │
│  ▸ Humanised Views                                                                          │
│    – Seconds ➜ HH:MM:SS          00:13:21                                                     │
│    – % CPU (1 core, process uptime if avail.)   25.1 % (estimate)                           │
│                                                                                               │
│  ▸ Linked Exemplars (Snapshot B) (2 found)                                                  │
│    – traceID: a3f7b2... spanID: c4d8e1... val: 0.8s @14:37:05Z {http.route:"/api/data"}   [↗] │
│    – traceID: b9c2e0... spanID: d1e5f2... val: 0.6s @14:36:50Z {db.statement:"SELECT..."} [↗] │
│                                                                                               │
│  ▸ Raw OTLP JSON (⬈ copy)  (Point B | Point A | Diff)                                       │
│    { "timeUnixNano":"172883...", "value":801.2, "attrs":{...}, "exemplars": [...] }         │
│                                                                                               │
│────────────────────────────────────────── ACTIONS ───────────────────────────────────────────│
│  [Show Metric Definition Over Time] [Inspect Sibling Series] [Open OTEL Docs for process.cpu.time]│
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Props

```ts
export interface MetricInstanceWidgetProps {
  metricKey: string;                      // Unique metric identifier 
  snapshots: Record<string, ParsedSnapshot>; // Available snapshots
  activeSnapshotId: string;               // Currently active snapshot (B)
  baselineSnapshotId?: string;            // Comparison snapshot (A)
  onSelectSeries?: (seriesKey: string) => void; // Callback for series selection
  onInspectMetric?: (metricKey: string) => void; // Callback for metric inspection
  onShowCardinality?: (metricKey: string) => void; // Callback for cardinality view
  className?: string;                     // Additional CSS classes
}
```

---

## EventBus Subscriptions

| Event                  | Action                                      |
|------------------------|---------------------------------------------|
| `snapshot.loaded`      | Update timeline with new snapshot           |
| `ui.metric.select`     | Load selected metric data                   |
| `ui.series.select`     | Update detail pane with selected series     |
| `ui.mode.change`       | Toggle between view modes                   |

---

## EventBus Emissions

| Event                   | Payload                                     |
|-------------------------|---------------------------------------------|
| `ui.series.select`      | `{ metricKey: string, seriesKey: string }`  |
| `ui.snapshot.select`    | `{ snapshotId: string, role: 'active'|'baseline' }` |
| `ui.attribute.filter`   | `{ attributeKey: string, value: string }`   |
| `ui.view.cardinality`   | `{ metricKey: string }`                    |

---

## Implementation Notes

### Component Structure

The MetricInstanceWidget is composed of several sub-components:

1. **SnapshotTimeline** - Handles temporal navigation
2. **SchemaInfoStrip** - Displays OTLP schema properties
3. **DimensionalExplorer** - Visualizes attribute hierarchy
4. **SeriesDetailPane** - Shows details of selected series
5. **CardinalityInsight** - Provides cardinality overview
6. **ActionFooter** - Contains contextual actions

### State Management

The widget uses custom hooks to access and manipulate state:

1. `useMetricDefinition(metricKey)` - Fetch metric schema information
2. `useMetricSeries(metricKey, snapshots)` - Get all series for the metric
3. `useSeriesDetail(metricKey, seriesKey, snapshots)` - Get details for a specific series
4. `useSnapshotTimeline(snapshots, activeId, baselineId)` - Manage temporal navigation
5. `useCardinalityInsight(metricKey)` - Get cardinality statistics

### Accessibility

- Rich keyboard navigation with arrow keys for exploring dimensions
- ARIA attributes for screen reader support
- Focus management for interactive elements
- Color contrast compliance for all visualizations

### Performance Optimizations

- Virtualized rendering for large dimension trees
- Memoization of expensive computations
- Lazy loading of detailed data
- Web Worker offloading for complex calculations

---

## Implementation Roadmap

1. **Phase α: Core Framework**
   - Create base component structure
   - Implement timeline navigation
   - Build schema information display

2. **Phase β: Dimensional Explorer**
   - Implement tree/list visualization
   - Add filtering and attribute selection
   - Build heat map visualization

3. **Phase γ: Detail Enhancement**
   - Add mini-trend sparkline
   - Implement contribution statistics
   - Build humanized views

4. **Phase δ: Exemplar Integration**
   - Add exemplar fetching and display
   - Implement trace linking

5. **Phase ε: Cardinality Insights**
   - Add cardinality statistics
   - Implement attribute stability reporting

6. **Phase ζ: Contextual Actions**
   - Add dynamic action generation
   - Implement external documentation linking