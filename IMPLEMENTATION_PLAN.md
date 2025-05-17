# Implementation Plan: OTLP Process Metrics Explorer

Below is a **fine-grained work-breakdown structure (WBS)** that slices the project into **32 atomic tickets**.
Each ticket is small enough for a single engineer to ship in ≤ 2 days, has an explicit "ready-to-start when X is true" rule, and publishes stubs/mocks so downstream tasks can run in parallel.

> **Legend**
> `↦` = dependency (must finish before starting)
> **🎯** = milestone (merge cut)
> ⏱ = est. effort (person-days)

---

## Phase 0 · Bootstrap (Week 0) — Foundation

| #         | Ticket ID                                   | Description                                      | ⏱   | Depends |
| --------- | ------------------------------------------- | ------------------------------------------------ | --- | ------- |
| 0-1       | **infra-repo-init**                         | Repo, pnpm mono-workspace, Vite config, Husky    | 0.5 | —       |
| 0-2       | **contracts-package**                       | Implement `03-Data-Contracts` TS + npm workspace | 1   | 0-1     |
| 0-3       | **bus-singleton**                           | `event-bus.ts` with types + dev logger           | 0.5 | 0-1     |
| 0-4       | **store-skeleton**                          | Empty Zustand slices, devtools middleware        | 1   | 0-2     |
| 0-5       | **ci-skeleton**                             | Lint, vitest, jest, cypress workflows            | 1   | 0-1     |
| **🎯 M0** | *Boot passes CI* (all 0-X merged to `main`) |                                                  |     |         |

*All later tasks may proceed once their slice + contracts exist (0-2 … 0-4).*

---

## Phase 1 · "Hello Metrics" (Week 1-2) — MVP rails

### Track A ─ Data Ingestion

| #   | Ticket                 | Description                                                              | ⏱ | Depends |
| --- | ---------------------- | ------------------------------------------------------------------------ | - | ------- |
| 1-1 | **worker-parse-json**  | ParserWorker basic: parse JSON, validate root, echo snapshot ID          | 1 | 0-2     |
| 1-2 | **static-provider-v1** | Read file ➜ postMessage('parse'), wire EventBus (`data.snapshot.loaded`) | 1 | 1-1     |

### Track B ─ UI Scaffold

| #   | Ticket                       | Description                                                | ⏱   | Depends |
| --- | ---------------------------- | ---------------------------------------------------------- | --- | ------- |
| 1-3 | **layout-shell**             | `AppLayout` minimal w/ placeholder sidebar & main          | 0.5 | 0-4     |
| 1-4 | **sidebar-metric-list-stub** | Hard-code list from fixture JSON, emits `ui.metric.select` | 1   | 1-3     |
| 1-5 | **gauge-card-stub**          | Renders props passed by Storybook; no store yet            | 0.5 | 0-2     |

**🎯 M1 (end W2)** – Upload fixture ➜ sidebar shows metrics (text), card placeholder renders value from mock props.

---

## Phase 2 · Parsing & Definitions (Week 3-4)

### Track A continues

| #   | Ticket                 | Description                                     | ⏱ | Depends   |
| --- | ---------------------- | ----------------------------------------------- | - | --------- |
| 2-1 | **worker-seriesKey**   | Add `seriesKey` generation + attr flattening    | 1 | 1-1       |
| 2-2 | **metricsSlice-snapA** | `setSnapshot('A')`, metricDefs build, selectors | 1 | 0-4 ↦ 2-1 |
| 2-3 | **sidebar-from-slice** | Replace stub: list from selector, search filter | 1 | 1-4 ↦ 2-2 |

### Track B (UI Metrics View)

| #   | Ticket                  | Description                                  | ⏱   | Depends   |
| --- | ---------------------- | -------------------------------------------- | --- | --------- |
| 2-4 | **metrics-view-grid**    | Simple CSS grid, maps Defs → Dummy GaugeCard | 0.5 | 1-5 ↦ 2-2 |
| 2-5 | **gauge-card-real-data** | Selector for latest Gauge value (snap A)     | 1   | 2-2       |

**🎯 M2** – User uploads snapshot A → real Gauge cards populated.

---

## Phase 3 · Diff Engine & Rate Cards (Week 5-6)

### Track C ─ Logic Diff

| #   | Ticket                  | Description                                        | ⏱   | Depends   |
| --- | ----------------------- | -------------------------------------------------- | --- | --------- |
| 3-1 | **diff-engine-impl**    | Pure TS computeDiff + unit tests                   | 1   | 2-1       |
| 3-2 | **diffRunner-hook**     | Listen for snapshot B, run diff, write `diffSlice` | 0.5 | 3-1 ↦ 2-2 |
| 3-3 | **rate-card-component** | Impl UI card with reset flag                       | 1   | 0-2       |

### Track D ─ UI wiring

