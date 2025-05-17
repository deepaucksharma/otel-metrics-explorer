# 42 · state-TemporalSlice
_A specialized store slice in the **State layer**_

---

## Responsibility

* Manage state related to temporal analysis and time series data
* Store trend information and analysis results for metric series
* Provide selectors for accessing temporal data with appropriate granularity
* Coordinate with the TemporalAnalyzer worker for data processing
* Cache analysis results for efficient access and reuse
* Maintain timeline state for snapshot navigation

---

## State Shape

```ts
interface TemporalSlice {
  // State
  analysisResults: Record<string, TemporalAnalysis>;  // Analysis results by metric key
  trendData: Record<string, Record<string, TrendData>>; // Trends by metric key and series key
  timelineSnapshots: string[];  // Ordered list of snapshot IDs
  activeSnapshotId: string | null;  // Currently selected "B" snapshot
  baselineSnapshotId: string | null;  // Currently selected "A" snapshot
  isLiveMode: boolean;  // Whether live update mode is active
  isAnalysisRunning: Record<string, boolean>;  // Loading state by metric key
  
  // Actions
  setActiveSnapshot: (snapshotId: string) => void;
  setBaselineSnapshot: (snapshotId: string) => void;
  addSnapshotToTimeline: (snapshotId: string, timestamp: number) => void;
  removeSnapshotFromTimeline: (snapshotId: string) => void;
  navigateTimeline: (direction: 'prev' | 'next') => void;
  setLiveMode: (enabled: boolean) => void;
  requestAnalysis: (metricKey: string, options?: AnalysisOptions) => Promise<TemporalAnalysis | null>;
  requestTrendData: (metricKey: string, seriesKey: string, options?: TrendOptions) => Promise<TrendData | null>;
  clearAnalysisForMetric: (metricKey: string) => void;
  clearAllAnalysisData: () => void;
  
  // Internal state
  _lastUpdateTime: number;  // Timestamp of last update
}

interface TemporalAnalysis {
  metricKey: string;  // Analyzed metric
  timeRange: [number, number];  // [start, end] timestamps
  snapshots: string[];  // Snapshot IDs included in analysis
  series: Record<string, SeriesAnalysis>;  // Analysis by series key
  globalTrends: GlobalTrend[];  // Overall patterns
  anomalies: Anomaly[];  // Detected anomalies
  analysisTimestamp: number;  // When analysis was performed
}

interface SeriesAnalysis {
  seriesKey: string;  // Unique series identifier
  values: Array<{timestamp: number, value: number, snapshotId: string}>;  // Time-ordered values
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    changeRate: number;  // Average rate of change
  };
  patterns: Pattern[];  // Detected patterns
  anomalies: Anomaly[];  // Series-specific anomalies
}

interface TrendData {
  metricKey: string;  // Source metric
  seriesKey: string;  // Source series
  timeRange: [number, number];  // [start, end] timestamps
  dataPoints: Array<{timestamp: number, value: number, snapshotId: string}>;  // Raw data points
  statistics: TrendStatistics;  // Statistical summary
  sparkline: SparklineData;  // Visualization data
  generated: number;  // Timestamp when generated
}

interface SparklineData {
  points: number[];  // Normalized values (0-1)
  min: number;  // Minimum value in raw data
  max: number;  // Maximum value in raw data
  text: string;  // ASCII/Unicode representation
  svg: string;  // SVG path data
}
```

---

## Selectors

The TemporalSlice provides several selectors for accessing temporal data:

### Timeline Selectors

```ts
// Get the current timeline state
export const useTimelineState = () => useStore(state => ({
  snapshots: state.timelineSnapshots,
  activeSnapshotId: state.activeSnapshotId,
  baselineSnapshotId: state.baselineSnapshotId,
  isLiveMode: state.isLiveMode
}));

// Get navigation capabilities
export const useTimelineNavigation = () => useStore(state => ({
  hasPrevious: state.timelineSnapshots.indexOf(state.activeSnapshotId) > 0,
  hasNext: state.timelineSnapshots.indexOf(state.activeSnapshotId) < state.timelineSnapshots.length - 1,
  navigate: state.navigateTimeline,
  setLiveMode: state.setLiveMode
}));

// Get snapshot metadata for the timeline
export const useSnapshotMetadata = () => useStore(state => {
  const { timelineSnapshots, metricsState } = state;
  
  return timelineSnapshots.map(id => {
    const snapshot = metricsState.snapshots[id];
    return {
      id,
      timestamp: snapshot?.timestamp || 0,
      label: snapshot?.label || id
    };
  });
});
```

### Analysis Selectors

