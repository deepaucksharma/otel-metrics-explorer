/**
 * State Store Service
 * 
 * A centralized state management service using Zustand
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { ParsedSnapshot, ParsedMetric } from '../contracts/otlp';

export interface AppState {
  // Snapshots
  snapshots: Record<string, ParsedSnapshot>;
  
  // UI State
  uiState: {
    selectedSnapshotId: string | null;
    comparisonSnapshotId: string | null;
    selectedMetricId: string | null;
    expandedMetricIds: string[];
    viewMode: 'list' | 'grid' | 'treemap';
    sortBy: 'name' | 'type' | 'cardinality';
    filterText: string;
    showMetadata: boolean;
    isDarkMode: boolean;
  };
  
  // Analysis State
  analysisState: {
    cardinalityAnalysis: Record<string, any>;
    recommendations: Record<string, any>;
    costModel: {
      costPerSeries: number;
      costPerDataPoint: number;
      retentionPeriodDays: number;
      scrapeIntervalSeconds: number;
      currency: string;
    };
  };
}

// Actions
export interface StoreActions {
  // Snapshot actions
  addSnapshot: (snapshot: ParsedSnapshot) => void;
  removeSnapshot: (snapshotId: string) => void;
  clearSnapshots: () => void;
  
  // UI actions
  setSelectedSnapshot: (snapshotId: string | null) => void;
  setComparisonSnapshot: (snapshotId: string | null) => void;
  setSelectedMetric: (metricId: string | null) => void;
  toggleExpandedMetric: (metricId: string) => void;
  setViewMode: (mode: 'list' | 'grid' | 'treemap') => void;
  setSortBy: (sortBy: 'name' | 'type' | 'cardinality') => void;
  setFilterText: (text: string) => void;
  toggleMetadataVisibility: () => void;
  toggleDarkMode: () => void;
  
  // Selector helpers
  getMetricById: (metricId: string) => ParsedMetric | undefined;
  getMetricsForSnapshot: (snapshotId: string) => ParsedMetric[];
}

// Create the store
export const useStore = create<AppState & StoreActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      snapshots: {},
      
      uiState: {
        selectedSnapshotId: null,
        comparisonSnapshotId: null,
        selectedMetricId: null,
        expandedMetricIds: [],
        viewMode: 'list',
        sortBy: 'name',
        filterText: '',
        showMetadata: true,
        isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      },
      
      analysisState: {
        cardinalityAnalysis: {},
        recommendations: {},
        costModel: {
          costPerSeries: 0.001,
          costPerDataPoint: 0.0000001,
          retentionPeriodDays: 30,
          scrapeIntervalSeconds: 60,
          currency: 'USD',
        },
      },
      
      // Actions
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
          // Delete the snapshot
          delete state.snapshots[snapshotId];
          
          // Update selected snapshot if needed
          if (state.uiState.selectedSnapshotId === snapshotId) {
            const remainingIds = Object.keys(state.snapshots);
            state.uiState.selectedSnapshotId = remainingIds.length > 0 ? remainingIds[0] : null;
          }
          
          // Update comparison snapshot if needed
          if (state.uiState.comparisonSnapshotId === snapshotId) {
            state.uiState.comparisonSnapshotId = null;
          }
          
          // Clear selected metric if it belongs to the removed snapshot
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
      
      setSelectedSnapshot: (snapshotId) => {
        set((state) => {
          state.uiState.selectedSnapshotId = snapshotId;
          
          // Clear comparison if it's the same as selected
          if (state.uiState.comparisonSnapshotId === snapshotId) {
            state.uiState.comparisonSnapshotId = null;
          }
          
          // Clear selected metric if not in this snapshot
          if (state.uiState.selectedMetricId) {
            if (snapshotId === null) {
              state.uiState.selectedMetricId = null;
            } else {
              const metrics = get().getMetricsForSnapshot(snapshotId);
              const isMetricInSnapshot = metrics.some(m => m.id === state.uiState.selectedMetricId);
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
          
          // Auto-expand the selected metric
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
      
      // Selector helpers
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
    }))
  )
);
