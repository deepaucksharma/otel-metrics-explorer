/**
 * Cardinality Analysis Engine
 * 
 * Core utility for analyzing the cardinality of metrics in a snapshot.
 * This implements a synchronous version that can be used directly or
 * adapted for a Web Worker.
 */

import { ParsedSnapshot, ParsedMetric, CardinalityInfo } from '../types/otlp';

// Types for the Cardinality Engine
export interface CardinalityAnalysis {
  snapshotId: string;
  timestamp: number;
  totalCardinality: number;
  totalDataPoints: number;
  totalMetrics: number;
  metrics: Record<string, MetricCardinalityInfo>;
  attributeImpact: Record<string, AttributeImpactInfo>;
  overallRecommendations: Recommendation[];
}

export interface MetricCardinalityInfo {
  metricId: string;
  metricName: string;
  totalSeries: number;
  totalDataPoints: number;
  attributeKeys: string[];
  attributeCardinalityFactors: AttributeCardinalityFactor[];
  cardinalityPerResource: Record<string, number>;
  recommendations: Recommendation[];
  estimatedCost?: number;
}

export interface AttributeCardinalityFactor {
  attributeKey: string;
  uniqueValues: number;
  cardinalityImpact: number; // 0 to 1
  valueExamples: string[];
  valueLengths: {
    min: number;
    max: number;
    avg: number;
  };
  patterns?: {
    numeric: boolean;
    hasSpecialChars: boolean;
    commonPrefix?: string;
    commonSuffix?: string;
  };
}

export interface AttributeImpactInfo {
  attributeKey: string;
  overallUniqueValues: number;
  affectedMetrics: string[];
  weightedImpact: number; // 0 to 1
}

export interface Recommendation {
  type: 'drop' | 'aggregate' | 'transform' | 'relabel';
  attributeKey?: string;
  targetMetrics?: string[];
  description: string;
  impact: {
    cardinalityReduction: number;
    percentReduction: number;
    estimatedSavings?: number;
  };
  priority: 'high' | 'medium' | 'low';
  newAttributeKey?: string;
  aggregationFunction?: string;
  transformRegex?: string;
}

export interface CostModel {
  costPerSeries: number;
  costPerDataPoint: number;
  retentionPeriodDays: number;
  scrapeIntervalSeconds: number;
  currency: string;
}

export interface AnalysisOptions {
  includeMetrics?: string[];
  excludeMetrics?: string[];
  attributeThreshold?: number;
  depthLimit?: number;
  costModel?: CostModel;
  calculateCombinations?: boolean;
}

export interface RecommendationImpact {
  originalCardinality: number;
  projectedCardinality: number;
  cardinalityReduction: number;
  percentReduction: number;
  estimatedSavings: number;
  metricsAffected: string[];
}

/**
 * Main function to analyze the cardinality of a snapshot
 */
