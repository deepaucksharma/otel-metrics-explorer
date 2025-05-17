# 41 · state-StoreSlices
_Zustand-powered **single‑source of state** for all UI & logic layers_

---

Four slices: `metricsSlice`, `diffSlice`, `cardinalitySlice`, and `uiSlice`.
Each slice owns its data and exposes selectors for UI components. Logic/Workers write only via actions.

Cross-slice read hierarchy:
`metrics` → `diff` → `cardinality` → `ui`.
