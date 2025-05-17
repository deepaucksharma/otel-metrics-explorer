/**
 * Diff Data Selectors
 * 
 * Custom selectors for accessing diff data from the store
 */

import { useStore } from '../../services/stateStore';
import type { DiffedMetric, DiffedSeries } from '../../utils/diffEngine';

/**
 * Get a list of all diffed metrics with optional filtering
 */
export function useDiffedMetrics(options: {
  filterText?: string;
  metricType?: string;
  sortBy?: 'name' | 'type' | 'delta' | 'rate';
  orderDir?: 'asc' | 'desc';
} = {}) {
  return useStore(state => {
    const { currentDiff } = state.diffStore;
    if (!currentDiff || !currentDiff.metrics) return [];
    
    const { filterText, metricType, sortBy = 'name', orderDir = 'asc' } = options;
    
    // Get all metrics
    let metrics = Object.values(currentDiff.metrics);
    
    // Apply text filter if provided
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      metrics = metrics.filter(
        metric => metric.name.toLowerCase().includes(lowerFilter) || 
                 (metric.description?.toLowerCase().includes(lowerFilter))
      );
    }
    
    // Apply type filter if provided
    if (metricType) {
      metrics = metrics.filter(metric => metric.type === metricType);
    }
    
    // Apply sorting
    metrics.sort((a, b) => {
      let compareResult = 0;
      
      switch (sortBy) {
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
          
        case 'type':
          compareResult = a.type.localeCompare(b.type);
          break;
          
        case 'delta':
          // Get average delta across all series for each metric
          const avgDeltaA = getAverageDelta(a);
          const avgDeltaB = getAverageDelta(b);
          compareResult = avgDeltaA - avgDeltaB;
          break;
          
        case 'rate':
          // Get average rate across all series for each metric
          const avgRateA = getAverageRate(a);
          const avgRateB = getAverageRate(b);
          compareResult = avgRateA - avgRateB;
          break;
          
        default:
          compareResult = 0;
      }
      
      // Apply sort direction
      return orderDir === 'asc' ? compareResult : -compareResult;
    });
    
    return metrics;
  });
}

/**
 * Get a diffed metric by its name
 */
export function useDiffedMetric(metricName: string): DiffedMetric | undefined {
  return useStore(state => state.getDiffedMetricByName(metricName));
}

/**
 * Get a diffed series by its key
 */
export function useDiffedSeries(seriesKey: string): DiffedSeries | undefined {
  return useStore(state => state.getDiffedSeriesByKey(seriesKey));
}

/**
 * Get all series for a specific metric
 */
export function useDiffedSeriesForMetric(metricName: string): DiffedSeries[] {
  return useStore(state => state.getRelatedSeriesForMetric(metricName));
}

/**
 * Get information about the time gap between snapshots
 */
export function useDiffTimeInfo() {
  return useStore(state => state.getDiffTimeInfo());
}

/**
 * Get metrics with the highest rate changes
 */
export function useTopRateChanges(limit = 5, includeDecreases = true): DiffedMetric[] {
  return useStore(state => {
    const { currentDiff } = state.diffStore;
    if (!currentDiff || !currentDiff.metrics) return [];
    
    // Get all metrics
    const metrics = Object.values(currentDiff.metrics);
    
    // Calculate average rate change for each metric
    const metricsWithRates = metrics.map(metric => {
      const avgRate = getAverageRate(metric);
      return { metric, avgRate };
    });
    
    // Filter out metrics with no rate or unwanted decreases
    const filteredMetrics = metricsWithRates.filter(({ avgRate }) => {
      if (!isFinite(avgRate) || isNaN(avgRate)) return false;
      return includeDecreases || avgRate >= 0;
    });
    
    // Sort by absolute rate change (to get biggest movers)
    filteredMetrics.sort((a, b) => Math.abs(b.avgRate) - Math.abs(a.avgRate));
    
    // Return just the metrics
    return filteredMetrics.slice(0, limit).map(item => item.metric);
  });
}

/**
 * Get metrics with reset counters
 */
export function useMetricsWithResets(): DiffedMetric[] {
  return useStore(state => {
    const { currentDiff } = state.diffStore;
    if (!currentDiff || !currentDiff.metrics) return [];
    
    // Filter metrics that have at least one series with a reset
    return Object.values(currentDiff.metrics).filter(metric => {
      if (!metric.series) return false;
      
      // Check if any series has a reset
      return Object.values(metric.series).some(series => series.resetDetected);
    });
  });
}

/**
 * Helper function to calculate average delta for a metric
 */
function getAverageDelta(metric: DiffedMetric): number {
  if (!metric.series || Object.keys(metric.series).length === 0) {
    return 0;
  }
  
  const deltas = Object.values(metric.series)
    .map(series => series.delta)
    .filter((delta): delta is number => delta !== undefined);
  
  if (deltas.length === 0) {
    return 0;
  }
  
  const sum = deltas.reduce((acc, delta) => acc + delta, 0);
  return sum / deltas.length;
}

/**
 * Helper function to calculate average rate for a metric
 */
function getAverageRate(metric: DiffedMetric): number {
  if (!metric.series || Object.keys(metric.series).length === 0) {
    return 0;
  }
  
  const rates = Object.values(metric.series)
    .map(series => series.rate)
    .filter((rate): rate is number => rate !== undefined);
  
  if (rates.length === 0) {
    return 0;
  }
  
  const sum = rates.reduce((acc, rate) => acc + rate, 0);
  return sum / rates.length;
}