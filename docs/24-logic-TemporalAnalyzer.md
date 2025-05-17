# 24 · logic-TemporalAnalyzer
_A worker-based module in the **Logic layer**_

---

## Responsibility

* Analyze time series data across multiple snapshots for temporal patterns
* Generate trend information for metric series with mini-sparklines
* Detect anomalies, resets, and significant changes in time series
* Calculate rolling averages and baseline statistics for comparison
* Provide historical context for metrics to enhance understanding
* Run efficiently in a Web Worker to avoid blocking the main thread

---

## Module Structure

```
src/workers/temporalAnalyzer.worker.ts      # Worker implementation
src/utils/temporalAnalysis.ts               # Core analysis algorithms (sync)
src/services/temporalRunner.ts              # Orchestration service
```

---

## Core API

### Input Messages

The worker receives messages with the following structure:

```ts
interface WorkerMessage {
  id: string;                         // Unique message identifier for response matching
  action: 'analyze' | 'trend';        // Action to perform
  payload: AnalyzePayload | TrendPayload; // Action-specific data
}

interface AnalyzePayload {
  snapshots: Record<string, ParsedSnapshot>; // Available snapshots keyed by ID
  snapshotIds: string[];               // Ordered list of snapshot IDs to analyze
  metricKey: string;                   // Metric to analyze
  options?: TemporalAnalysisOptions;   // Optional configuration
}

interface TrendPayload {
  snapshots: Record<string, ParsedSnapshot>; // Available snapshots keyed by ID
  snapshotIds: string[];               // Ordered list of snapshot IDs
  metricKey: string;                   // Metric to generate trend for
  seriesKey?: string;                  // Optional series to focus on (if omitted, analyzes all series)
  options?: TrendOptions;              // Optional configuration
}
```

### Output Messages

The worker sends response messages with the following structure:

```ts
interface WorkerResponse {
  id: string;                         // Matching the request ID
  action: 'analyze' | 'trend';        // The action that was performed
  success: boolean;                   // Whether the operation succeeded
  data?: TemporalAnalysis | TrendData; // Result data if successful
  error?: string;                     // Error message if unsuccessful
}

interface TemporalAnalysis {
  metricKey: string;                  // Analyzed metric
  timeRange: [number, number];        // [start, end] timestamps
  snapshots: string[];                // Snapshot IDs in analysis order
  series: Record<string, SeriesAnalysis>; // Analysis results keyed by series
  globalTrends: GlobalTrend[];        // Overall metric trends
  anomalies: Anomaly[];               // Detected anomalies across series
}

interface TrendData {
  metricKey: string;                  // Analyzed metric
  seriesKey?: string;                 // Series if specified
  timeRange: [number, number];        // [start, end] timestamps
  dataPoints: DataPoint[];            // Time-ordered data points
  statistics: TrendStatistics;        // Statistical summary
  sparkline: SparklineData;           // Pre-rendered data for sparklines
}
```

---

## Analysis Capabilities

### Trend Detection

The TemporalAnalyzer can identify several types of trends in time series data:

1. **Growth Patterns**
   - Linear growth
   - Exponential growth
   - Plateaus and saturation
   - Cyclic patterns

2. **Change Detection**
   - Step changes
   - Gradual shifts
   - Seasonal patterns
   - Counter resets

3. **Anomaly Detection**
   - Outliers based on statistical models
   - Sudden spikes or drops
   - Missing data points
   - Pattern breaks

### Mini-Sparkline Generation

For UI presentation, the analyzer generates compact sparkline representations:

1. **Data Preparation**
   - Normalization to 0-1 range
   - Resampling to fixed number of points
   - Missing data interpolation
   - Noise reduction

2. **Sparkline Formats**
   - ASCII/Unicode for text representation (`▁▂▃▄▅▆▇`)
   - SVG path data for visual rendering
   - Point coordinates for custom rendering
   - Min/max/avg annotations

### Statistical Analysis

The analyzer computes statistical measures for time series:

1. **Basic Statistics**
   - Min/max values
   - Mean, median, standard deviation
   - Percentiles (p50, p90, p99)
   - Rate of change

2. **Advanced Metrics**
   - Moving averages
   - Seasonally adjusted values
   - Deviation from baseline
   - Predictive forecasts

---

## Implementation Notes

### Performance Optimization

1. **Efficient Data Structures**
   - Binary search for time-based queries
   - Pre-computed indices for series lookup
   - Memory-efficient windowed processing
   - Sparse representation for large gaps

2. **Adaptive Processing**
   - Dynamic algorithm selection based on data size
   - Progressive computation for large datasets
   - Priority queue for important metrics
   - Early termination for obvious patterns

### Edge Case Handling

1. **Data Quality Issues**
   - Missing snapshots (gaps in timeline)
   - Counter resets (automatic detection)
   - Time skew between snapshots
   - Inconsistent units or scales

2. **Format Conversions**
   - Time unit normalization
   - Value scaling for consistent visualization
   - Text formatting for display
   - Mapping between different snapshot formats

---

## Usage Example

From a UI component:

```ts
// Request trend data for a specific series
const getTrendData = async (metricKey: string, seriesKey: string) => {
  const temporalAnalyzer = await import('../services/temporalRunner');
  
  try {
    const trendData = await temporalAnalyzer.requestTrendData({
      metricKey,
      seriesKey,
      options: {
        timeRange: [Date.now() - 600000, Date.now()], // Last 10 minutes
        pointCount: 20, // Number of points for sparkline
      }
    });
    
    return trendData;
  } catch (error) {
    console.error('Failed to get trend data:', error);
    return null;
  }
};

// Then use the result to render a sparkline or detailed trend view
```

From the state layer:

```ts
// In temporalSlice.ts
const temporalSlice = (set, get) => ({
  // State
  analysisResults: {},
  trendData: {},
  
  // Actions
  requestAnalysis: async (metricKey: string, snapshotIds: string[]) => {
    const temporalRunner = await import('../services/temporalRunner');
    
    try {
      const analysis = await temporalRunner.requestTemporalAnalysis({
        metricKey,
        snapshotIds,
        options: {
          detectAnomalies: true,
          computeStatistics: true
        }
      });
      
      // Update state with results
      set(state => {
        state.analysisResults[metricKey] = analysis;
      });
      
      return analysis;
    } catch (error) {
      console.error('Temporal analysis failed:', error);
      return null;
    }
  },
  
  // More actions and selectors...
});
```

---

## Event Integration

The TemporalAnalyzer integrates with the application's event system:

### EventBus Subscriptions

| Event            | Action                                       |
|------------------|----------------------------------------------|
| `snapshot.loaded`| Trigger analysis of new snapshot in context  |
| `ui.metric.select`| Prepare trend data for selected metric       |

### EventBus Emissions

| Event              | Payload                                     |
|--------------------|---------------------------------------------|
| `temporal.analyzed`| `{ metricKey: string, analysis: TemporalAnalysis }` |
| `temporal.trend.ready`| `{ metricKey: string, seriesKey?: string, trendData: TrendData }` |

---

## Testing Strategy

1. **Unit Tests**
   - Test core analysis algorithms with known patterns
   - Verify statistical calculations against reference implementations
   - Test edge cases (empty data, single points, etc.)

2. **Integration Tests**
   - Test worker message handling and response formatting
   - Verify correct event emissions
   - Test interaction with state management

3. **Performance Tests**
   - Benchmark processing time for various data sizes
   - Measure memory consumption
   - Test scalability with large snapshot counts