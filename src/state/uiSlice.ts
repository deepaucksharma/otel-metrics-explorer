import type { MetricsSlice } from './metricsSlice';
import { StateCreator } from 'zustand';

export interface UIState {
  selectedSnapshotId: string | null;
  comparisonSnapshotId: string | null;
  selectedMetricId: string | null;
  expandedMetricIds: string[];
  viewMode: 'list' | 'grid' | 'treemap';
  sortBy: 'name' | 'type' | 'cardinality';
  filterText: string;
  showMetadata: boolean;
  isDarkMode: boolean;
}

export interface UiSlice {
  uiState: UIState;
  setSelectedSnapshot: (snapshotId: string | null) => void;
  setComparisonSnapshot: (snapshotId: string | null) => void;
  setSelectedMetric: (metricId: string | null) => void;
  toggleExpandedMetric: (metricId: string) => void;
  setViewMode: (mode: 'list' | 'grid' | 'treemap') => void;
  setSortBy: (sortBy: 'name' | 'type' | 'cardinality') => void;
  setFilterText: (text: string) => void;
  toggleMetadataVisibility: () => void;
  toggleDarkMode: () => void;
}

export const createUiSlice: StateCreator<
  UiSlice & MetricsSlice,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  UiSlice
> = (set, get) => ({
  uiState: {
    selectedSnapshotId: null,
    comparisonSnapshotId: null,
    selectedMetricId: null,
    expandedMetricIds: [],
    viewMode: 'list',
    sortBy: 'name',
    filterText: '',
    showMetadata: true,
    isDarkMode: typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  },

  setSelectedSnapshot: (snapshotId) => {
    set((state) => {
      state.uiState.selectedSnapshotId = snapshotId;

      if (state.uiState.comparisonSnapshotId === snapshotId) {
        state.uiState.comparisonSnapshotId = null;
      }

      if (state.uiState.selectedMetricId) {
        if (snapshotId === null) {
          state.uiState.selectedMetricId = null;
        } else {
          const metrics = get().getMetricsForSnapshot(snapshotId);
          const isMetricInSnapshot = metrics.some(
            (m) => m.id === state.uiState.selectedMetricId
          );
          if (!isMetricInSnapshot) {
            state.uiState.selectedMetricId = null;
          }
        }
      }
    });
  },

  setComparisonSnapshot: (snapshotId) => {
    set((state) => {
      state.uiState.comparisonSnapshotId = snapshotId;
    });
  },

  setSelectedMetric: (metricId) => {
    set((state) => {
      state.uiState.selectedMetricId = metricId;
      if (metricId && !state.uiState.expandedMetricIds.includes(metricId)) {
        state.uiState.expandedMetricIds.push(metricId);
      }
    });
  },

  toggleExpandedMetric: (metricId) => {
    set((state) => {
      const index = state.uiState.expandedMetricIds.indexOf(metricId);
      if (index === -1) {
        state.uiState.expandedMetricIds.push(metricId);
      } else {
        state.uiState.expandedMetricIds.splice(index, 1);
      }
    });
  },

  setViewMode: (mode) => {
    set((state) => {
      state.uiState.viewMode = mode;
    });
  },

  setSortBy: (sortBy) => {
    set((state) => {
      state.uiState.sortBy = sortBy;
    });
  },

  setFilterText: (text) => {
    set((state) => {
      state.uiState.filterText = text;
    });
  },

  toggleMetadataVisibility: () => {
    set((state) => {
      state.uiState.showMetadata = !state.uiState.showMetadata;
    });
  },

  toggleDarkMode: () => {
    set((state) => {
      state.uiState.isDarkMode = !state.uiState.isDarkMode;
    });
  },
});