| #   | Ticket                     | Description                                | ⏱   | Depends |
| --- | -------------------------- | ------------------------------------------ | --- | ------- |
| 3-4 | **rate-card-selector**       | Selector pulls DiffStore for metric        | 0.5 | 3-2     |
| 3-5 | **metrics-view-choose-card** | If metric type Σ ⟶ RateCard else GaugeCard | 0.5 | 3-4     |

**🎯 M3** – Upload snapshots A+B → Rate card shows Δ & rate, reset badge works.

---

## Phase 4 · Cardinality Analyzer (Week 7-8)

### Track E ─ Engine

| #   | Ticket                 | Description                              | ⏱   | Depends |
| --- | ---------------------- | ---------------------------------------- | --- | ------- |
| 4-1 | **card-engine-inproc** | Counts per metric + attr unique values   | 1   | 2-1     |
| 4-2 | **card-slice-update**  | Write results in `cardinalitySlice`      | 0.5 | 4-1     |
| 4-3 | **simulate-drop-API**  | Function to recalc single metric offline | 1   | 4-1     |

### Track F ─ Analyzer UI

| #   | Ticket                  | Description                                    | ⏱   | Depends |
| --- | ----------------------- | ---------------------------------------------- | --- | ------- |
| 4-4 | **card-overview-table** | Read slice, heat column, click handler         | 1   | 4-2     |
| 4-5 | **whatif-UI-stub**      | Checkbox list + summary panel; mock sim result | 1   | 4-4     |
| 4-6 | **wire-simulateDrop**   | Connect to 4-3, update charts                  | 0.5 | 4-5     |

**🎯 M4** – Cardinality Analyzer functional & interactive.

---

## Phase 5 · Config Generation & Live WS (Week 9-10)

### Track G ─ Config

| #   | Ticket                     | Description                                 | ⏱   | Depends |
| --- | -------------------------- | ------------------------------------------- | --- | ------- |
| 5-1 | **config-tmpl-handlebars** | Attr delete + filter templates              | 0.5 | 0-2     |
| 5-2 | **configGenerator-impl**   | Accept DropPlan → YAML, emit `config.ready` | 0.5 | 5-1     |
| 5-3 | **config-modal**           | UI modal copy/download                      | 1   | 5-2     |
| 5-4 | **sim-to-config-button**   | Button in WhatIfSimulator → generator       | 0.5 | 5-3     |

### Track H ─ Live stream

| #   | Ticket                  | Description                              | ⏱ | Depends   |
| --- | --------------------- | ---------------------------------------- | - | --------- |
| 5-5 | **ws-core-connect**   | LiveWsProvider baseline, status events   | 1 | 0-3       |
| 5-6 | **ws-auto-reconnect** | Backoff & status UI pill                 | 1 | 5-5       |
| 5-7 | **diff-runner-live**  | Sliding window diff every incoming frame | 1 | 5-5 ↦ 3-1 |

**🎯 M5** – Users can drop labels → generate YAML; experimental live mode works.

---

## Phase 6 · Polish & GA (Week 11-12)

| Area | Key polish ticket                              | ⏱   |
| ---- | ---------------------------------------------- | --- |
| A11y | Axe run, fix violations (color contrast, aria) | 1   |
| Perf | Lighthouse score ≥90, lazy-load workers        | 1   |
| Docs | Add GIF demos, write README quick-start        | 0.5 |
| QA   | Manual checklist: dark mode, keyboard nav      | 1   |

**🎯 GA Milestone** – `v0.1.0` release tag.

---

## Visual Timeline (condensed)

```
Week 0  | Phase0 ■■■■■
Week 1-2| Phase1  A■■  B■■
Week 3-4| Phase2  A■■  B■■
Week 5-6| Phase3     C■■ D■■
Week 7-8| Phase4       E■■ F■■
Week 9-10| Phase5        G■■  H■■
Week 11-12| Phase6 polish & GA
```

Legend: ■ work spans; tracks overlap but rely only on finished upstream tickets.

---

## Coordination Rules

1. **Ticket owner delivers TS mocks** if upstream not finished (`.mock.ts`).
2. Each ticket ends with a **contract test** proving payload shape.
3. Only Milestones (M0-M5) merge to `main`; daily PRs merge to `integration`.

---

With this granular WBS, **eight engineers** can work almost continuously
without blocking each other, yet the dependencies are still obvious and
checked by CI contract tests.

## Progress Status (Current)

As of the initial repository setup, we have completed:

- ✅ **0-1 infra-repo-init**: Basic repository setup with git, initial React/Vite configuration
- ✅ **0-2 contracts-package**: Partial implementation of data contracts as TypeScript types
- ✅ **0-3 bus-singleton**: Event bus service with types and basic logging
- ✅ **0-4 store-skeleton**: Zustand store with basic state structure and devtools
- ⏳ **0-5 ci-skeleton**: Need to set up testing infrastructure

Next steps would be to:
1. Complete the remaining Milestone 0 (M0) tasks
2. Begin Track A and Track B work in parallel to reach Milestone 1