```ts
// Get temporal analysis for a metric
export const useTemporalAnalysis = (metricKey: string) => useStore(state => 
  state.analysisResults[metricKey] || null
);

// Get global trends for a metric
export const useMetricTrends = (metricKey: string) => useStore(state => 
  state.analysisResults[metricKey]?.globalTrends || []
);

// Get anomalies for a metric
export const useMetricAnomalies = (metricKey: string) => useStore(state => 
  state.analysisResults[metricKey]?.anomalies || []
);

// Get analysis for a specific series
export const useSeriesAnalysis = (metricKey: string, seriesKey: string) => useStore(state => 
  state.analysisResults[metricKey]?.series[seriesKey] || null
);

// Check if analysis is currently running
export const useAnalysisStatus = (metricKey: string) => useStore(state => 
  state.isAnalysisRunning[metricKey] || false
);
```

### Trend Selectors

```ts
// Get trend data for a series
export const useTrendData = (metricKey: string, seriesKey: string) => useStore(state => 
  state.trendData[metricKey]?.[seriesKey] || null
);

// Get sparkline data for a series
export const useSparkline = (metricKey: string, seriesKey: string) => useStore(state => {
  const trend = state.trendData[metricKey]?.[seriesKey];
  return trend ? trend.sparkline : null;
});

// Get the latest value for a series from the active snapshot
export const useLatestValue = (metricKey: string, seriesKey: string) => useStore(state => {
  const { activeSnapshotId, trendData } = state;
  const trend = trendData[metricKey]?.[seriesKey];
  
  if (!trend || !activeSnapshotId) return null;
  
  // Find the data point for the active snapshot
  const point = trend.dataPoints.find(p => p.snapshotId === activeSnapshotId);
  return point ? point.value : null;
});

// Get delta between active and baseline snapshots
export const useValueDelta = (metricKey: string, seriesKey: string) => useStore(state => {
  const { activeSnapshotId, baselineSnapshotId, trendData } = state;
  const trend = trendData[metricKey]?.[seriesKey];
  
  if (!trend || !activeSnapshotId || !baselineSnapshotId) return null;
  
  // Find data points for active and baseline snapshots
  const activePoint = trend.dataPoints.find(p => p.snapshotId === activeSnapshotId);
  const baselinePoint = trend.dataPoints.find(p => p.snapshotId === baselineSnapshotId);
  
  if (!activePoint || !baselinePoint) return null;
  
  return {
    delta: activePoint.value - baselinePoint.value,
    percent: baselinePoint.value !== 0 
      ? ((activePoint.value - baselinePoint.value) / baselinePoint.value) * 100
      : null,
    interval: activePoint.timestamp - baselinePoint.timestamp
  };
});
```

---

## Actions

The TemporalSlice provides actions for managing temporal state:

### Timeline Management

```ts
// Set the active snapshot (B)
const setActiveSnapshot = (snapshotId: string) => {
  set(state => {
    state.activeSnapshotId = snapshotId;
    
    // Emit event for other components
    eventBus.emit('snapshot.select', {
      id: snapshotId,
      role: 'active'
    });
  });
};

// Set the baseline snapshot (A)
const setBaselineSnapshot = (snapshotId: string) => {
  set(state => {
    state.baselineSnapshotId = snapshotId;
    
    // Emit event for other components
    eventBus.emit('snapshot.select', {
      id: snapshotId,
      role: 'baseline'
    });
  });
};

// Add a new snapshot to the timeline
const addSnapshotToTimeline = (snapshotId: string, timestamp: number) => {
  set(state => {
    // Insert snapshot in correct chronological position
    const newTimeline = [...state.timelineSnapshots];
    let inserted = false;
    
    for (let i = 0; i < newTimeline.length; i++) {
      const currentId = newTimeline[i];
      const currentSnapshot = state.metricsState.snapshots[currentId];
      
      if (currentSnapshot && timestamp < currentSnapshot.timestamp) {
        newTimeline.splice(i, 0, snapshotId);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      newTimeline.push(snapshotId);
    }
    
    state.timelineSnapshots = newTimeline;
    
    // If in live mode, automatically update active/baseline
    if (state.isLiveMode && newTimeline.length > 1) {
      const lastIndex = newTimeline.length - 1;
      state.activeSnapshotId = newTimeline[lastIndex];
      state.baselineSnapshotId = newTimeline[lastIndex - 1];
    }
    // If this is the first snapshot, set it as active
    else if (newTimeline.length === 1) {
      state.activeSnapshotId = snapshotId;
    }
  });
};

// Navigate through timeline
const navigateTimeline = (direction: 'prev' | 'next') => {
  set(state => {
    const { timelineSnapshots, activeSnapshotId } = state;
    if (!activeSnapshotId) return;
    
    const currentIndex = timelineSnapshots.indexOf(activeSnapshotId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < timelineSnapshots.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return; // Can't navigate further
    }
    
    // Update active snapshot
    state.activeSnapshotId = timelineSnapshots[newIndex];
    
    // Update baseline if possible
    if (newIndex > 0) {
      state.baselineSnapshotId = timelineSnapshots[newIndex - 1];
    } else {
      state.baselineSnapshotId = null; // No baseline available
    }
    
    // Turn off live mode when manually navigating
    state.isLiveMode = false;
  });
};

// Toggle live update mode
const setLiveMode = (enabled: boolean) => {
  set(state => {
    state.isLiveMode = enabled;
    
    // If enabling and we have snapshots, set active/baseline to latest
    if (enabled && state.timelineSnapshots.length > 1) {
      const lastIndex = state.timelineSnapshots.length - 1;
      state.activeSnapshotId = state.timelineSnapshots[lastIndex];
      state.baselineSnapshotId = state.timelineSnapshots[lastIndex - 1];
    }
    
    // Emit event for other components
    eventBus.emit('live.toggle', { enabled });
  });
};
```

