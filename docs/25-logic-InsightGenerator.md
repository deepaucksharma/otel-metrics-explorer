# 25 · logic-InsightGenerator
_A utility module in the **Logic layer**_

---

## Responsibility

* Generate contextual insights and recommendations based on metric data
* Detect patterns, anomalies, and correlations across metrics and series
* Provide educational content for OTLP concepts and best practices
* Prioritize insights based on relevance and potential value
* Support proactive notification of significant findings
* Generate context-sensitive actions and recommendations

---

## Module Structure

```
src/utils/insightGenerator.ts               # Core insight generation algorithms
src/utils/insightPrioritizer.ts             # Insight prioritization and filtering
src/utils/educationalContent.ts             # OTLP educational content
src/services/insightRunner.ts               # Integration service with event system
```

---

## Core API

```ts
/**
 * Generate insights for a metric
 * @param metric The metric to analyze
 * @param snapshots Available snapshots
 * @param options Configuration options
 * @returns Array of insights with recommendations
 */
export function generateMetricInsights(
  metric: ParsedMetric,
  snapshots: Record<string, ParsedSnapshot>,
  options: InsightOptions = {}
): Insight[] {
  // Implementation generates insights based on the metric
  // and available snapshots
}

/**
 * Generate insights for a specific series
 * @param seriesKey The series key to analyze
 * @param metric The parent metric
 * @param snapshots Available snapshots
 * @param options Configuration options
 * @returns Array of insights specific to the series
 */
export function generateSeriesInsights(
  seriesKey: string,
  metric: ParsedMetric,
  snapshots: Record<string, ParsedSnapshot>,
  options: InsightOptions = {}
): Insight[] {
  // Implementation generates insights specific to a series
}

/**
 * Generate educational content for a specific OTLP concept
 * @param concept The OTLP concept to explain
 * @returns Educational content with examples
 */
export function getEducationalContent(
  concept: OTELConcept
): EducationalContent {
  // Returns educational content for a specific concept
}
```

---

## Data Types

```ts
/**
 * An insight generated from metric data
 */
interface Insight {
  id: string;                    // Unique identifier
  type: InsightType;             // Type of insight
  metricKey: string;             // Related metric
  seriesKey?: string;            // Optional related series
  priority: number;              // Priority (0-100, higher = more important)
  title: string;                 // Short title
  description: string;           // Detailed description
  evidence: InsightEvidence[];   // Supporting evidence
  recommendations?: Recommendation[]; // Optional recommendations
  relatedConcepts?: OTELConcept[]; // Related OTEL concepts
  timestamp: number;             // When the insight was generated
}

/**
 * Types of insights
 */
enum InsightType {
  PATTERN = 'pattern',           // Detected pattern
  ANOMALY = 'anomaly',           // Data anomaly
  EDUCATIONAL = 'educational',   // Educational insight
  OPTIMIZATION = 'optimization', // Optimization opportunity
  CORRELATION = 'correlation',   // Correlation between metrics/series
  SCHEMA = 'schema',             // Schema-related insight
  CARDINALITY = 'cardinality'    // Cardinality-related insight
}

/**
 * Evidence supporting an insight
 */
interface InsightEvidence {
  type: 'value' | 'trend' | 'comparison' | 'threshold';
  description: string;           // Description of the evidence
  data?: any;                    // Optional data to support the evidence
}

/**
 * A recommendation based on an insight
 */
interface Recommendation {
  id: string;                    // Unique identifier
  title: string;                 // Short title
  description: string;           // Detailed description
  impact: 'high' | 'medium' | 'low'; // Expected impact
  effort: 'high' | 'medium' | 'low'; // Implementation effort
  action?: {                     // Optional action
    type: 'link' | 'command' | 'code';
    target: string;              // Target of the action
    label: string;               // User-facing label
  };
}

/**
 * Educational content for an OTEL concept
 */
interface EducationalContent {
  concept: OTELConcept;          // The concept being explained
  title: string;                 // Display title
  description: string;           // Detailed explanation
  examples: string[];            // Code or configuration examples
  links: {                       // Related links
    label: string;
    url: string;
  }[];
  relatedConcepts: OTELConcept[]; // Related concepts
}

/**
 * OTEL concepts that can be explained
 */
enum OTELConcept {
  INSTRUMENT_TYPES = 'instrument_types',
  TEMPORALITY = 'temporality',
  MONOTONICITY = 'monotonicity',
  AGGREGATION = 'aggregation',
  UNITS = 'units',
  ATTRIBUTES = 'attributes',
  CARDINALITY = 'cardinality',
  EXEMPLARS = 'exemplars',
  RESOURCE = 'resource',
  SCOPE = 'scope',
  METRICS_API = 'metrics_api',
  SEMANTIC_CONVENTIONS = 'semantic_conventions'
}

/**
 * Options for insight generation
 */
interface InsightOptions {
  maxInsights?: number;          // Maximum number of insights to generate
  minPriority?: number;          // Minimum priority to include
  includeTypes?: InsightType[];  // Types to include
  excludeTypes?: InsightType[];  // Types to exclude
  includeEducational?: boolean;  // Whether to include educational insights
  timeRange?: [number, number];  // Time range to consider
}
```