export function analyzeCardinality(
  snapshot: ParsedSnapshot,
  options: AnalysisOptions = {}
): CardinalityAnalysis {
  // Default options
  const {
    includeMetrics,
    excludeMetrics,
    attributeThreshold = 100,
    depthLimit = 3,
    costModel = {
      costPerSeries: 0.001,
      costPerDataPoint: 0.0000001,
      retentionPeriodDays: 30,
      scrapeIntervalSeconds: 60,
      currency: 'USD'
    },
    calculateCombinations = true
  } = options;

  // Initialize result
  const analysis: CardinalityAnalysis = {
    snapshotId: snapshot.id,
    timestamp: snapshot.timestamp,
    totalCardinality: 0,
    totalDataPoints: 0,
    totalMetrics: 0,
    metrics: {},
    attributeImpact: {},
    overallRecommendations: []
  };

  // Filter metrics if needed
  const metricsToAnalyze = Object.entries(snapshot.metrics)
    .filter(([id, metric]) => {
      if (includeMetrics && !includeMetrics.includes(metric.name)) {
        return false;
      }
      if (excludeMetrics && excludeMetrics.includes(metric.name)) {
        return false;
      }
      return true;
    })
    .map(([id, metric]) => metric);

  analysis.totalMetrics = metricsToAnalyze.length;

  // Track global attribute impact
  const globalAttributeStats: Record<string, {
    uniqueValues: Set<string>,
    affectedMetrics: Set<string>,
    totalCardinalityImpact: number
  }> = {};

  // Analyze each metric
  metricsToAnalyze.forEach(metric => {
    const metricInfo = analyzeMetricCardinality(metric, snapshot, depthLimit, attributeThreshold);
    analysis.metrics[metric.id] = metricInfo;
    
    analysis.totalCardinality += metricInfo.totalSeries;
    analysis.totalDataPoints += metricInfo.totalDataPoints;

    // Update global attribute stats
    metricInfo.attributeCardinalityFactors.forEach(factor => {
      if (!globalAttributeStats[factor.attributeKey]) {
        globalAttributeStats[factor.attributeKey] = {
          uniqueValues: new Set<string>(),
          affectedMetrics: new Set<string>(),
          totalCardinalityImpact: 0
        };
      }

      globalAttributeStats[factor.attributeKey].affectedMetrics.add(metric.name);
      globalAttributeStats[factor.attributeKey].totalCardinalityImpact += factor.cardinalityImpact;
      
      // Add unique values from this metric to the global set
      factor.valueExamples.forEach(val => 
        globalAttributeStats[factor.attributeKey].uniqueValues.add(val));
    });
  });

  // Calculate attribute impact across all metrics
  Object.entries(globalAttributeStats).forEach(([key, stats]) => {
    analysis.attributeImpact[key] = {
      attributeKey: key,
      overallUniqueValues: stats.uniqueValues.size,
      affectedMetrics: Array.from(stats.affectedMetrics),
      weightedImpact: stats.totalCardinalityImpact / metricsToAnalyze.length
    };
  });

  // Generate overall recommendations
  analysis.overallRecommendations = generateOverallRecommendations(
    analysis, 
    snapshot,
    costModel
  );

  return analysis;
}

/**
 * Analyze cardinality for a single metric
 */
function analyzeMetricCardinality(
  metric: ParsedMetric,
  snapshot: ParsedSnapshot,
  depthLimit: number,
  attributeThreshold: number
): MetricCardinalityInfo {
  const seriesKeys = new Set<string>();
  const seriesByResource: Record<string, Set<string>> = {};
  const attributeValueMap: Record<string, Set<string>> = {};
  const attributeValues: Record<string, string[]> = {};

  // Initialize structures
  metric.attributeKeys.forEach(key => {
    attributeValueMap[key] = new Set<string>();
    attributeValues[key] = [];
  });

  metric.resourceIds.forEach(resourceId => {
    seriesByResource[resourceId] = new Set<string>();
  });

  // Collect all unique series keys and attribute values
  metric.dataPoints.forEach(dp => {
    if (dp.seriesKey) {
      seriesKeys.add(dp.seriesKey);
      
      // Add to resource-specific set
      if (dp.attributes && typeof dp.attributes === 'object') {
        const resourceId = findResourceIdForDataPoint(dp, metric, snapshot);
        if (resourceId && seriesByResource[resourceId]) {
          seriesByResource[resourceId].add(dp.seriesKey);
        }
      }
    }

    // Collect attribute values
    if (dp.attributes && typeof dp.attributes === 'object') {
      Object.entries(dp.attributes).forEach(([key, value]) => {
        if (attributeValueMap[key]) {
          const valueStr = String(value);
          attributeValueMap[key].add(valueStr);
          
          // Store a limited set of examples
          if (attributeValues[key].length < 5 && !attributeValues[key].includes(valueStr)) {
            attributeValues[key].push(valueStr);
          }
        }
      });
    }
  });

  // Calculate cardinality impact factors for each attribute
  const attributeCardinalityFactors: AttributeCardinalityFactor[] = metric.attributeKeys.map(key => {
    const uniqueValues = attributeValueMap[key]?.size || 0;
    
    // Calculate cardinality impact - simplistic calculation for now
    // In a more sophisticated implementation, this would consider combinations
    const cardinalityImpact = uniqueValues > 1 
      ? uniqueValues / (seriesKeys.size || 1) 
      : 0;
    
    // Calculate value length statistics
    const valueLengths = calculateValueLengthStats(attributeValues[key] || []);
    
    // Analyze patterns in values
    const patterns = analyzeValuePatterns(attributeValues[key] || []);
    
    return {
      attributeKey: key,
      uniqueValues,
      cardinalityImpact,
      valueExamples: attributeValues[key] || [],
      valueLengths,
      patterns
    };
  }).sort((a, b) => b.cardinalityImpact - a.cardinalityImpact);

  // Generate recommendations for this metric
  const recommendations = generateMetricRecommendations(
    metric, 
    attributeCardinalityFactors,
    attributeThreshold
  );

  // Calculate cardinality per resource
  const cardinalityPerResource: Record<string, number> = {};
  Object.entries(seriesByResource).forEach(([resourceId, series]) => {
    cardinalityPerResource[resourceId] = series.size;
  });

  return {
    metricId: metric.id,
    metricName: metric.name,
    totalSeries: seriesKeys.size,
    totalDataPoints: metric.dataPoints.length,
    attributeKeys: metric.attributeKeys,
    attributeCardinalityFactors,
    cardinalityPerResource,
    recommendations
  };
}

