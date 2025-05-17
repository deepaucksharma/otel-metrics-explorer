/**
 * Diff Engine Core Logic
 * 
 * This module contains the core logic for computing diffs between two OTLP metric snapshots.
 * It calculates deltas, rates, and detects counter resets.
 */

import type { ParsedSnapshot, ParsedMetric, MetricType } from '../types/otlp';

// Result of diffing two snapshots
export interface DiffResult {
  metrics: Record<string, DiffedMetric>;
  timeGapMs: number;
  snapshotAId: string;
  snapshotBId: string;
  timestamp: number;
}

// Diffed metric data
export interface DiffedMetric {
  id: string;
  name: string;
  type: MetricType;
  unit?: string;
  description?: string;
  series: Record<string, DiffedSeries>;
}

// Diffed series data for a specific metric dimension
export interface DiffedSeries {
  seriesKey: string;
  attributes: Record<string, string | number | boolean>;
  valueA?: number;
  valueB?: number;
  delta?: number;
  rate?: number;
  resetDetected?: boolean;
  valueWithReset?: number;
}

/**
 * Computes diffs between two snapshots
 * 
 * @param snapshotA First snapshot (earlier in time)
 * @param snapshotB Second snapshot (later in time)
 * @returns DiffResult containing all diffed metrics
 */
export function computeDiffs(snapshotA: ParsedSnapshot, snapshotB: ParsedSnapshot): DiffResult {
  // Validate inputs
  if (!snapshotA || !snapshotB) {
    throw new Error('Both snapshots must be defined');
  }

  // Calculate time gap between snapshots
  const timeGapMs = snapshotB.timestamp - snapshotA.timestamp;
  if (timeGapMs <= 0) {
    throw new Error('Snapshot B must be chronologically later than Snapshot A');
  }

  const diffResult: DiffResult = {
    metrics: {},
    timeGapMs,
    snapshotAId: snapshotA.id,
    snapshotBId: snapshotB.id,
    timestamp: Date.now(),
  };

  // Process all metrics from both snapshots
  const allMetricNames = new Set<string>();
  
  // Get all metric names from both snapshots
  Object.values(snapshotA.metrics).forEach(metric => allMetricNames.add(metric.name));
  Object.values(snapshotB.metrics).forEach(metric => allMetricNames.add(metric.name));

  // For each metric name, compute the diff
  allMetricNames.forEach(metricName => {
    // Find metrics in each snapshot
    const aMetrics = Object.values(snapshotA.metrics).filter(m => m.name === metricName);
    const bMetrics = Object.values(snapshotB.metrics).filter(m => m.name === metricName);
    
    if (aMetrics.length === 0 && bMetrics.length === 0) {
      return; // Skip if no metrics found in either snapshot
    }
    
    // Use the first metric as prototype for the diffed metric
    const protoMetric = aMetrics[0] || bMetrics[0];
    
    // Create a diffed metric entry
    const diffedMetric: DiffedMetric = {
      id: `diff_${protoMetric.id}`,
      name: protoMetric.name,
      type: protoMetric.type,
      unit: protoMetric.unit,
      description: protoMetric.description,
      series: {},
    };
    
    // Get all unique series keys from both snapshots
    const seriesKeys = new Set<string>();
    aMetrics.forEach(metric => {
      metric.dataPoints.forEach(dp => {
        if (dp.seriesKey) seriesKeys.add(dp.seriesKey);
      });
    });
    
    bMetrics.forEach(metric => {
      metric.dataPoints.forEach(dp => {
        if (dp.seriesKey) seriesKeys.add(dp.seriesKey);
      });
    });
    
    // Process each series
    seriesKeys.forEach(seriesKey => {
      const aDataPoint = findDataPointBySeriesKey(aMetrics, seriesKey);
      const bDataPoint = findDataPointBySeriesKey(bMetrics, seriesKey);
      
      if (!aDataPoint && !bDataPoint) {
        return; // Skip if no data points found for this series
      }
      
      // Create a diffed series
      const diffedSeries: DiffedSeries = {
        seriesKey,
        // Use attributes from whichever data point is available
        attributes: (aDataPoint?.attributes || bDataPoint?.attributes || {}) as Record<string, string | number | boolean>,
        valueA: aDataPoint?.value,
        valueB: bDataPoint?.value,
      };
      
      // Calculate delta if both values exist
      if (diffedSeries.valueA !== undefined && diffedSeries.valueB !== undefined) {
        diffedSeries.delta = diffedSeries.valueB - diffedSeries.valueA;
        
        // Calculate rate (change per second)
        diffedSeries.rate = (diffedSeries.delta / (timeGapMs / 1000));
        
        // For monotonic counters (sum type with monotonic=true), check for counter resets
        if (protoMetric.type === 'sum' && protoMetric.monotonic === true && diffedSeries.delta < 0) {
          diffedSeries.resetDetected = true;
          // For counter resets, we consider the delta to be just the new value
          diffedSeries.valueWithReset = diffedSeries.valueB;
        }
      }
      
      // Add to the diffed metric's series
      diffedMetric.series[seriesKey] = diffedSeries;
    });
    
    // Add to the diff result
    diffResult.metrics[metricName] = diffedMetric;
  });
  
  return diffResult;
}

/**
 * Finds a data point with a specific series key from a list of metrics
 */
function findDataPointBySeriesKey(metrics: ParsedMetric[], seriesKey: string) {
  if (!metrics || !Array.isArray(metrics)) return undefined;
  
  for (const metric of metrics) {
    if (!metric.dataPoints || !Array.isArray(metric.dataPoints)) continue;
    
    const dataPoint = metric.dataPoints.find(dp => dp.seriesKey === seriesKey);
    if (dataPoint) return dataPoint;
  }
  
  return undefined;
}

/**
 * Formats a rate value with appropriate units based on the original metric unit
 */
export function formatRate(rate: number, unit?: string): string {
  if (rate === undefined || rate === null) return 'N/A';
  
  // Format based on unit type
  if (unit) {
    // Bytes formatting
    if (unit.toLowerCase() === 'bytes' || unit.toLowerCase() === 'by') {
      return `${formatNumber(rate)}/s`;
    }
    
    // Percentage
    if (unit.toLowerCase() === '%' || unit.toLowerCase() === 'percent') {
      return `${formatNumber(rate)}%/s`;
    }
    
    // For other units, append /s
    return `${formatNumber(rate)} ${unit}/s`;
  }
  
  // Default number formatting
  return `${formatNumber(rate)}/s`;
}

/**
 * Formats a delta value with appropriate units based on the original metric unit
 */
export function formatDelta(delta: number, unit?: string): string {
  if (delta === undefined || delta === null) return 'N/A';
  
  // Format based on unit type
  if (unit) {
    // Bytes formatting
    if (unit.toLowerCase() === 'bytes' || unit.toLowerCase() === 'by') {
      return formatBytes(delta);
    }
    
    // Percentage
    if (unit.toLowerCase() === '%' || unit.toLowerCase() === 'percent') {
      return `${formatNumber(delta)}%`;
    }
    
    // For other units, append the unit
    return `${formatNumber(delta)} ${unit}`;
  }
  
  // Default number formatting
  return formatNumber(delta);
}

/**
 * Helper function to format a number
 */
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  // Handle decimals
  if (Number.isInteger(value)) {
    return value.toString();
  }
  
  return value.toFixed(2);
}

/**
 * Helper function to format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}