/**
 * Tests for Diff Engine
 */
import { describe, it, expect } from 'vitest';
import { computeDiffs, formatRate, formatDelta } from '../diffEngine';
import { ParsedSnapshot } from '../../types/otlp';

describe('diffEngine', () => {
  describe('computeDiffs', () => {
    it('should compute basic diffs between two snapshots', () => {
      // Create sample snapshots with some metrics
      const snapshotA: ParsedSnapshot = createSampleSnapshot('snapA', 1000, {
        'metric1': { 'series1': 100, 'series2': 200 },
        'metric2': { 'series1': 500 }
      });
      
      const snapshotB: ParsedSnapshot = createSampleSnapshot('snapB', 2000, {
        'metric1': { 'series1': 150, 'series2': 250 },
        'metric2': { 'series1': 600 }
      });
      
      const result = computeDiffs(snapshotA, snapshotB);
      
      // Check basic properties
      expect(result.snapshotAId).toBe('snapA');
      expect(result.snapshotBId).toBe('snapB');
      expect(result.timeGapMs).toBe(1000);
      
      // Check metric1 diffs
      expect(result.metrics.metric1).toBeDefined();
      expect(result.metrics.metric1.series['metric1|series1']).toBeDefined();
      expect(result.metrics.metric1.series['metric1|series1'].valueA).toBe(100);
      expect(result.metrics.metric1.series['metric1|series1'].valueB).toBe(150);
      expect(result.metrics.metric1.series['metric1|series1'].delta).toBe(50);
      expect(result.metrics.metric1.series['metric1|series1'].rate).toBe(50); // 50 per second
      
      // Check metric2 diffs
      expect(result.metrics.metric2).toBeDefined();
      expect(result.metrics.metric2.series['metric2|series1']).toBeDefined();
      expect(result.metrics.metric2.series['metric2|series1'].valueA).toBe(500);
      expect(result.metrics.metric2.series['metric2|series1'].valueB).toBe(600);
      expect(result.metrics.metric2.series['metric2|series1'].delta).toBe(100);
      expect(result.metrics.metric2.series['metric2|series1'].rate).toBe(100); // 100 per second
    });
    
    it('should handle new metrics in snapshot B', () => {
      const snapshotA: ParsedSnapshot = createSampleSnapshot('snapA', 1000, {
        'metric1': { 'series1': 100 }
      });
      
      const snapshotB: ParsedSnapshot = createSampleSnapshot('snapB', 2000, {
        'metric1': { 'series1': 150 },
        'metric2': { 'series1': 500 } // New metric
      });
      
      const result = computeDiffs(snapshotA, snapshotB);
      
      // Check that metric2 is in the results
      expect(result.metrics.metric2).toBeDefined();
      expect(result.metrics.metric2.series['metric2|series1']).toBeDefined();
      expect(result.metrics.metric2.series['metric2|series1'].valueA).toBeUndefined();
      expect(result.metrics.metric2.series['metric2|series1'].valueB).toBe(500);
      expect(result.metrics.metric2.series['metric2|series1'].delta).toBeUndefined(); // No delta for new metrics
    });
    
    it('should handle metrics that disappeared in snapshot B', () => {
      const snapshotA: ParsedSnapshot = createSampleSnapshot('snapA', 1000, {
        'metric1': { 'series1': 100 },
        'metric2': { 'series1': 500 }
      });
      
      const snapshotB: ParsedSnapshot = createSampleSnapshot('snapB', 2000, {
        'metric1': { 'series1': 150 }
        // metric2 is gone
      });
      
      const result = computeDiffs(snapshotA, snapshotB);
      
      // Check that metric2 is in the results
      expect(result.metrics.metric2).toBeDefined();
      expect(result.metrics.metric2.series['metric2|series1']).toBeDefined();
      expect(result.metrics.metric2.series['metric2|series1'].valueA).toBe(500);
      expect(result.metrics.metric2.series['metric2|series1'].valueB).toBeUndefined();
      expect(result.metrics.metric2.series['metric2|series1'].delta).toBeUndefined(); // No delta
    });
    
    it('should detect counter resets for monotonic metrics', () => {
      const snapshotA: ParsedSnapshot = createSampleSnapshot('snapA', 1000, {
        'counter1': { 'series1': 1000 }
      }, 'sum', true); // sum type with monotonic=true
      
      const snapshotB: ParsedSnapshot = createSampleSnapshot('snapB', 2000, {
        'counter1': { 'series1': 500 } // Reset happened, new value is lower
      }, 'sum', true);
      
      const result = computeDiffs(snapshotA, snapshotB);
      
      // Check counter reset detection
      expect(result.metrics.counter1).toBeDefined();
      expect(result.metrics.counter1.series['counter1|series1']).toBeDefined();
      expect(result.metrics.counter1.series['counter1|series1'].valueA).toBe(1000);
      expect(result.metrics.counter1.series['counter1|series1'].valueB).toBe(500);
      expect(result.metrics.counter1.series['counter1|series1'].delta).toBe(-500);
      expect(result.metrics.counter1.series['counter1|series1'].resetDetected).toBe(true);
      expect(result.metrics.counter1.series['counter1|series1'].valueWithReset).toBe(500);
    });
    
    it('should handle new series in existing metrics', () => {
      const snapshotA: ParsedSnapshot = createSampleSnapshot('snapA', 1000, {
        'metric1': { 'series1': 100 }
      });
      
      const snapshotB: ParsedSnapshot = createSampleSnapshot('snapB', 2000, {
        'metric1': { 'series1': 150, 'series2': 200 } // New series
      });
      
      const result = computeDiffs(snapshotA, snapshotB);
      
      // Check that the new series is in the results
      expect(result.metrics.metric1).toBeDefined();
      expect(result.metrics.metric1.series['metric1|series2']).toBeDefined();
      expect(result.metrics.metric1.series['metric1|series2'].valueA).toBeUndefined();
      expect(result.metrics.metric1.series['metric1|series2'].valueB).toBe(200);
    });
    
    it('should handle invalid inputs gracefully', () => {
      // @ts-expect-error Testing with invalid input
      expect(() => computeDiffs(null, null)).toThrow();
      
      const validSnapshot = createSampleSnapshot('snapA', 1000, {
        'metric1': { 'series1': 100 }
      });
      
      // @ts-expect-error Testing with invalid input
      expect(() => computeDiffs(validSnapshot, null)).toThrow();
      // @ts-expect-error Testing with invalid input
      expect(() => computeDiffs(null, validSnapshot)).toThrow();
    });
    
    it('should throw if snapshot B is earlier than snapshot A', () => {
      const snapshotA = createSampleSnapshot('snapA', 2000, {
        'metric1': { 'series1': 100 }
      });
      
      const snapshotB = createSampleSnapshot('snapB', 1000, { // Earlier timestamp
        'metric1': { 'series1': 150 }
      });
      
      expect(() => computeDiffs(snapshotA, snapshotB)).toThrow();
    });
  });
  
  describe('formatRate', () => {
    it('should format rates correctly based on unit', () => {
      expect(formatRate(150, 'bytes')).toBe('150/s');
      expect(formatRate(150, '%')).toBe('150%/s');
      expect(formatRate(150, 'count')).toBe('150 count/s');
      expect(formatRate(150)).toBe('150/s');
      
      // Large numbers
      expect(formatRate(1500000)).toBe('1.5M/s');
      expect(formatRate(1500)).toBe('1.5K/s');
    });
    
    it('should handle undefined or null values', () => {
      // @ts-expect-error Testing with invalid input
      expect(formatRate(undefined)).toBe('N/A');
      // @ts-expect-error Testing with invalid input
      expect(formatRate(null)).toBe('N/A');
    });
  });
  
  describe('formatDelta', () => {
    it('should format deltas correctly based on unit', () => {
      expect(formatDelta(1024, 'bytes')).toBe('1.0 KB');
      expect(formatDelta(50, '%')).toBe('50%');
      expect(formatDelta(150, 'count')).toBe('150 count');
      expect(formatDelta(150)).toBe('150');
      
      // Large numbers
      expect(formatDelta(1500000)).toBe('1.5M');
      expect(formatDelta(1500)).toBe('1.5K');
    });
    
    it('should handle undefined or null values', () => {
      // @ts-expect-error Testing with invalid input
      expect(formatDelta(undefined)).toBe('N/A');
      // @ts-expect-error Testing with invalid input
      expect(formatDelta(null)).toBe('N/A');
    });
  });
});