/**
 * Find the resource ID associated with a data point
 */
function findResourceIdForDataPoint(
  dataPoint: any, 
  metric: ParsedMetric, 
  snapshot: ParsedSnapshot
): string | null {
  // In a sophisticated implementation, this would match datapoint
  // attributes against resource attributes. For simplicity, we'll
  // just return the first resource ID.
  return metric.resourceIds[0] || null;
}

/**
 * Calculate value length statistics
 */
function calculateValueLengthStats(values: string[]): { min: number; max: number; avg: number } {
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const lengths = values.map(v => v.length);
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const avg = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

  return { min, max, avg: Math.round(avg * 100) / 100 };
}

/**
 * Analyze patterns in attribute values
 */
function analyzeValuePatterns(values: string[]): {
  numeric: boolean;
  hasSpecialChars: boolean;
  commonPrefix?: string;
  commonSuffix?: string;
} {
  if (values.length === 0) {
    return { numeric: false, hasSpecialChars: false };
  }

  // Check if all values are numeric
  const numeric = values.every(v => !isNaN(Number(v)));
  
  // Check for special characters
  const specialCharsRegex = /[^\w\s]/;
  const hasSpecialChars = values.some(v => specialCharsRegex.test(v));
  
  // Find common prefix
  let commonPrefix = '';
  if (values.length > 1) {
    const firstValue = values[0];
    let prefixLength = 0;
    
    for (let i = 0; i < firstValue.length; i++) {
      const char = firstValue[i];
      if (values.every(v => v[i] === char)) {
        prefixLength = i + 1;
      } else {
        break;
      }
    }
    
    if (prefixLength > 0) {
      commonPrefix = firstValue.substring(0, prefixLength);
    }
  }
  
  // Find common suffix
  let commonSuffix = '';
  if (values.length > 1) {
    const firstValue = values[0];
    let suffixLength = 0;
    
    for (let i = 0; i < firstValue.length; i++) {
      const charPos = firstValue.length - 1 - i;
      const char = firstValue[charPos];
      if (values.every(v => v[v.length - 1 - i] === char)) {
        suffixLength = i + 1;
      } else {
        break;
      }
    }
    
    if (suffixLength > 0) {
      commonSuffix = firstValue.substring(firstValue.length - suffixLength);
    }
  }

  return {
    numeric,
    hasSpecialChars,
    ...(commonPrefix && commonPrefix.length > 1 ? { commonPrefix } : {}),
    ...(commonSuffix && commonSuffix.length > 1 ? { commonSuffix } : {})
  };
}

