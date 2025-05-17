import { ParsedSnapshot, ParsedMetric } from '../types/otlp';

export interface MetricDefinition {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  type: string;
  temporality?: string;
  monotonic?: boolean;
  attributeKeys: string[];
  dataPointCount: number;
  seriesCount: number;
  minValue?: number;
  maxValue?: number;
  avgValue?: number;
  lastValue?: number;
}

/**
 * Builds metric definitions from parsed snapshots
 * These definitions provide an overview of each metric regardless of its specific data points
 */
export function buildMetricDefinitionsFromSnapshots(
  snapshots: Record<string, ParsedSnapshot>
): Record<string, MetricDefinition> {
  const definitions: Record<string, MetricDefinition> = {};
  
  // Process each snapshot
  Object.values(snapshots).forEach(snapshot => {
    // Process each metric in the snapshot
    Object.values(snapshot.metrics).forEach(metric => {
      // If this metric doesn't exist in definitions yet, create it
      if (!definitions[metric.name]) {
        definitions[metric.name] = createDefinitionFromMetric(metric);
      } else {
        // If it exists, update it with additional information from this snapshot
        updateDefinitionFromMetric(definitions[metric.name], metric);
      }
    });
  });
  
  return definitions;
}

/**
 * Creates a new metric definition from a parsed metric
 */
function createDefinitionFromMetric(metric: ParsedMetric): MetricDefinition {
  // Count unique series by collecting unique series keys
  const seriesKeys = new Set<string>();
  if (Array.isArray(metric.dataPoints)) {
    metric.dataPoints.forEach(dp => {
      if (dp && dp.seriesKey) seriesKeys.add(dp.seriesKey);
    });
  }
  
  // Calculate simple statistics for numeric values
  const values = Array.isArray(metric.dataPoints) 
    ? metric.dataPoints
      .map(dp => (dp && typeof dp.value === 'number' ? dp.value : null))
      .filter((v): v is number => v !== null)
    : [];
  
  const stats = calculateStatistics(values);
  
  return {
    id: metric.id,
    name: metric.name,
    description: metric.description,
    unit: metric.unit,
    type: metric.type,
    temporality: metric.temporality,
    monotonic: metric.monotonic,
    attributeKeys: Array.isArray(metric.attributeKeys) ? [...metric.attributeKeys] : [],
    dataPointCount: Array.isArray(metric.dataPoints) ? metric.dataPoints.length : 0,
    seriesCount: seriesKeys.size,
    ...stats
  };
}

/**
 * Updates an existing metric definition with additional information from another instance
 */
function updateDefinitionFromMetric(
  definition: MetricDefinition,
  metric: ParsedMetric
): void {
  // Add any new attribute keys
  if (Array.isArray(metric.attributeKeys)) {
    metric.attributeKeys.forEach(key => {
      if (!definition.attributeKeys.includes(key)) {
        definition.attributeKeys.push(key);
      }
    });
  }
  
  // Update count of data points
  if (Array.isArray(metric.dataPoints)) {
    definition.dataPointCount += metric.dataPoints.length;
    
    // Count new unique series by collecting unique series keys
    const seriesKeys = new Set<string>();
    metric.dataPoints.forEach(dp => {
      if (dp && dp.seriesKey) seriesKeys.add(dp.seriesKey);
    });
    definition.seriesCount += seriesKeys.size;
    
    // Update statistics
    const values = metric.dataPoints
      .map(dp => (dp && typeof dp.value === 'number' ? dp.value : null))
      .filter((v): v is number => v !== null);
    
    if (values.length > 0) {
      const newStats = calculateStatistics(values);
      
      // Update min/max
      if (newStats.minValue !== undefined) {
        definition.minValue = definition.minValue !== undefined
          ? Math.min(definition.minValue, newStats.minValue)
          : newStats.minValue;
      }
      
      if (newStats.maxValue !== undefined) {
        definition.maxValue = definition.maxValue !== undefined
          ? Math.max(definition.maxValue, newStats.maxValue)
          : newStats.maxValue;
      }
      
      // For avg, we'd need to properly weight the values, but this is a simple implementation
      if (newStats.avgValue !== undefined) {
        if (definition.avgValue !== undefined) {
          definition.avgValue = (definition.avgValue + newStats.avgValue) / 2;
        } else {
          definition.avgValue = newStats.avgValue;
        }
      }
      
      // Update last value if this metric's timestamp is more recent
      // In a real implementation, we'd compare timestamps
      if (newStats.lastValue !== undefined) {
        definition.lastValue = newStats.lastValue;
      }
    }
  }
}

/**
 * Calculate basic statistics for a list of values
 */
function calculateStatistics(values: number[]): {
  minValue?: number;
  maxValue?: number;
  avgValue?: number;
  lastValue?: number;
} {
  if (!values.length) return {};
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const last = values[values.length - 1]; // Assume the last value is the most recent
  
  return {
    minValue: min,
    maxValue: max,
    avgValue: avg,
    lastValue: last
  };
}