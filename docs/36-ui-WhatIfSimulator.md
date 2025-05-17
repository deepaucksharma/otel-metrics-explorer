# 36 · ui-WhatIfSimulator
_A micro-component in the **UI layer** (Cardinality Analyzer drill-down)_

---

## Responsibility

* Allow the user to **interactively drop one or more attribute keys** from a selected metric and see the estimated reduction in series count and cost.
* Visualise the impact with a treemap of attribute unique counts and a bar comparing original vs simulated series count.
* Issue `DropPlan` to `logic-CardinalityEngine` and render returned results.

---

## Inputs

```ts
interface WhatIfSimulatorProps {
  metricName: string;
}
```

Metric details loaded from `state.cardinalitySlice`.

---

Simulation results update via `cardinality.simulated` events.
