# 35 · ui-CardinalityOverview
_A micro-component in the **UI layer** (Cardinality Analyzer home)_

---

## Responsibility

* Provide the **landing screen** when the user switches to “Cardinality Analyzer”.
* Summarize total series, show top-N metrics by series count, and heat indicators for high cardinality.
* Emit `ui.metric.cardinality.open` when a metric row is clicked to open the WhatIfSimulator.

---

## Internal Dependencies

| Import                   | Purpose                  |
|--------------------------|--------------------------|
| `state.cardinalitySlice` | Select `CardinalityStore`|
| `40-event-Bus`           | Emit open event          |
| `lib/charts/BarRenderer` | Total series bar         |
| `clsx`                   | Tailwind classes         |

No logic or data layer imports.

---

Metric table rows are virtualized for large datasets. Heat cells colorize based on thresholds.