---

## Insight Types and Detection

The InsightGenerator can detect various types of insights:

### 1. Pattern Insights

Detects common patterns in metric data:
- Growth trends (linear, exponential)
- Cyclical patterns (hourly, daily)
- Plateaus and saturation points
- Step changes and level shifts

```ts
function detectPatterns(values: DataPoint[], options: PatternOptions): Insight[] {
  const insights: Insight[] = [];
  
  // Check for growth trends
  const trendAnalysis = analyzeTrend(values);
  if (trendAnalysis.type === 'linear' && trendAnalysis.confidence > 0.8) {
    insights.push({
      id: generateId(),
      type: InsightType.PATTERN,
      metricKey: options.metricKey,
      seriesKey: options.seriesKey,
      priority: 50 + (trendAnalysis.slope * 10), // Higher slope = higher priority
      title: 'Linear Growth Pattern Detected',
      description: `This metric is showing a consistent linear growth pattern with a slope of ${trendAnalysis.slope.toFixed(2)} per second.`,
      evidence: [
        {
          type: 'trend',
          description: 'Linear regression analysis',
          data: {
            slope: trendAnalysis.slope,
            r2: trendAnalysis.r2,
            points: values.length
          }
        }
      ],
      timestamp: Date.now()
    });
  }
  
  // Additional pattern detections...
  
  return insights;
}
```

### 2. Anomaly Insights

Detects unusual behavior in metric data:
- Outliers (statistical deviation)
- Sudden spikes or drops
- Counter resets
- Missing data points
- Pattern breaks

```ts
function detectAnomalies(values: DataPoint[], options: AnomalyOptions): Insight[] {
  const insights: Insight[] = [];
  
  // Check for outliers using Z-score
  const stats = calculateStatistics(values.map(v => v.value));
  const outliers = values.filter(point => {
    const zScore = Math.abs((point.value - stats.mean) / stats.stdDev);
    return zScore > 3; // 3 standard deviations
  });
  
  if (outliers.length > 0) {
    insights.push({
      id: generateId(),
      type: InsightType.ANOMALY,
      metricKey: options.metricKey,
      seriesKey: options.seriesKey,
      priority: 70, // Anomalies tend to be high priority
      title: `${outliers.length} Outlier${outliers.length > 1 ? 's' : ''} Detected`,
      description: `Detected ${outliers.length} value${outliers.length > 1 ? 's' : ''} that significantly deviate from the normal range.`,
      evidence: [
        {
          type: 'value',
          description: 'Statistical outliers',
          data: {
            outliers: outliers.map(o => ({
              timestamp: o.timestamp,
              value: o.value,
              zScore: Math.abs((o.value - stats.mean) / stats.stdDev)
            })),
            mean: stats.mean,
            stdDev: stats.stdDev
          }
        }
      ],
      timestamp: Date.now()
    });
  }
  
  // Additional anomaly detections...
  
  return insights;
}
```