/**
 * Generate recommendations for a metric based on its cardinality analysis
 */
function generateMetricRecommendations(
  metric: ParsedMetric,
  factors: AttributeCardinalityFactor[],
  attributeThreshold: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Sort factors by cardinality impact
  const sortedFactors = [...factors].sort((a, b) => b.cardinalityImpact - a.cardinalityImpact);
  
  // Find high-cardinality attributes
  const highCardinalityAttrs = sortedFactors.filter(
    factor => factor.uniqueValues > attributeThreshold
  );
  
  // Recommend dropping high-cardinality attributes
  highCardinalityAttrs.forEach(factor => {
    // Check if this is an ID-like attribute with very high cardinality
    const isIdLike = factor.attributeKey.includes('id') || 
                    factor.attributeKey.includes('guid') ||
                    factor.attributeKey.includes('uuid');
    
    if (isIdLike && factor.uniqueValues > attributeThreshold * 2) {
      // This is a clear candidate for dropping
      recommendations.push({
        type: 'drop',
        attributeKey: factor.attributeKey,
        targetMetrics: [metric.name],
        description: `Drop high-cardinality ID attribute '${factor.attributeKey}' with ${factor.uniqueValues} unique values`,
        impact: {
          cardinalityReduction: Math.floor(factor.uniqueValues * factor.cardinalityImpact),
          percentReduction: Math.round(factor.cardinalityImpact * 100)
        },
        priority: factor.cardinalityImpact > 0.5 ? 'high' : 'medium'
      });
    } 
    // Check if we can transform/relabel values
    else if (factor.patterns?.commonPrefix || factor.patterns?.commonSuffix) {
      recommendations.push({
        type: 'transform',
        attributeKey: factor.attributeKey,
        targetMetrics: [metric.name],
        description: `Transform values of '${factor.attributeKey}' to remove ${factor.patterns.commonPrefix ? 'common prefix' : 'common suffix'}`,
        impact: {
          cardinalityReduction: Math.floor(factor.uniqueValues * 0.2), // Estimate 20% reduction
          percentReduction: 20
        },
        transformRegex: factor.patterns.commonPrefix 
          ? `s/^${escapeRegex(factor.patterns.commonPrefix)}/shortened_/`
          : `s/${escapeRegex(factor.patterns.commonSuffix)}$//_shortened/`,
        priority: 'medium'
      });
    }
    // If it has many similar values, suggest aggregation
    else if (factor.uniqueValues > attributeThreshold && factor.uniqueValues <= attributeThreshold * 2) {
      recommendations.push({
        type: 'aggregate',
        attributeKey: factor.attributeKey,
        targetMetrics: [metric.name],
        description: `Aggregate values of '${factor.attributeKey}' into buckets to reduce cardinality`,
        impact: {
          cardinalityReduction: Math.floor(factor.uniqueValues * 0.8), // Estimate 80% reduction
          percentReduction: 80
        },
        priority: 'medium',
        aggregationFunction: 'bucket'
      });
    }
  });

  // If no high-cardinality attributes but many low-impact ones, suggest consolidation
  if (highCardinalityAttrs.length === 0 && sortedFactors.length > 5) {
    const lowImpactAttrs = sortedFactors.filter(f => f.cardinalityImpact < 0.1);
    if (lowImpactAttrs.length > 3) {
      recommendations.push({
        type: 'drop',
        targetMetrics: [metric.name],
        description: `Consider consolidating ${lowImpactAttrs.length} low-impact attributes that collectively add little value`,
        impact: {
          cardinalityReduction: lowImpactAttrs.reduce((sum, f) => sum + f.uniqueValues, 0),
          percentReduction: Math.round(lowImpactAttrs.reduce((sum, f) => sum + f.cardinalityImpact, 0) * 100)
        },
        priority: 'low'
      });
    }
  }

  return recommendations;
}

