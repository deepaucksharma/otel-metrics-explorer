/**
 * OTLP JSON Parser Worker
 * 
 * This Web Worker handles the parsing of OTLP JSON data off the main thread
 * to avoid blocking the UI during processing of large datasets.
 */

import { OtlpMetricsJson, ParsedSnapshot, MetricType, Temporality } from '../contracts/otlp';

// Define the message types for Worker communication
interface WorkerMessage {
  id: string;
  action: 'parse';
  payload: {
    jsonString: string;
    options?: ParserOptions;
  };
}

interface ParserOptions {
  snapshotId?: string;
  timestamp?: number;
  includeZeroValues?: boolean;
  normalizeAttributes?: boolean;
  computeStatistics?: boolean;
  validateInput?: boolean;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  data?: ParsedSnapshot;
  error?: string;
}

// Set up event listener for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { id, action, payload } = event.data;
  
  if (action === 'parse') {
    try {
      const { jsonString, options } = payload;
      const parsedData = parseOtlpJson(jsonString, options);
      
      // Send successful response back to main thread
      self.postMessage({
        id,
        success: true,
        data: parsedData
      } as WorkerResponse);
    } catch (error) {
      // Send error response back to main thread
      self.postMessage({
        id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error parsing OTLP JSON'
      } as WorkerResponse);
    }
  }
});

/**
 * Parses an OTLP JSON string into the internal data model
 */
function parseOtlpJson(jsonString: string, options: ParserOptions = {}): ParsedSnapshot {
  // Default options
  const {
    snapshotId = `snapshot-${Date.now()}`,
    timestamp = Date.now(),
    includeZeroValues = true,
    normalizeAttributes = true,
    computeStatistics = true,
    validateInput = true
  } = options;
  
  // Parse JSON
  let otlpJson: OtlpMetricsJson;
  try {
    otlpJson = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Basic validation
  if (validateInput) {
    validateOtlpJson(otlpJson);
  }
  
  // Initialize the parsed snapshot
  const parsedSnapshot: ParsedSnapshot = {
    id: snapshotId,
    timestamp,
    resources: [],
    metrics: {},
    metricCount: 0,
    totalSeries: 0,
    totalDataPoints: 0
  };
  
  // Process resources
  processResources(otlpJson, parsedSnapshot, {
    includeZeroValues,
    normalizeAttributes
  });
  
  // Compute statistics if needed
  if (computeStatistics) {
    computeMetricStatistics(parsedSnapshot);
  }
  
  return parsedSnapshot;
}

/**
 * Validates that the input follows the OTLP JSON structure
 */
function validateOtlpJson(otlpJson: any): void {
  if (!otlpJson) {
    throw new Error('Empty OTLP data');
  }
  
  if (!otlpJson.resourceMetrics || !Array.isArray(otlpJson.resourceMetrics)) {
    throw new Error('Invalid OTLP format: missing or invalid resourceMetrics array');
  }
}

/**
 * Processes resource metrics from OTLP JSON
 */
function processResources(
  otlpJson: OtlpMetricsJson, 
  parsedSnapshot: ParsedSnapshot,
  options: {
    includeZeroValues: boolean;
    normalizeAttributes: boolean;
  }
): void {
  // For each resource
  otlpJson.resourceMetrics.forEach((resourceMetric, resourceIndex) => {
    const resourceId = `resource-${resourceIndex}`;
    
    // Extract resource attributes
    const resourceAttributes = extractAttributes(resourceMetric.resource.attributes, options.normalizeAttributes);
    
    // Create parsed resource
    const parsedResource = {
      id: resourceId,
      attributes: resourceAttributes,
      scopes: []
    };
    
    // For each scope in the resource
    resourceMetric.scopeMetrics.forEach((scopeMetric, scopeIndex) => {
      const scopeId = `${resourceId}-scope-${scopeIndex}`;
      
      // Extract scope attributes if present
      const scopeAttributes = scopeMetric.scope.attributes 
        ? extractAttributes(scopeMetric.scope.attributes, options.normalizeAttributes)
        : {};
      
      // Create parsed scope
      const parsedScope = {
        id: scopeId,
        name: scopeMetric.scope.name,
        version: scopeMetric.scope.version,
        attributes: scopeAttributes,
        metricIds: []
      };
      
      // For each metric in the scope
      scopeMetric.metrics.forEach((metric, metricIndex) => {
        const metricId = `${scopeId}-metric-${metricIndex}`;
        
        // Determine metric type, temporality, etc.
        const metricType = determineMetricType(metric);
        const temporality = determineTemporality(metric, metricType);
        const monotonic = determineMonotonic(metric, metricType);
        
        // Extract datapoints based on metric type
        const dataPoints = extractDataPoints(metric, metricType, options.includeZeroValues);
        
        // Collect all unique attribute keys from datapoints
        const attributeKeysSet = new Set<string>();
        dataPoints.forEach(dp => {
          if (dp.attributes) {
            Object.keys(dp.attributes).forEach(key => attributeKeysSet.add(key));
          }
        });
        const attributeKeys = Array.from(attributeKeysSet);
        
        // Create parsed metric
        parsedSnapshot.metrics[metricId] = {
          id: metricId,
          name: metric.name,
          description: metric.description,
          unit: metric.unit,
          type: metricType,
          temporality,
          monotonic,
          dataPoints,
          attributeKeys,
          resourceIds: [resourceId],
          scopeIds: [scopeId]
        };
        
        // Update counts
        parsedSnapshot.metricCount++;
        parsedSnapshot.totalDataPoints += dataPoints.length;
        
        // Estimate series count - unique combinations of attribute values
        // For simplicity, we'll use datapoint count as a proxy for now
        parsedSnapshot.totalSeries += dataPoints.length;
        
        parsedScope.metricIds.push(metricId);
      });
      
      parsedResource.scopes.push(parsedScope);
    });
    
    parsedSnapshot.resources.push(parsedResource);
  });
}

/**
 * Extract attributes from KeyValue array into a flat object
 */
function extractAttributes(attributes: KeyValue[], normalize: boolean): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  
  if (!attributes || !Array.isArray(attributes)) {
    return result;
  }
  
  attributes.forEach(attr => {
    const key = normalize ? normalizeAttributeKey(attr.key) : attr.key;
    const value = extractAttributeValue(attr.value, normalize);
    
    if (value !== undefined) {
      result[key] = value;
    }
  });
  
  return result;
}

