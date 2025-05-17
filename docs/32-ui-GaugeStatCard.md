# 32 · ui-GaugeStatCard
_A micro-component in the **UI layer**_

---

## Responsibility

* Render a **gauge-style statistic** for any metric whose instrument behaves as
  a **point-in-time value** (Gauge or non-monotonic Sum/UpDownCounter).
* Display the **current value** with unit, plus an optional **delta badge** when
  Snapshot B is loaded.
* Show contextual subtitling: metric name, resource identifiers, and metric-level
  attributes.
* Emit an **inspect** request when the card or its ℹ️ icon is clicked.

It never performs parsing or state mutation.

---

## Props

```ts
export interface GaugeStatCardProps {
  metricKey: string;              // e.g., 'system.memory.usage|state=used'
  value: number;                  // Already unit-normalised
  unit: string;                   // 'MB', '%', etc.
  delta?: number;                 // Optional: B − A
  attrs: AttrMap;                 // Subtitle attributes
  max?: number;                   // Optional gauge max
}
```

All props come from a selector in MetricsView.

---

## EventBus Emissions

| Event      | Payload            |
|------------|--------------------|
| ui.inspect | metricKey: string  |

---

## Render Structure (JSX)

```tsx
<div className="gauge-card" role="button" tabIndex={0} onClick={onCardClick}>
  <header className="flex items-center justify-between">
    <span className="text-sm font-medium truncate">{title}</span>
    <button aria-label="Inspect metric" onClick={handleInspect}>
      <InfoIcon size={16} />
    </button>
  </header>

  <div className="flex justify-center py-3">
    <GaugeRenderer value={value} max={max} />
  </div>

  <footer className="text-center">
    <span className="text-2xl font-semibold">{prettyValue}</span>
    {delta != null && (
      <span className={clsx('ml-1 text-sm', delta >= 0 ? 'text-green-600' : 'text-red-600')}>
        {delta >= 0 ? '▲' : '▼'} {formatDelta(delta, unit)}
      </span>
    )}
  </footer>
</div>
```

Accessibility: role="button", keyboard handlers, icon labels.

Unit tests cover delta rendering and inspect events.