### 3. Educational Insights

Provides educational content based on metric properties:
- Instrument type explanations
- Temporality and aggregation guidance
- Unit conventions
- Semantic conventions

```ts
function generateEducationalInsights(metric: ParsedMetric, options: InsightOptions): Insight[] {
  const insights: Insight[] = [];
  
  // If this is a counter, explain monotonicity
  if (metric.type === 'sum' && metric.isMonotonic) {
    const content = getEducationalContent(OTELConcept.MONOTONICITY);
    
    insights.push({
      id: generateId(),
      type: InsightType.EDUCATIONAL,
      metricKey: metric.name,
      priority: 30, // Educational insights are typically lower priority
      title: 'Understanding Monotonic Counters',
      description: content.description,
      evidence: [
        {
          type: 'value',
          description: 'This metric is a monotonic counter'
        }
      ],
      relatedConcepts: content.relatedConcepts,
      timestamp: Date.now()
    });
  }
  
  // Additional educational insights...
  
  return insights;
}
```

### 4. Optimization Insights

Suggests ways to optimize metrics:
- Cardinality reduction opportunities
- Sampling rate adjustments
- Attribute consolidation

```ts
function generateOptimizationInsights(metric: ParsedMetric, snapshots: Record<string, ParsedSnapshot>, options: InsightOptions): Insight[] {
  const insights: Insight[] = [];
  
  // Check for high-cardinality attributes
  const cardinalityAnalysis = analyzeAttributeCardinality(metric, snapshots);
  const highCardinalityAttrs = cardinalityAnalysis.attributes.filter(a => a.uniqueValues > 100);
  
  if (highCardinalityAttrs.length > 0) {
    insights.push({
      id: generateId(),
      type: InsightType.OPTIMIZATION,
      metricKey: metric.name,
      priority: 60, // Optimization opportunities are higher priority
      title: 'High Cardinality Attributes Detected',
      description: `Detected ${highCardinalityAttrs.length} high-cardinality attributes that may impact performance and cost.`,
      evidence: [
        {
          type: 'value',
          description: 'High cardinality attributes',
          data: {
            attributes: highCardinalityAttrs.map(a => ({
              name: a.name,
              uniqueValues: a.uniqueValues,
              impact: a.impact
            }))
          }
        }
      ],
      recommendations: highCardinalityAttrs.map(attr => ({
        id: generateId(),
        title: `Consider dropping or limiting "${attr.name}"`,
        description: `The attribute "${attr.name}" has ${attr.uniqueValues} unique values. Consider removing this attribute or limiting its cardinality.`,
        impact: 'high',
        effort: 'low',
        action: {
          type: 'code',
          target: `collector.yaml`,
          label: 'View example config'
        }
      })),
      timestamp: Date.now()
    });
  }
  
  // Additional optimization insights...
  
  return insights;
}
```

### 5. Correlation Insights

Identifies relationships between metrics:
- Correlated increases/decreases
- Causal relationships
- Related metrics

```ts
function detectCorrelations(metricKey: string, allMetrics: Record<string, ParsedMetric>, snapshots: Record<string, ParsedSnapshot>, options: InsightOptions): Insight[] {
  const insights: Insight[] = [];
  const targetMetric = allMetrics[metricKey];
  
  // Skip if no target metric
  if (!targetMetric) return insights;
  
  // Get time series data for target metric
  const targetSeries = extractTimeSeries(targetMetric, snapshots);
  
  // Check correlations with other metrics
  for (const [otherKey, otherMetric] of Object.entries(allMetrics)) {
    // Skip self-comparison
    if (otherKey === metricKey) continue;
    
    const otherSeries = extractTimeSeries(otherMetric, snapshots);
    const correlation = calculateCorrelation(targetSeries, otherSeries);
    
    // Strong correlation detected
    if (Math.abs(correlation) > 0.8) {
      insights.push({
        id: generateId(),
        type: InsightType.CORRELATION,
        metricKey: metricKey,
        priority: 50,
        title: `Strong ${correlation > 0 ? 'Positive' : 'Negative'} Correlation Detected`,
        description: `This metric shows a strong ${correlation > 0 ? 'positive' : 'negative'} correlation (${correlation.toFixed(2)}) with "${otherKey}".`,
        evidence: [
          {
            type: 'comparison',
            description: 'Correlation analysis',
            data: {
              correlation: correlation,
              otherMetric: otherKey,
              sampleSize: targetSeries.length
            }
          }
        ],
        timestamp: Date.now()
      });
    }
  }
  
  return insights;
}
```

