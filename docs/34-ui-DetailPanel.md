# 34 · ui-DetailPanel
_A micro-component in the **UI layer** (slide-over / modal)_

---

## Responsibility

* Display detailed schema and data inspection for the selected metric/series.
* Four tabbed sections: Schema, Resource Attributes, Metric Attributes/Data, Raw JSON.
* Close on Esc, backdrop click, or Close button.
* Portal-rendered into `#panel-root` outside normal DOM flow.

---

## EventBus Subscriptions

| Event            | Action       |
|------------------|--------------|
| `ui.inspect`     | Open panel   |
| `ui.detail.close`| Close panel  |

---

Component uses selectors to fetch definitions and diff rows. Accessibility via `role="dialog"` and focus trapping.
