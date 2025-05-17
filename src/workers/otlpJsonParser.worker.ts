/**
 * OTLP JSON Parser Worker
 * 
 * This Web Worker handles the parsing of OTLP JSON data off the main thread
 * to avoid blocking the UI during processing of large datasets.
 */

import { OtlpMetricsJson, ParsedSnapshot, MetricType, Temporality } from '../types/otlp';

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
  // Implementation would process the resources, scopes, and metrics here
  // This is just a placeholder - a real implementation would be more complex
  
  // For each resource
  otlpJson.resourceMetrics.forEach((resourceMetric, resourceIndex) => {
    const resourceId = `resource-${resourceIndex}`;
    
    // Create parsed resource
    const parsedResource = {
      id: resourceId,
      attributes: {}, // Would extract attributes from resourceMetric.resource.attributes
      scopes: []
    };
    
    // For each scope in the resource
    resourceMetric.scopeMetrics.forEach((scopeMetric, scopeIndex) => {
      const scopeId = `${resourceId}-scope-${scopeIndex}`;
      
      // Create parsed scope
      const parsedScope = {
        id: scopeId,
        name: scopeMetric.scope.name,
        version: scopeMetric.scope.version,
        attributes: {}, // Would extract attributes from scopeMetric.scope.attributes
        metricIds: []
      };
      
      // For each metric in the scope
      scopeMetric.metrics.forEach((metric, metricIndex) => {
        const metricId = `${scopeId}-metric-${metricIndex}`;
        
        // Determine metric type, temporality, etc.
        const metricType = determineMetricType(metric);
        const temporality = determineTemporality(metric, metricType);
        const monotonic = determineMonotonic(metric, metricType);
        
        // Create parsed metric
        parsedSnapshot.metrics[metricId] = {
          id: metricId,
          name: metric.name,
          description: metric.description,
          unit: metric.unit,
          type: metricType,
          temporality,
          monotonic,
          dataPoints: [], // Would extract data points from the metric
          attributeKeys: [], // Would extract unique attribute keys
          resourceIds: [resourceId],
          scopeIds: [scopeId]
        };
        
        // Update counts
        parsedSnapshot.metricCount++;
        parsedScope.metricIds.push(metricId);
      });
      
      parsedResource.scopes.push(parsedScope);
    });
    
    parsedSnapshot.resources.push(parsedResource);
  });
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