### Analysis Management

```ts
// Request temporal analysis for a metric
const requestAnalysis = async (metricKey: string, options: AnalysisOptions = {}) => {
  // Mark analysis as running
  set(state => {
    state.isAnalysisRunning[metricKey] = true;
  });
  
  try {
    // Import worker interface
    const { requestTemporalAnalysis } = await import('../services/temporalRunner');
    
    // Get snapshots to analyze
    const state = get();
    const snapshotIds = options.snapshotIds || state.timelineSnapshots;
    
    // Run analysis
    const analysis = await requestTemporalAnalysis({
      metricKey,
      snapshotIds,
      options
    });
    
    // Update state with results
    set(state => {
      state.analysisResults[metricKey] = analysis;
      state.isAnalysisRunning[metricKey] = false;
      state._lastUpdateTime = Date.now();
    });
    
    return analysis;
  } catch (error) {
    console.error(`Temporal analysis failed for ${metricKey}:`, error);
    
    // Clear running state
    set(state => {
      state.isAnalysisRunning[metricKey] = false;
    });
    
    return null;
  }
};

// Request trend data for a specific series
const requestTrendData = async (metricKey: string, seriesKey: string, options: TrendOptions = {}) => {
  try {
    // Import worker interface
    const { requestTrendData } = await import('../services/temporalRunner');
    
    // Get snapshots to analyze
    const state = get();
    const snapshotIds = options.snapshotIds || state.timelineSnapshots;
    
    // Run trend analysis
    const trendData = await requestTrendData({
      metricKey,
      seriesKey,
      snapshotIds,
      options
    });
    
    // Update state with results
    set(state => {
      if (!state.trendData[metricKey]) {
        state.trendData[metricKey] = {};
      }
      state.trendData[metricKey][seriesKey] = trendData;
      state._lastUpdateTime = Date.now();
    });
    
    return trendData;
  } catch (error) {
    console.error(`Trend data request failed for ${metricKey}/${seriesKey}:`, error);
    return null;
  }
};

// Clear analysis data for a metric
const clearAnalysisForMetric = (metricKey: string) => {
  set(state => {
    delete state.analysisResults[metricKey];
    delete state.trendData[metricKey];
  });
};

// Clear all analysis data
const clearAllAnalysisData = () => {
  set(state => {
    state.analysisResults = {};
    state.trendData = {};
  });
};
```

---

## Event Integration

The TemporalSlice integrates with the application's event system:

### EventBus Subscriptions

| Event            | Action                                       |
|------------------|----------------------------------------------|
| `snapshot.loaded`| Add snapshot to timeline and trigger analysis|
| `snapshot.select`| Update active/baseline snapshot selections   |
| `ui.metric.select`| Request analysis for selected metric        |
| `live.toggle`    | Enable/disable live update mode             |

### EventBus Emissions

| Event            | Payload                                     |
|------------------|---------------------------------------------|
| `snapshot.select`| `{ id: string, role: 'active'|'baseline' }` |
| `live.toggle`    | `{ enabled: boolean }`                      |

---

## Implementation Notes

### Performance Optimization

1. **Caching Strategy**
   - Analysis results are cached by metric key
   - Trend data is cached by metric key and series key
   - Cached data includes timestamp for freshness checking
   - Auto-refresh for stale data based on configurable threshold

2. **Lazy Loading**
   - Analysis is performed on demand, not for all metrics
   - Trend data is generated only for viewed series
   - Background computation for likely next selections
   - Progressive loading for large datasets

3. **Memory Management**
   - Older analysis data is pruned when memory pressure is high
   - Data is normalized and compressed where possible
   - Limit on maximum cached items with LRU eviction
   - Option to discard raw data after processing

### Integration with Other Slices

1. **MetricsSlice**
   - Utilizes snapshot data from MetricsSlice
   - Coordinates snapshot loading and parsing
   - Shares metric definitions for context

2. **DiffSlice**
   - Complements diff calculations with temporal context
   - Provides additional insights beyond simple A/B comparison
   - Helps explain spikes and anomalies in diff view

3. **UISlice**
   - Responds to UI navigation and selection
   - Updates relevant UI state for temporal view
   - Synchronizes timeline with UI controls