/**
 * Generate overall recommendations based on the full analysis
 */
function generateOverallRecommendations(
  analysis: CardinalityAnalysis,
  snapshot: ParsedSnapshot,
  costModel: CostModel
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Find attributes that appear in multiple metrics with high impact
  const highImpactAttrs = Object.values(analysis.attributeImpact)
    .filter(attr => 
      attr.weightedImpact > 0.3 && attr.affectedMetrics.length > 1
    )
    .sort((a, b) => b.weightedImpact - a.weightedImpact);
  
  // Calculate cost estimates
  const datapointsPerMonth = (30 * 24 * 60 * 60) / costModel.scrapeIntervalSeconds;
  const totalMonthlyCost = analysis.totalCardinality * 
                          datapointsPerMonth * 
                          costModel.costPerSeries;
  
  // Generate global recommendations
  highImpactAttrs.forEach(attr => {
    const attributeKey = attr.attributeKey;
    const cardinalityReduction = Math.floor(analysis.totalCardinality * attr.weightedImpact);
    const percentReduction = Math.round(attr.weightedImpact * 100);
    const estimatedSavings = cardinalityReduction * datapointsPerMonth * costModel.costPerSeries;
    
    recommendations.push({
      type: 'drop',
      attributeKey,
      targetMetrics: attr.affectedMetrics,
      description: `Drop high-impact attribute '${attributeKey}' across ${attr.affectedMetrics.length} metrics`,
      impact: {
        cardinalityReduction,
        percentReduction,
        estimatedSavings
      },
      priority: percentReduction > 30 ? 'high' : 'medium'
    });
  });
  
  // Add overall cardinality recommendation if it's high
  if (analysis.totalCardinality > 10000) {
    recommendations.push({
      type: 'aggregate',
      description: `Overall cardinality (${analysis.totalCardinality} series) is very high. Consider a holistic review of your metrics strategy.`,
      impact: {
        cardinalityReduction: Math.floor(analysis.totalCardinality * 0.5), // Estimate 50% potential reduction
        percentReduction: 50,
        estimatedSavings: totalMonthlyCost * 0.5
      },
      priority: 'high'
    });
  }
  
  return recommendations;
}

/**
 * Escape special characters in regex patterns
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Simulate impact of applying recommendations
 */
export function simulateRecommendations(
  snapshot: ParsedSnapshot,
  recommendations: Recommendation[],
  costModel: CostModel
): RecommendationImpact {
  // In a full implementation, this would create a modified snapshot
  // with the recommendations applied, then re-run the analysis
  
  // Simplistic simulation for now
  const originalCardinality = snapshot.totalSeries;
  let cardinalityReduction = 0;
  
  recommendations.forEach(rec => {
    cardinalityReduction += rec.impact.cardinalityReduction;
  });
  
  // Ensure we don't exceed 100% reduction
  cardinalityReduction = Math.min(cardinalityReduction, originalCardinality);
  
  const projectedCardinality = originalCardinality - cardinalityReduction;
  const percentReduction = Math.round((cardinalityReduction / originalCardinality) * 100);
  
  // Calculate cost savings
  const datapointsPerMonth = (30 * 24 * 60 * 60) / costModel.scrapeIntervalSeconds;
  const estimatedSavings = cardinalityReduction * datapointsPerMonth * costModel.costPerSeries;
  
  // Get unique affected metrics
  const metricsAffected = Array.from(new Set(
    recommendations.flatMap(rec => rec.targetMetrics || [])
  ));
  
  return {
    originalCardinality,
    projectedCardinality,
    cardinalityReduction,
    percentReduction,
    estimatedSavings,
    metricsAffected
  };
}