# Diff Engine

## Overview

The Diff Engine is a component in the Logic Layer that calculates differences and rates of change between two snapshots of OTLP metrics data. This enables users to understand how their metrics evolve over time, detect anomalies, and calculate key performance indicators such as rates, deltas, and trends.

## Responsibilities

1. Compare two snapshots of metrics data to identify changes
2. Calculate absolute deltas for all metric values
3. Compute rates of change based on the time difference between snapshots
4. Detect new metrics, removed metrics, and changed metrics
5. Identify changes in cardinality (new or removed series)
6. Calculate statistical summaries of changes (min, max, avg delta)
7. Provide specialized comparisons for different metric types (gauge, sum, histogram, etc.)

## Public Interface

```typescript
interface DiffEngine {
  // Compare two snapshots and generate a full diff result
  compareSnapshots(snapshotA: ParsedSnapshot, snapshotB: ParsedSnapshot, options?: DiffOptions): DiffResult;
  
  // Compare two parsed metrics directly
  compareMetrics(metricA: ParsedMetric, metricB: ParsedMetric, timestampDeltaMs: number): MetricDiff;
  
  // Calculate rate of change for a metric based on its type and values
  calculateRate(metricType: MetricType, oldValue: any, newValue: any, timeMs: number): number | HistogramRate | SummaryRate;
  
  // Get statistics about the changes across all metrics
  getDiffSummary(diffResult: DiffResult): DiffSummary;
}

interface DiffOptions {
  includeUnchanged?: boolean; // Whether to include metrics that haven't changed in the result
  filterByMetricName?: string[]; // Only include specific metrics in the diff
  filterByMetricType?: MetricType[]; // Only include specific metric types in the diff
  calculateRates?: boolean; // Whether to calculate rates of change
  matchByAttributes?: boolean; // Whether to match data points by attributes or by order
  attributesToIgnore?: string[]; // Attributes to ignore when matching data points
}

interface DiffResult {
  snapshotAId: string;
  snapshotBId: string;
  timeDeltaMs: number;
  metricDiffs: Record<string, MetricDiff>;
  newMetrics: string[];
  removedMetrics: string[];
  changedMetrics: string[];
}

interface MetricDiff {
  metricId: string;
  dataPointDiffs: DataPointDiff[];
  newDataPoints: string[];
  removedDataPoints: string[];
}

interface DataPointDiff {
  dataPointId: string;
  oldValue: number | HistogramValues | SummaryValues;
  newValue: number | HistogramValues | SummaryValues;
  delta: number | HistogramDelta | SummaryDelta;
  rate?: number | HistogramRate | SummaryRate;
}

interface DiffSummary {
  totalMetrics: number;
  changedMetrics: number;
  newMetrics: number;
  removedMetrics: number;
  totalDataPoints: number;
  changedDataPoints: number;
  newDataPoints: number;
  removedDataPoints: number;
  maxIncrease: number;
  maxDecrease: number;
  avgDelta: number;
}
```

## Implementation Details

### Snapshot Comparison Process

1. The engine takes two snapshots (A and B) and calculates the time difference between them
2. It identifies which metrics exist in both snapshots and which are unique to each
3. For metrics found in both snapshots, it proceeds to compare their data points
4. Data points are matched by their attribute combinations (series keys)
5. For each matched data point, the difference between values is calculated
6. If requested, rates of change are computed based on the time difference
7. Statistical summaries are generated for the differences

### Rate Calculation Strategies

The engine uses different strategies to calculate rates based on the metric type:

- **Gauge**: Simple change over time ((valueB - valueA) / timeDelta)
- **Sum**:
  - Cumulative: (valueB - valueA) / timeDelta
  - Delta: Sum of delta values over time period
- **Histogram**: Bucket-by-bucket rate calculation
- **Summary**: Quantile-by-quantile rate calculation

### Handling Special Cases

- **Resets**: Detection of counter resets (new value < old value for monotonic metrics)
- **Type changes**: Handling metrics that change type between snapshots
- **Missing data points**: Strategies for data points that appear or disappear
- **Attribute changes**: Detecting and reporting changes in attribute keys or values

## Performance Considerations

- The diff calculation should be performed in a Web Worker to avoid blocking the main thread
- For large snapshots, incremental processing can be used
- Caching of intermediate results for frequent comparisons
- Efficient data structures for quick lookup of metrics and data points

## Error Handling

- Invalid snapshot formats: Validation of input data before comparison
- Type mismatches: Handling metrics with different types in snapshots
- Time sequence errors: Warning if snapshots are in unexpected order
- Incomplete data: Graceful handling of partial or missing data

## Dependencies

- ParsedSnapshot model: For working with the internal data representation
- SeriesKeyGenerator: For consistently identifying data points across snapshots
- EventBus: For emitting progress and completion events
- StatisticsCalculator: For computing statistical summaries

## Usage Example

```typescript
const diffEngine = new DiffEngine();

// Compare two snapshots
function compareSnapshots(snapshotIdA: string, snapshotIdB: string) {
  const snapshotA = store.getState().snapshots[snapshotIdA];
  const snapshotB = store.getState().snapshots[snapshotIdB];
  
  if (!snapshotA || !snapshotB) {
    console.error('Snapshots not found');
    return;
  }
  
  const diffResult = diffEngine.compareSnapshots(snapshotA, snapshotB, {
    calculateRates: true,
    matchByAttributes: true
  });
  
  console.log(`Compared snapshots over ${diffResult.timeDeltaMs}ms`);
  console.log(`Changed metrics: ${diffResult.changedMetrics.length}`);
  console.log(`New metrics: ${diffResult.newMetrics.length}`);
  console.log(`Removed metrics: ${diffResult.removedMetrics.length}`);
  
  // Get the diff for a specific metric
  const metricDiff = diffResult.metricDiffs['some-metric-id'];
  if (metricDiff) {
    metricDiff.dataPointDiffs.forEach(diff => {
      console.log(`Data point ${diff.dataPointId}: delta = ${diff.delta}, rate = ${diff.rate} per second`);
    });
  }
  
  // Get overall summary
  const summary = diffEngine.getDiffSummary(diffResult);
  console.log(`Average delta: ${summary.avgDelta}`);
  console.log(`Max increase: ${summary.maxIncrease}`);
  console.log(`Max decrease: ${summary.maxDecrease}`);
  
  return diffResult;
}
```

This component is crucial for enabling time-series analysis, trend detection, and alerting capabilities in the OTLP Process Metrics Explorer.