/**
 * Extract value from a KeyValue's value field
 */
function extractAttributeValue(value: any, normalize: boolean): string | number | boolean | undefined {
  if (!value) return undefined;
  
  if (value.stringValue !== undefined) {
    return normalize ? normalizeStringValue(value.stringValue) : value.stringValue;
  }
  
  if (value.intValue !== undefined) {
    return typeof value.intValue === 'string' ? parseInt(value.intValue, 10) : value.intValue;
  }
  
  if (value.doubleValue !== undefined) {
    return value.doubleValue;
  }
  
  if (value.boolValue !== undefined) {
    return value.boolValue;
  }
  
  // For complex types, we stringify them
  if (value.arrayValue || value.kvlistValue) {
    return JSON.stringify(value);
  }
  
  return undefined;
}

/**
 * Normalize attribute keys
 */
function normalizeAttributeKey(key: string): string {
  return key.trim().toLowerCase();
}

/**
 * Normalize string values
 */
function normalizeStringValue(value: string): string {
  return value.trim();
}

/**
 * Extract data points based on metric type
 */
function extractDataPoints(metric: any, type: MetricType, includeZeroValues: boolean): any[] {
  const dataPoints = [];
  
  if (type === 'gauge' && metric.gauge?.dataPoints) {
    for (const dp of metric.gauge.dataPoints) {
      const value = dp.asDouble !== undefined ? dp.asDouble : 
                    dp.asInt !== undefined ? parseInt(dp.asInt, 10) : 0;
      
      if (!includeZeroValues && value === 0) continue;
      
      dataPoints.push({
        attributes: extractAttributes(dp.attributes, true),
        timeUnixNano: dp.timeUnixNano,
        startTimeUnixNano: dp.startTimeUnixNano,
        value
      });
    }
  } else if (type === 'sum' && metric.sum?.dataPoints) {
    for (const dp of metric.sum.dataPoints) {
      const value = dp.asDouble !== undefined ? dp.asDouble : 
                    dp.asInt !== undefined ? parseInt(dp.asInt, 10) : 0;
      
      if (!includeZeroValues && value === 0) continue;
      
      dataPoints.push({
        attributes: extractAttributes(dp.attributes, true),
        timeUnixNano: dp.timeUnixNano,
        startTimeUnixNano: dp.startTimeUnixNano,
        value
      });
    }
  } else if (type === 'histogram' && metric.histogram?.dataPoints) {
    for (const dp of metric.histogram.dataPoints) {
      const count = typeof dp.count === 'string' ? parseInt(dp.count, 10) : dp.count;
      
      if (!includeZeroValues && count === 0) continue;
      
      dataPoints.push({
        attributes: extractAttributes(dp.attributes, true),
        timeUnixNano: dp.timeUnixNano,
        startTimeUnixNano: dp.startTimeUnixNano,
        count,
        sum: dp.sum,
        bucketCounts: dp.bucketCounts?.map(c => typeof c === 'string' ? parseInt(c, 10) : c),
        explicitBounds: dp.explicitBounds
      });
    }
  } else if (type === 'summary' && metric.summary?.dataPoints) {
    for (const dp of metric.summary.dataPoints) {
      const count = typeof dp.count === 'string' ? parseInt(dp.count, 10) : dp.count;
      
      if (!includeZeroValues && count === 0) continue;
      
      dataPoints.push({
        attributes: extractAttributes(dp.attributes, true),
        timeUnixNano: dp.timeUnixNano,
        startTimeUnixNano: dp.startTimeUnixNano,
        count,
        sum: dp.sum,
        quantileValues: dp.quantileValues
      });
    }
  }
  
  return dataPoints;
}

