# Data Contracts

This document defines the core data structures and type definitions used throughout the OTLP Process Metrics Explorer.

## 1. OTLP Input Formats

### 1.1 Raw OTLP JSON

The system accepts standard OTLP JSON as defined in the OpenTelemetry specification.

```typescript
interface OtlpMetricsJson {
  resourceMetrics: ResourceMetrics[];
}

interface ResourceMetrics {
  resource: {
    attributes: KeyValue[];
  };
  scopeMetrics: ScopeMetrics[];
}

interface ScopeMetrics {
  scope: {
    name: string;
    version?: string;
    attributes?: KeyValue[];
  };
  metrics: Metric[];
}

interface Metric {
  name: string;
  description?: string;
  unit?: string;
  gauge?: GaugeMetric;
  sum?: SumMetric;
  histogram?: HistogramMetric;
  summary?: SummaryMetric;
  // Other metric types as defined in the OTLP spec
}

// Additional type definitions omitted for brevity
```

## 2. Internal Data Model

### 2.1 ParsedSnapshot

After processing, OTLP data is transformed into a more structured and queryable format:

```typescript
interface ParsedSnapshot {
  id: string;
  timestamp: number;
  resources: ParsedResource[];
  metrics: Record<string, ParsedMetric>;
  metricCount: number;
  totalSeries: number;
  totalDataPoints: number;
}

interface ParsedResource {
  id: string;
  attributes: Record<string, string | number | boolean>;
  scopes: ParsedScope[];
}

interface ParsedScope {
  id: string;
  name: string;
  version?: string;
  attributes?: Record<string, string | number | boolean>;
  metricIds: string[];
}

interface ParsedMetric {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  type: MetricType;
  temporality?: Temporality;
  monotonic?: boolean;
  dataPoints: DataPoint[];
  attributeKeys: string[];
  resourceIds: string[];
  scopeIds: string[];
}

interface DataPoint {
  id: string;
  attributes: Record<string, string | number | boolean>;
  resourceId: string;
  scopeId: string;
  startTimeUnixNano?: string;
  timeUnixNano: string;
  value: number | HistogramValues | SummaryValues;
}

// Additional type definitions omitted for brevity
```

### 2.2 DiffResult

When comparing two snapshots, a diff structure is generated:

```typescript
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

// Additional type definitions omitted for brevity
```

### 2.3 CardinalityAnalysis

Results of cardinality analysis for metrics:

```typescript
interface CardinalityAnalysis {
  snapshotId: string;
  metrics: Record<string, MetricCardinality>;
  totalCardinality: number;
  totalEstimatedCost: number;
  potentialSavings: PotentialSavings[];
}

interface MetricCardinality {
  metricId: string;
  name: string;
  totalSeries: number;
  attributeCardinalityFactors: AttributeCardinalityFactor[];
  estimatedStorageCost: number;
  attributeCombinations: AttributeCombination[];
}

interface AttributeCardinalityFactor {
  attributeKey: string;
  uniqueValues: number;
  examples: string[];
  cardinalityImpact: number;
  reductionRecommendation?: ReductionRecommendation;
}

// Additional type definitions omitted for brevity
```

## 3. Configuration Exports

### 3.1 OTel Collector Configuration

The system can generate configuration snippets for the OTel Collector:

```typescript
interface CollectorConfig {
  receivers?: Record<string, any>;
  processors?: {
    filter?: FilterConfig;
    metricstransform?: MetricsTransformConfig;
    resourcedetection?: ResourceDetectionConfig;
    // Other processor configs
  };
  exporters?: Record<string, any>;
  service?: {
    pipelines: Record<string, {
      receivers: string[];
      processors: string[];
      exporters: string[];
    }>;
  };
}

// Additional type definitions omitted for brevity
```

## 4. UI Models

Data structures specifically designed for UI components:

```typescript
interface MetricCard {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  type: MetricType;
  temporality?: Temporality;
  monotonic?: boolean;
  summaryStats: SummaryStats;
  cardinalityInfo?: CardinalityInfo;
  isExpanded: boolean;
}

interface SummaryStats {
  dataPointCount: number;
  min?: number;
  max?: number;
  avg?: number;
  sum?: number;
  // Additional stats based on metric type
}

// Additional type definitions omitted for brevity
```

These data contracts are used throughout the system to ensure consistent data structures and type safety. All components that manipulate data should adhere to these definitions.
