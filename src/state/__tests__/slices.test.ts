import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createMetricsSlice } from '../metricsSlice';
import { createUiSlice } from '../uiSlice';
import { createDiffSlice } from '../diffSlice';
import { createCardinalitySlice } from '../cardinalitySlice';
import type { AppStore } from '../store';

function createTestStore() {
  return create<AppStore>()(
    immer((set, get) => ({
      ...createMetricsSlice(set, get),
      ...createUiSlice(set, get),
      ...createDiffSlice(set, get),
      ...createCardinalitySlice(set, get),
    }))
  );
}

describe('DiffSlice actions', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('sets and clears diff results', () => {
    store.getState().setDiffResult('snapA', { diff: 1 });
    expect(store.getState().diffResults['snapA']).toEqual({ diff: 1 });

    store.getState().clearDiffResults();
    expect(Object.keys(store.getState().diffResults).length).toBe(0);
  });
});

describe('CardinalitySlice actions', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('sets analysis and recommendations', () => {
    store.getState().setCardinalityAnalysis('snapA', { series: 5 });
    store.getState().setRecommendations('snapA', { note: true });

    expect(store.getState().cardinalityAnalysis['snapA']).toEqual({ series: 5 });
    expect(store.getState().recommendations['snapA']).toEqual({ note: true });
  });

  it('updates cost model', () => {
    store.getState().updateCostModel({ costPerSeries: 2 });
    expect(store.getState().costModel.costPerSeries).toBe(2);
  });

  it('clears cardinality state', () => {
    store.getState().setCardinalityAnalysis('snapB', { a: 1 });
    store.getState().clearCardinality();
    expect(Object.keys(store.getState().cardinalityAnalysis).length).toBe(0);
    expect(Object.keys(store.getState().recommendations).length).toBe(0);
  });
});
