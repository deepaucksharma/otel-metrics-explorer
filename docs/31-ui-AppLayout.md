# 31 · ui-AppLayout
_A micro-component in the **UI layer**_

---

## Responsibility

* Provide the **structural shell** of the SPA:
  * Persistent **SidebarNavigator** on the left.
  * Dynamic **MainRouterOutlet** that swaps between “Metrics View” and
    “Cardinality Analyzer” based on `uiSlice.mode`.
  * Slide-over **DetailPanel** mounted in a portal.
  * Global **ToastCenter** for error/info toasts (listens to `data.error`).
* Handle **responsive behavior** (sidebar collapse on ≤ 768 px width).
* Own top-level keyboard shortcuts (e.g., `?` opens help, `Cmd+K` focuses search).

It contains **no business logic** aside from listening to UI-state selectors.

---

## Internal Dependencies

| Import                     | Purpose                                  |
|----------------------------|------------------------------------------|
| `30-ui-SidebarNavigator`   | Navigation & load controls               |
| `32-ui-GaugeStatCard` ...  | Render via `MainRouterOutlet` components |
| `34-ui-DetailPanel`        | Portal target `<div id="panel-root">`    |
| `state.uiSlice`            | Selector: `mode`, `detailOpen`           |
| `react-router-dom`         | Route handling (nested routes)           |
| `40-event-Bus`             | Subscribe to global keyboard shortcuts   |

_No logic-layer imports._

---

## Component Skeleton (React JSX)

```tsx
export const AppLayout: React.FC = () => {
  const mode = useUiSelector(s => s.mode);               // 'metrics' | 'cardinality'
  const detailOpen = useUiSelector(s => s.detailOpen);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <SidebarNavigator />

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-surface-0 p-4">
        <Routes>
          <Route path="/" element={<MetricsView />} />
          <Route path="/cardinality" element={<CardinalityView />} />
        </Routes>
      </main>

      {detailOpen && createPortal(<DetailPanel />, document.getElementById('panel-root')!)}
      <ToastCenter />
    </div>
  );
};
```

The router path is synced to uiSlice.mode by listener.

---

## Layout & CSS

`<aside>` width: `w-[var(--sidebar-w)] shrink-0 border-r`  
`<main>` flex-1 overflow-auto bg-surface-0 p-4

On small screens `<aside>` becomes fixed overlay with slide animation.

---

## Accessibility

Use landmark roles and trap focus when panel is open.

Keyboard shortcuts handled via `useGlobalHotkeys`.

---

Unit tests assert route switching and panel portal behavior.