---

## Integration with EventBus

The InsightGenerator integrates with the application's event system:

```ts
// In insightRunner.ts
export function initInsightRunner() {
  // Listen for relevant events
  eventBus.on('snapshot.loaded', handleSnapshotLoaded);
  eventBus.on('ui.metric.select', handleMetricSelected);
  eventBus.on('ui.series.select', handleSeriesSelected);
  
  // Return cleanup function
  return () => {
    eventBus.off('snapshot.loaded', handleSnapshotLoaded);
    eventBus.off('ui.metric.select', handleMetricSelected);
    eventBus.off('ui.series.select', handleSeriesSelected);
  };
}

async function handleMetricSelected(event: { metricKey: string }) {
  const { metricKey } = event;
  const store = useStore.getState();
  const metric = store.getMetricByKey(metricKey);
  const snapshots = store.snapshots;
  
  if (!metric || Object.keys(snapshots).length === 0) return;
  
  // Generate insights for the selected metric
  const insights = generateMetricInsights(metric, snapshots, {
    includeEducational: true,
    maxInsights: 5
  });
  
  // Emit insights event
  if (insights.length > 0) {
    eventBus.emit('insights.available', {
      metricKey,
      insights
    });
  }
}

// Additional event handlers...
```

---

## Usage Examples

### From UI Components

```tsx
// In a component that displays insights
function MetricInsightsPanel({ metricKey }: { metricKey: string }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  
  useEffect(() => {
    // Subscribe to insights events
    const handleInsights = (event: { metricKey: string, insights: Insight[] }) => {
      if (event.metricKey === metricKey) {
        setInsights(event.insights);
      }
    };
    
    eventBus.on('insights.available', handleInsights);
    
    // Request insights for this metric
    eventBus.emit('ui.metric.select', { metricKey });
    
    // Cleanup
    return () => {
      eventBus.off('insights.available', handleInsights);
    };
  }, [metricKey]);
  
  // Render insights
  return (
    <div className="metric-insights-panel">
      <h3>Insights ({insights.length})</h3>
      {insights.length === 0 ? (
        <p>No insights available for this metric.</p>
      ) : (
        <ul className="insights-list">
          {insights.map(insight => (
            <InsightCard 
              key={insight.id} 
              insight={insight} 
              onRecommendationSelect={handleRecommendationSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
```

### In Educational Tooltips

```tsx
// In SchemaInfoStrip.tsx
function SchemaInfoTooltip({ concept }: { concept: OTELConcept }) {
  const content = getEducationalContent(concept);
  
  return (
    <div className="tooltip-content">
      <h4>{content.title}</h4>
      <p>{content.description}</p>
      {content.examples.length > 0 && (
        <div className="examples">
          <strong>Examples:</strong>
          {content.examples.map((example, i) => (
            <pre key={i} className="example-code">{example}</pre>
          ))}
        </div>
      )}
      {content.links.length > 0 && (
        <div className="related-links">
          <strong>Learn more:</strong>
          <ul>
            {content.links.map((link, i) => (
              <li key={i}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## Testing Strategy

1. **Unit Tests**
   - Test individual detection algorithms
   - Verify correct insight generation for known patterns
   - Test prioritization logic

2. **Integration Tests**
   - Test integration with event system
   - Verify correct response to UI events
   - Test insight filtering and selection

3. **Content Tests**
   - Verify educational content accuracy
   - Test recommendation generation
   - Validate recommendation actions