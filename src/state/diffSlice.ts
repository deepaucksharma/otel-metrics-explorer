/**
 * DiffSlice
 * 
 * State store slice for handling metric diffs and rates
 */

import { StateCreator } from 'zustand';
import { DiffResult, DiffedMetric, DiffedSeries } from '../utils/diffEngine';
import type { MetricsSlice } from './metricsSlice';
import type { UIState } from './uiSlice';

export interface DiffSlice {
  // State
  diffStore: {
    currentDiff: DiffResult | null;
    previousDiffs: DiffResult[];
    maxStoredDiffs: number;
    lastUpdated: number;
    liveMode: boolean;
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
  };

  // Actions
  setDiffStore: (diff: DiffResult) => void;
  clearDiffStore: () => void;
  setLiveMode: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean, interval?: number) => void;
  
  // Selectors (for components to access diff data efficiently)
  getDiffedMetricByName: (metricName: string) => DiffedMetric | undefined;
  getDiffedSeriesByKey: (seriesKey: string) => DiffedSeries | undefined;
  getRelatedSeriesForMetric: (metricName: string) => DiffedSeries[];
  getDiffTimeInfo: () => { timeGapMs: number; lastUpdated: number };
}

/**
 * Creates a diff slice with state and actions
 */
export const createDiffSlice: StateCreator<
  DiffSlice & MetricsSlice & { uiState: UIState },
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  DiffSlice
> = (set, get) => ({
  // Initial state
  diffStore: {
    currentDiff: null,
    previousDiffs: [],
    maxStoredDiffs: 10, // Store up to 10 previous diffs for historical analysis
    lastUpdated: 0,
    liveMode: false,
    autoRefreshEnabled: false,
    autoRefreshInterval: 30000, // Default 30 seconds
  },

  /**
   * Set the current diff result
   */
  setDiffStore: (diff: DiffResult) => {
    set((state) => {
      // Move current diff to history if it exists
      if (state.diffStore.currentDiff) {
        state.diffStore.previousDiffs.unshift(state.diffStore.currentDiff);
        
        // Trim history if it exceeds max size
        if (state.diffStore.previousDiffs.length > state.diffStore.maxStoredDiffs) {
          state.diffStore.previousDiffs.pop();
        }
      }
      
      // Set the new diff as current
      state.diffStore.currentDiff = diff;
      state.diffStore.lastUpdated = Date.now();
    });
  },

  /**
   * Clear the diff store
   */
  clearDiffStore: () => {
    set((state) => {
      state.diffStore.currentDiff = null;
      state.diffStore.previousDiffs = [];
      state.diffStore.lastUpdated = Date.now();
    });
  },

  /**
   * Enable or disable live mode
   */
  setLiveMode: (enabled: boolean) => {
    set((state) => {
      state.diffStore.liveMode = enabled;
    });
  },

  /**
   * Configure auto-refresh settings
   */
  setAutoRefresh: (enabled: boolean, interval?: number) => {
    set((state) => {
      state.diffStore.autoRefreshEnabled = enabled;
      
      if (interval && interval >= 1000) { // Minimum 1 second
        state.diffStore.autoRefreshInterval = interval;
      }
    });
  },

  /**
   * Get a diffed metric by its name
   */
  getDiffedMetricByName: (metricName: string): DiffedMetric | undefined => {
    const { currentDiff } = get().diffStore;
    if (!currentDiff || !currentDiff.metrics) return undefined;
    
    return currentDiff.metrics[metricName];
  },

  /**
   * Get a diffed series by its key
   */
  getDiffedSeriesByKey: (seriesKey: string): DiffedSeries | undefined => {
    const { currentDiff } = get().diffStore;
    if (!currentDiff || !currentDiff.metrics) return undefined;
    
    // Check all metrics for a series with this key
    for (const metric of Object.values(currentDiff.metrics)) {
      if (metric.series && metric.series[seriesKey]) {
        return metric.series[seriesKey];
      }
    }
    
    return undefined;
  },

  /**
   * Get all series for a specific metric
   */
  getRelatedSeriesForMetric: (metricName: string): DiffedSeries[] => {
    const diffedMetric = get().getDiffedMetricByName(metricName);
    
    if (!diffedMetric || !diffedMetric.series) {
      return [];
    }
    
    return Object.values(diffedMetric.series);
  },

  /**
   * Get information about the diff time gap and last update
   */
  getDiffTimeInfo: () => {
    const { currentDiff, lastUpdated } = get().diffStore;
    
    return {
      timeGapMs: currentDiff?.timeGapMs || 0,
      lastUpdated,
    };
  },
});

