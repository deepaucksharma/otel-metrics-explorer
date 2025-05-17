# 02 · Dependency Graph & Layer Boundaries

This file is the **single source of truth** for _who may import whom_.
If you introduce a new dependency path, **update this page in the same PR**.

---

## 1. Layer Pyramid

```scss
    ┌───────────────────┐
    │   UI Components   │   (React / Vue)
    └─────────▲─────────┘
              │  (selector props / events)
    ┌─────────┴─────────┐
    │   State Slices    │   (Zustand)
    └─────────▲─────────┘
              │  (pure data, no DOM)
    ┌─────────┴─────────┐
    │     Logic         │   (Workers & pure TS)
    └─────────▲─────────┘
              │  (structured-clone messages)
    ┌─────────┴─────────┐
    │   Data Providers  │   (Static file, WS stream)
    └─────────┴─────────┘
```

*Arrows = allowed import direction.*  
Blue arrows = **EventBus** (`mitt`) messages rather than direct imports.

---

## 2. Detailed Graph (micro-component level)

```
data-StaticFileProvider
│ emits data.snapshot.loaded
▼
logic-ParserWorker ◄───────── data-LiveWsProvider (future)
│ posts worker.parsed
▼
state.metricsSlice
├──→ logic-DiffEngine (computes diff → state.diffSlice)
└──→ logic-CardinalityEngine (worker) → state.cardinalitySlice
▲ ▲
│ ui-WhatIfSimulator ── dropList ───┘
│
ui-SidebarNavigator ─ ui.metric.select ───► state.uiSlice
ui-GaugeStatCard ─ ui.inspect ─────────► ui-DetailPanel
ui-RateDeltaCard ─ ui.inspect ─────────► ui-DetailPanel
logic-ConfigGenerator ─ config.ready ───────► ui-ConfigExportModal
```

Legend  
* **Solid line** = direct import (`import X from '...'`).  
* **Dashed** = EventBus topic.  
* **Arrow** points **towards** the consumer.

---

## 3. Import Rules (ESLint plugin)

Create `eslint.config.cjs` rule:

```json
{
  "no-restricted-imports": [
    "error",
    {
      "patterns": [
        { "group": ["ui-*"], "message": "UI cannot import logic-*, data-* or workers" },
        { "group": ["logic-*"], "message": "Logic cannot import ui-* or react" },
        { "group": ["data-*"], "message": "Data layer imports only utils, not ui-* nor logic-* nor state-*" }
      ]
    }
  ]
}
```

---

## 4. Event Channels

| Channel | Fired by | Consumed by |
|---------|----------|-------------|
| data.snapshot.loaded | data-* providers | logic-ParserWorker |
| worker.parsed | ParserWorker | state.metricsSlice |
| ui.metric.select | ui-SidebarNavigator | state.uiSlice |
| ui.mode.change | ui-SidebarNavigator | state.uiSlice |
| ui.inspect | Gauge/Rate cards | ui-DetailPanel |
| config.ready | logic-ConfigGenerator | ui-ConfigExportModal |

All channels and payload shapes live in 40-event-Bus.md.

---

## 5. Cross-Layer Data Shapes

Snapshots only travel ↓ from Data → Logic → State; never re-emitted up.

MetricDefinitions, DiffStore, CardinalityStore live in state slices
and are accessed read-only by UI via selectors.

---

## 6. Adding a New Component

1. Decide layer (Data / Logic / UI).
2. Create `NN-layer-Name.md` in /docs with contract.
3. Update ASCII graph above if import flow changes.
4. Adjust ESLint rule patterns if a new layer prefix is introduced.

Visual Aid (PNG)  
docs/assets/dependency-graph.png  
(Generated with Mermaid – keep diagram in sync.)

Any PR breaking these boundaries will fail CI.
