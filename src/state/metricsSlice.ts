import type { UIState } from './uiSlice';
import type { ParsedSnapshot, ParsedMetric } from '../types/otlp';
import { StateCreator } from 'zustand';

export interface MetricsSlice {
  snapshots: Record<string, ParsedSnapshot>;
  addSnapshot: (snapshot: ParsedSnapshot) => void;
  removeSnapshot: (snapshotId: string) => void;
  clearSnapshots: () => void;
  getMetricById: (metricId: string) => ParsedMetric | undefined;
  getMetricsForSnapshot: (snapshotId: string) => ParsedMetric[];
}

export const createMetricsSlice: StateCreator<
  MetricsSlice & { uiState: UIState },
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  MetricsSlice
> = (set, get) => ({
  snapshots: {},

  addSnapshot: (snapshot) => {
    set((state) => {
      state.snapshots[snapshot.id] = snapshot;
      if (state.uiState.selectedSnapshotId === null) {
        state.uiState.selectedSnapshotId = snapshot.id;
      }
    });
  },

  removeSnapshot: (snapshotId) => {
    set((state) => {
      delete state.snapshots[snapshotId];

      if (state.uiState.selectedSnapshotId === snapshotId) {
        const remainingIds = Object.keys(state.snapshots);
        state.uiState.selectedSnapshotId =
          remainingIds.length > 0 ? remainingIds[0] : null;
      }

      if (state.uiState.comparisonSnapshotId === snapshotId) {
        state.uiState.comparisonSnapshotId = null;
      }

      if (state.uiState.selectedMetricId) {
        const selectedMetric = get().getMetricById(state.uiState.selectedMetricId);
        if (!selectedMetric) {
          state.uiState.selectedMetricId = null;
        }
      }
    });
  },

  clearSnapshots: () => {
    set((state) => {
      state.snapshots = {};
      state.uiState.selectedSnapshotId = null;
      state.uiState.comparisonSnapshotId = null;
      state.uiState.selectedMetricId = null;
      state.uiState.expandedMetricIds = [];
    });
  },

  getMetricById: (metricId) => {
    const { snapshots, uiState } = get();
    if (!uiState.selectedSnapshotId) return undefined;
    const snapshot = snapshots[uiState.selectedSnapshotId];
    if (!snapshot) return undefined;
    return snapshot.metrics[metricId];
  },

  getMetricsForSnapshot: (snapshotId) => {
    const { snapshots } = get();
    const snapshot = snapshots[snapshotId];
    if (!snapshot) return [];
    return Object.values(snapshot.metrics);
  },
});