/**
 * Helper function to create a sample snapshot for testing
 */
function createSampleSnapshot(
  id: string, 
  timestamp: number, 
  metricsData: Record<string, Record<string, number>>,
  type: 'gauge' | 'sum' | 'histogram' | 'summary' = 'gauge',
  monotonic = false
): ParsedSnapshot {
  const snapshot: ParsedSnapshot = {
    id,
    timestamp,
    resources: [{
      id: 'resource1',
      attributes: { 'service.name': 'test-service' },
      scopes: [{
        id: 'scope1',
        name: 'test-scope',
        metricIds: []
      }]
    }],
    metrics: {},
    metricCount: 0,
    totalSeries: 0,
    totalDataPoints: 0
  };
  
  // Create metrics based on the provided data
  Object.entries(metricsData).forEach(([metricName, seriesMap], metricIndex) => {
    const metricId = `metric-${metricIndex}`;
    snapshot.metrics[metricId] = {
      id: metricId,
      name: metricName,
      type,
      monotonic,
      description: `Test metric ${metricName}`,
      unit: metricName.includes('bytes') ? 'bytes' : undefined,
      dataPoints: [],
      attributeKeys: [],
      resourceIds: ['resource1'],
      scopeIds: ['scope1']
    };
    
    snapshot.resources[0].scopes[0].metricIds.push(metricId);
    
    // Create data points for the series
    Object.entries(seriesMap).forEach(([seriesName, value], dpIndex) => {
      const seriesKey = `${metricName}|${seriesName}`;
      const attributes = { [seriesName]: seriesName };
      
      snapshot.metrics[metricId].dataPoints.push({
        attributes,
        timeUnixNano: `${timestamp}000000`,
        value,
        seriesKey
      });
      
      // Add attribute keys
      if (!snapshot.metrics[metricId].attributeKeys.includes(seriesName)) {
        snapshot.metrics[metricId].attributeKeys.push(seriesName);
      }
    });
    
    snapshot.metricCount++;
    snapshot.totalSeries += Object.keys(seriesMap).length;
    snapshot.totalDataPoints += Object.keys(seriesMap).length;
  });
  
  return snapshot;
}