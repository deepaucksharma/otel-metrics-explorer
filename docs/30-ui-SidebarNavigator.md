# 30 · ui-SidebarNavigator
_A micro-component in the **UI layer**_

---

## Responsibility

* Present a **filterable, collapsible list** of available metrics and (optionally)
  processes/resources discovered in the loaded snapshots.
* Provide **mode toggle**: “Metrics View” ⟷ “Cardinality Analyzer”.
* Offer controls to **load Snapshot A / Snapshot B** via hidden file input
  (fires `ui.file.open` event).
* Emit **metric-selection** and **mode-change** events on the EventBus.
* Maintain zero business logic—state lives in `state.metricsSlice` and `state.uiSlice`.

It never:
* Parses OTLP, computes diffs, or accesses cardinality math.
* Directly mutates Zustand slices (dispatches via EventBus only).

---

## Public Props

Rendered by `AppLayout`; receives nothing—pulls data via selectors.

```ts
interface SidebarNavigatorProps {
  /** width in px (CSS var --sidebar-w) */
  width?: number;
}
```

---

## Internal Dependencies

| Module             | Reason                               |
|--------------------|--------------------------------------|
| state.metricsSlice | Selector: metricsList, resourceList  |
| state.uiSlice      | Selector: selectedMetric, mode       |
| 40-event-Bus       | Emits select / mode / file events    |
| utils/useDebounce  | Debounced search input               |
| Tailwind CSS       | Layout & theming                     |

No logic-layer or data-layer imports.

---

## Render Structure

```html
<aside class="sidebar">
  <header>
    <h1>Metrics Explorer</h1>
    <ModeToggle />
  </header>

  <SearchBox />
  <ProcessFilter />
  <MetricTree />

  <footer>
    <SnapLoadButton frame="A" />
    <SnapLoadButton frame="B" />
  </footer>
</aside>
```

---

## EventBus Publications

| Event              | Payload          |
|--------------------|------------------|
| ui.metric.select   | metricKey: string|
| ui.mode.change     | `'metrics'|'cardinality'` |
| ui.file.open       | FileList from hidden input |

---

## Accessibility Notes

`<aside role="navigation" aria-label="Metric Navigator">`

Search field has aria-autocomplete="list".

Metric rows have role="option" + aria-selected.

Keyboard:

↑/↓ moves focus, Enter selects metric.

Cmd/Ctrl + K focuses search.

---

Unit tests ensure events emit and search filters list correctly.
