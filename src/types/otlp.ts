/**
 * Types for OTLP Metrics Data Models
 */

// Raw OTLP JSON Structure
export interface OtlpMetricsJson {
  resourceMetrics: ResourceMetrics[];
}

export interface ResourceMetrics {
  resource: {
    attributes: KeyValue[];
  };
  scopeMetrics: ScopeMetrics[];
}

export interface ScopeMetrics {
  scope: {
    name: string;
    version?: string;
    attributes?: KeyValue[];
  };
  metrics: Metric[];
}

export interface Metric {
  name: string;
  description?: string;
  unit?: string;
  gauge?: GaugeMetric;
  sum?: SumMetric;
  histogram?: HistogramMetric;
  summary?: SummaryMetric;
}

export interface KeyValue {
  key: string;
  value: {
    stringValue?: string;
    intValue?: string;
    doubleValue?: number;
    boolValue?: boolean;
    arrayValue?: {
      values: {
        stringValue?: string;
        intValue?: string;
        doubleValue?: number;
        boolValue?: boolean;
      }[];
    };
    kvlistValue?: {
      values: KeyValue[];
    };
  };
}

export interface GaugeMetric {
  dataPoints: DataPoint[];
}

export interface SumMetric {
  dataPoints: DataPoint[];
  aggregationTemporality: 'AGGREGATION_TEMPORALITY_UNSPECIFIED' | 'AGGREGATION_TEMPORALITY_DELTA' | 'AGGREGATION_TEMPORALITY_CUMULATIVE';
  isMonotonic?: boolean;
}

export interface HistogramMetric {
  dataPoints: HistogramDataPoint[];
  aggregationTemporality: 'AGGREGATION_TEMPORALITY_UNSPECIFIED' | 'AGGREGATION_TEMPORALITY_DELTA' | 'AGGREGATION_TEMPORALITY_CUMULATIVE';
}

export interface SummaryMetric {
  dataPoints: SummaryDataPoint[];
}

export interface DataPoint {
  attributes: KeyValue[];
  timeUnixNano: string;
  startTimeUnixNano?: string;
  asDouble?: number;
  asInt?: string;
  seriesKey?: string;
}

export interface HistogramDataPoint {
  attributes: KeyValue[];
  timeUnixNano: string;
  startTimeUnixNano?: string;
  count: string;
  sum?: number;
  bucketCounts?: string[];
  explicitBounds?: number[];
  exemplars?: Exemplar[];
  seriesKey?: string;
}

export interface SummaryDataPoint {
  attributes: KeyValue[];
  timeUnixNano: string;
  startTimeUnixNano?: string;
  count: string;
  sum: number;
  quantileValues: QuantileValue[];
  seriesKey?: string;
}

export interface QuantileValue {
  quantile: number;
  value: number;
}

export interface Exemplar {
  timeUnixNano: string;
  value: number;
  spanId?: string;
  traceId?: string;
}

// Internal Parsed Data Model
export interface ParsedSnapshot {
  id: string;
  timestamp: number;
  resources: ParsedResource[];
  metrics: Record<string, ParsedMetric>;
  metricCount: number;
  totalSeries: number;
  totalDataPoints: number;
}

export interface ParsedResource {
  id: string;
  attributes: Record<string, string | number | boolean>;
  scopes: ParsedScope[];
}

export interface ParsedScope {
  id: string;
  name: string;
  version?: string;
  attributes?: Record<string, string | number | boolean>;
  metricIds: string[];
}

export type MetricType = 'gauge' | 'sum' | 'histogram' | 'summary';
export type Temporality = 'delta' | 'cumulative' | 'unspecified';

export interface ParsedMetric {
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

// UI Components Data Models
export interface MetricCard {
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

export interface SummaryStats {
  dataPointCount: number;
  min?: number;
  max?: number;
  avg?: number;
  sum?: number;
  // Additional stats based on metric type
}

export interface CardinalityInfo {
  totalSeries: number;
  highCardinalityAttributes: string[];
  estimatedStorageCost?: number;
}

// Event Types
export interface SnapshotLoadingEvent {
  fileName: string;
  fileSize: number;
  timestamp: number;
}

export interface SnapshotLoadedEvent {
  snapshotId: string;
  fileName: string;
  timestamp: number;
}

export interface SnapshotErrorEvent {
  fileName: string;
  error: string;
  timestamp: number;
}

export interface MetricSelectedEvent {
  snapshotId: string;
  metricId: string;
  timestamp: number;
}
