# 33 · ui-RateDeltaCard
_A micro-component in the **UI layer**_

---

## Responsibility

* Visualise a **cumulative Sum metric** by presenting rate and delta per time interval.
* Show breakdown bars when the metric has a distinguishing attribute (`state`, `direction`, etc.).
* Detect and render counter-reset warnings for monotonic counters.
* Emit an **inspect** request on click.

---

## Props

```ts
interface RateDeltaCardProps {
  metricName: string;
  series: DiffSeries[];
  unit: string;
  attrKey?: string;
  isMonotonic: boolean;
  timeIntervalSec: number;
}
```

---

## Render Outline

Displays total rate and delta; if `attrKey` and multiple series present, shows a stacked bar chart.
Counter resets show a warning badge and hide rate/delta values.

---

Accessibility via role="button" and keyboard events. Unit tests validate rendering and events.
