import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createMetricsSlice, MetricsSlice } from './metricsSlice';
import { createUiSlice, UiSlice } from './uiSlice';
import { createDiffSlice, DiffSlice } from './diffSlice';
import { createCardinalitySlice, CardinalitySlice } from './cardinalitySlice';

export type AppStore = MetricsSlice & UiSlice & DiffSlice & CardinalitySlice;

export const useStore = create<AppStore>()(
  devtools(
    immer((set, get) => ({
      ...createMetricsSlice(set, get),
      ...createUiSlice(set, get),
      ...createDiffSlice(set, get),
      ...createCardinalitySlice(set, get),
    }))
  )
);

