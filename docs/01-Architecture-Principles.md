# 01 · Architecture Principles

This document is the **constitution** for every line of code in the OTLP Process Metrics Explorer.
All micro-components, PRs, and design decisions **MUST** conform to these rules.

---

## 1. Single-Responsibility Micro-Components

* Each file implements **exactly one concern** (UI tile, algorithm, or adapter).
* UI micro-components **must not** perform data parsing or heavy math.
* Logic micro-components **must not** render DOM or import React.
* Data providers **must not** know about UI state; they only emit `snapshot` events.

> **Checklist for reviewers:**  
> - Does the file do more than one thing?  
> - Does it import across layers (e.g. UI ↔ logic)?  
> If yes, request split / refactor.

---

## 2. Explicit Public Interfaces

Every `*-*.md` spec file defines:

| Section          | Must include                        |
|------------------|-------------------------------------|
| **Responsibility** | One-sentence purpose               |
| **Inputs / Props** | Exact types & formats              |
| **Events / Outputs** | EventBus names or return types   |
| **Dependencies** | Internal libs or slices it imports  |
| **Upstream Consumers** | Who calls / renders it         |

Implementation files must export **only** what the spec lists.

---

## 3. Allowed Dependency Flow

DataProvider → ParserWorker → StoreSlices
StoreSlices → UI (via hooks/selectors)
UI ↔ EventBus (fire & listen)
UI (Analyzer) → CardinalityEngine (worker)
UI (Config) → ConfigGenerator

* No reverse imports (e.g., logic importing UI).  
* Shared helpers live in `utils/`; they have **zero** external deps.

---

## 4. State Isolation (Zustand Slices)

| Slice       | Owns                                | Can read          |
|-------------|-------------------------------------|-------------------|
| `metrics`   | ParsedSnapshots, MetricDefs         | none              |
| `diff`      | Delta / Rate store                  | metrics           |
| `cardinality` | Counts & attr maps                | metrics           |
| `ui`        | View selections & panel toggles     | metrics, diff     |

UI components access state **only via selector hooks** (no global getState()).

---

## 5. Event Bus Contract (mitt)

| Channel                     | Payload                                   |
|-----------------------------|-------------------------------------------|
| `data.snapshot.loaded`      | `{frame:'A'|'B', snapshot}`               |
| `ui.metric.select`          | `metricKey:string`                        |
| `ui.mode.change`            | `'metrics'|'cardinality'`                 |
| `ui.inspect`                | `metricKey|string`                        |
| `config.ready`              | `yaml:string`                             |

*Fire-and-forget:* listeners must not throw; wrap handler in try/catch.

---

## 6. Worker-First Heavy Lifting

* Parsing (>2 MB JSON) and cardinality math run in **Web Workers**.
* Main thread budget: **< 16 ms blocking** per UI action.
* Shared memory only via structured-clone messages.

---

## 7. Performance Guardrails

| Budget                         | Threshold                 |
|--------------------------------|---------------------------|
| First Contentful Paint         | < 1.5 s @ 5 MB snapshot   |
| Bundle (initial, gzip)         | < 200 kB                  |
| Worker parse time              | < 30 ms / MB              |
| Re-render on store update      | < 16 ms                   |

Perf CI uses Lighthouse + Vitest benchmarks.

---

## 8. Accessibility & I18n

* All interactive elements: `role`, `aria-label`.  
* Color cues always paired with text/ico.  
* Strings wrapped in `t('key')` for future locale files.

---

## 9. Naming & File Conventions

* Files: `layer-purposeName.ts[x]` (e.g. `ui-GaugeStatCard.tsx`).  
* Tests: `*.spec.ts`.  
* Workers: `*.worker.ts`.  
* Docs: mirror code files (`32-ui-GaugeStatCard.md`).

---

## 10. Testing Doctrine

* 100 % branch coverage on utils & logic.  
* UI snapshot tests for every micro-component.  
* Contract tests: ParserWorker ↔ DiffEngine golden JSON.

---

## 11. Versioning & deprecation

* SemVer.  
* Breaking contract change requires ADR + major bump.  
* Deprecated events stay one minor cycle with console.warn.

---

Adhering to these principles guarantees:

* **Predictable change-sets** — easy code reviews.  
* **Swap-ability** — want Svelte instead of React? Replace the UI layer.  
* **Robust UX** — no parse-time jank, clear error boundaries.

_Questions? Open a discussion referencing this file._
