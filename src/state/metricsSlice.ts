import type { UIState } from './uiSlice';
import type { ParsedSnapshot, ParsedMetric } from '../types/otlp';
import type { MetricDefinition } from '../utils/metricDefinitions';
import { buildMetricDefinitionsFromSnapshots } from '../utils/metricDefinitions';
import { StateCreator } from 'zustand';

export interface MetricsSlice {
  snapshots: Record<string, ParsedSnapshot>;
  metricDefinitions: Record<string, MetricDefinition>;
  addSnapshot: (snapshot: ParsedSnapshot) => void;
  removeSnapshot: (snapshotId: string) => void;
  clearSnapshots: () => void;
  getMetricById: (metricId: string) => ParsedMetric | undefined;
  getMetricsForSnapshot: (snapshotId: string) => ParsedMetric[];
  getMetricDefinitionByName: (metricName: string) => MetricDefinition | undefined;
}

export const createMetricsSlice: StateCreator<
  MetricsSlice & { uiState: UIState },
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  MetricsSlice
> = (set, get) => ({
  snapshots: {},
  metricDefinitions: {},

  addSnapshot: (snapshot) => {
    set((state) => {
      // Add the snapshot
      state.snapshots[snapshot.id] = snapshot;
      
      // If no snapshot is selected, select this one
      if (state.uiState.selectedSnapshotId === null) {
        state.uiState.selectedSnapshotId = snapshot.id;
      }
      
      // Rebuild metric definitions to include this snapshot
      state.metricDefinitions = buildMetricDefinitionsFromSnapshots(state.snapshots);
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
      
      // Rebuild metric definitions after removing the snapshot
      state.metricDefinitions = buildMetricDefinitionsFromSnapshots(state.snapshots);
    });
  },

  clearSnapshots: () => {
    set((state) => {
      state.snapshots = {};
      state.metricDefinitions = {};
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
  
  getMetricDefinitionByName: (metricName) => {
    const { metricDefinitions } = get();
    return metricDefinitions[metricName];
  },
});

