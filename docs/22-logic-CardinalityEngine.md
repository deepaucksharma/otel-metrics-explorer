# Cardinality Analysis Engine

## Overview

The Cardinality Analysis Engine is a specialized component in the Logic Layer that analyzes OTLP metrics data to identify cardinality issues and provide optimization recommendations. High cardinality metrics can lead to performance problems and excessive resource consumption in monitoring systems, and this engine helps users understand and address these challenges.

## Responsibilities

1. Calculate the cardinality of metrics based on their attributes
2. Identify high-cardinality attribute combinations
3. Estimate the storage and computational impact of high-cardinality metrics
4. Generate specific recommendations for cardinality reduction
5. Calculate potential cost savings from implementing recommendations
6. Analyze attribute value patterns to suggest filtering or aggregation strategies

## Public Interface

```typescript
interface CardinalityAnalysisEngine {
  // Analyze cardinality for a single snapshot
  analyzeSnapshot(snapshotId: string, options?: AnalysisOptions): Promise<CardinalityAnalysis>;
  
  // Analyze cardinality differences between two snapshots
  compareSnapshots(snapshotIdA: string, snapshotIdB: string, options?: ComparisonOptions): Promise<CardinalityComparisonResult>;
  
  // Generate recommendations for a specific metric
  generateMetricRecommendations(snapshotId: string, metricId: string): Promise<MetricRecommendations>;
  
  // Estimate cost impact of high-cardinality metrics
  estimateCostImpact(snapshotId: string, costModel?: CostModel): Promise<CostImpactAnalysis>;
  
  // Preview the effect of applying specific recommendations
  previewRecommendationImpact(snapshotId: string, recommendations: RecommendationSet): Promise<RecommendationImpact>;
}

interface AnalysisOptions {
  includeMetrics?: string[]; // Only analyze specific metrics, default: all
  excludeMetrics?: string[]; // Exclude specific metrics from analysis
  attributeThreshold?: number; // Unique values threshold for highlighting, default: 100
  depthLimit?: number; // Maximum attribute combination depth to analyze, default: 3
  costModel?: CostModel; // Model for cost estimations
  calculateCombinations?: boolean; // Whether to analyze attribute combinations, default: true
}

interface ComparisonOptions extends AnalysisOptions {
  compareNewMetricsOnly?: boolean; // Only compare metrics that appeared in the newer snapshot
  includeTrends?: boolean; // Calculate cardinality growth trends
}

interface CostModel {
  costPerSeries: number; // Cost per unique time series
  costPerDataPoint: number; // Cost per individual data point
  retentionPeriodDays: number; // Data retention period
  scrapeIntervalSeconds: number; // Frequency of data collection
  currency: string; // Currency for cost estimation, default: 'USD'
}

interface RecommendationSet {
  metricIds: string[];
  recommendations: Recommendation[];
}

interface Recommendation {
  type: 'drop' | 'aggregate' | 'transform' | 'relabel';
  attributeKey?: string;
  newAttributeKey?: string;
  aggregationFunction?: string;
  transformRegex?: string;
  priority: 'high' | 'medium' | 'low';
}
```

## Implementation Details

### Cardinality Calculation

1. For each metric, the engine analyzes the unique combinations of attribute values
2. It calculates the total number of unique time series per metric
3. It identifies which attributes contribute most to cardinality explosion
4. Special attention is given to high-cardinality attributes (e.g., IDs, timestamps, dynamic values)
5. The engine analyzes attribute value patterns to detect opportunities for normalization

### Cost Impact Estimation

1. The engine applies a configurable cost model to estimate resource implications
2. It calculates the storage requirements based on cardinality and data point frequency
3. Computational costs for query processing are estimated
4. The results are presented in terms of concrete metrics (storage, compute, cost)

### Recommendation Generation

1. Based on cardinality analysis, the engine generates specific recommendations
2. Recommendations are prioritized by impact and implementation complexity
3. Each recommendation includes a detailed explanation and potential savings
4. Implementation guidance is provided, including OTel Collector configuration snippets

### Performance Considerations

- Analysis is performed in a Web Worker to avoid blocking the main thread
- For large datasets, incremental processing is used
- Memory-efficient data structures optimize attribute combination analysis
- Results are cached to enable quick re-analysis with different parameters

## Error Handling

- Missing snapshots: Provides clear error indicating the snapshot is not available
- Invalid metric IDs: Reports which metrics could not be found
- Analysis timeout: Implements graceful timeout with partial results
- Memory limitations: Monitors memory usage and adjusts analysis depth accordingly

## Dependencies

- SnapshotRegistry: For accessing parsed snapshot data
- OtelConfigGenerator: For generating implementation recommendations
- StatisticsCalculator: For analyzing attribute value distributions
- EventBus: For emitting progress and completion events

## Usage Example

```typescript
const cardinalityEngine = new CardinalityAnalysisEngine();

// Analyze a snapshot
async function analyzeMetricsCardinality(snapshotId) {
  try {
    const analysis = await cardinalityEngine.analyzeSnapshot(snapshotId, {
      attributeThreshold: 50,
      depthLimit: 2,
      costModel: {
        costPerSeries: 0.001,
        costPerDataPoint: 0.0000001,
        retentionPeriodDays: 30,
        scrapeIntervalSeconds: 60,
        currency: 'USD'
      }
    });
    
    console.log(`Total cardinality: ${analysis.totalCardinality} series`);
    console.log(`Estimated monthly cost: ${analysis.totalEstimatedCost} USD`);
    
    // Find the top high-cardinality metrics
    const highCardinalityMetrics = Object.values(analysis.metrics)
      .sort((a, b) => b.totalSeries - a.totalSeries)
      .slice(0, 5);
    
    console.log('Top 5 high-cardinality metrics:');
    highCardinalityMetrics.forEach(metric => {
      console.log(`- ${metric.name}: ${metric.totalSeries} series`);
      
      // Get the top contributing attributes
      const topAttributes = metric.attributeCardinalityFactors
        .sort((a, b) => b.cardinalityImpact - a.cardinalityImpact)
        .slice(0, 3);
      
      console.log('  Top contributing attributes:');
      topAttributes.forEach(attr => {
        console.log(`  - ${attr.attributeKey}: ${attr.uniqueValues} unique values`);
      });
    });
    
    // Get recommendations for a specific metric
    if (highCardinalityMetrics.length > 0) {
      const recommendations = await cardinalityEngine.generateMetricRecommendations(
        snapshotId,
        highCardinalityMetrics[0].metricId
      );
      
      console.log('Recommendations:');
      recommendations.recommendations.forEach(rec => {
        console.log(`- [${rec.priority}] ${rec.description}`);
        console.log(`  Potential savings: ${rec.potentialSavings} series`);
      });
    }
    
    return analysis;
  } catch (error) {
    console.error('Failed to analyze cardinality:', error);
    throw error;
  }
}
```

The Cardinality Analysis Engine is a crucial component for helping users understand and optimize their metrics collection, with direct impact on monitoring system performance and cost.