/**
 * Determines the metric type from an OTLP metric
 */
function determineMetricType(metric: any): MetricType {
  if (metric.gauge) return 'gauge';
  if (metric.sum) return 'sum';
  if (metric.histogram) return 'histogram';
  if (metric.summary) return 'summary';
  return 'gauge'; // Default
}

/**
 * Determines the temporality from an OTLP metric
 */
function determineTemporality(metric: any, type: MetricType): Temporality | undefined {
  if (type === 'gauge') return undefined;
  
  if (type === 'sum' && metric.sum?.aggregationTemporality) {
    if (metric.sum.aggregationTemporality === 'AGGREGATION_TEMPORALITY_DELTA') {
      return 'delta';
    } else if (metric.sum.aggregationTemporality === 'AGGREGATION_TEMPORALITY_CUMULATIVE') {
      return 'cumulative';
    }
  }
  
  if (type === 'histogram' && metric.histogram?.aggregationTemporality) {
    if (metric.histogram.aggregationTemporality === 'AGGREGATION_TEMPORALITY_DELTA') {
      return 'delta';
    } else if (metric.histogram.aggregationTemporality === 'AGGREGATION_TEMPORALITY_CUMULATIVE') {
      return 'cumulative';
    }
  }
  
  return 'unspecified';
}

/**
 * Determines if a metric is monotonic
 */
function determineMonotonic(metric: any, type: MetricType): boolean | undefined {
  if (type === 'sum' && metric.sum?.isMonotonic !== undefined) {
    return metric.sum.isMonotonic;
  }
  return undefined;
}

/**
 * Computes statistics for each metric
 */
function computeMetricStatistics(parsedSnapshot: ParsedSnapshot): void {
  // Would compute various statistics for each metric
  // This is just a placeholder - a real implementation would be more complex
  
  // Update total counts
  let totalDataPoints = 0;
  let totalSeries = 0;
  
  Object.values(parsedSnapshot.metrics).forEach(metric => {
    const dataPointCount = metric.dataPoints.length;
    totalDataPoints += dataPointCount;
    
    // Calculate series count (unique combinations of attribute values)
    // This is a simplified calculation
    totalSeries += dataPointCount;
  });
  
  parsedSnapshot.totalDataPoints = totalDataPoints;
  parsedSnapshot.totalSeries = totalSeries;
}

export default {} as typeof Worker & { new(): Worker };
