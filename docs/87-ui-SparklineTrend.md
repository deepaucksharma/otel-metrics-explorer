# 87 · ui-SparklineTrend
_A micro-component in the **UI layer** for compact time series visualization_

---

## Responsibility

* Render a compact inline visualization of time series data
* Display trend information with minimal space requirements
* Support both SVG and text-based (ASCII/Unicode) representations
* Provide appropriate visual indicators for important points (min, max, current)
* Offer accessible alternatives for screen readers
* Maintain high performance for real-time updates

---

## Visual Design

```text
📈 Mini-Trend (last 10m):  ▂▃▄▅▆▇
```

This component appears in the SeriesDetailPane and provides:
- Compact visualization of recent metric values
- Clear indication of trend direction and magnitude
- Minimal space requirements for inline display
- Support for both graphical and text-based rendering

---

## Props

```ts
export interface SparklineTrendProps {
  data: SparklineData;                // Trend data to visualize
  width?: number;                     // Optional width for SVG renderer
  height?: number;                    // Optional height for SVG renderer
  showEndpoints?: boolean;            // Whether to highlight first/last points
  showMinMax?: boolean;               // Whether to highlight min/max points
  renderMode?: 'svg' | 'text';        // Visualization mode
  className?: string;                 // Additional CSS classes
}

interface SparklineData {
  points: number[];                   // Normalized values (0-1)
  min: number;                        // Minimum value in raw data
  max: number;                        // Maximum value in raw data
  minIndex?: number;                  // Optional index of minimum value
  maxIndex?: number;                  // Optional index of maximum value
  text: string;                       // ASCII/Unicode representation
  timeRange?: [number, number];       // Optional [start, end] timestamps
  labels?: string[];                  // Optional labels for points
}
```

---

## Implementation Options

The SparklineTrend can be rendered in multiple ways:

### 1. SVG Rendering

```tsx
const SparklineTrendSVG = ({
  data,
  width = 100,
  height = 20,
  showEndpoints = false,
  showMinMax = false,
  className = ''
}: SparklineTrendProps) => {
  const { points, minIndex, maxIndex } = data;
  
  // No data or invalid data check
  if (!points || points.length < 2) {
    return (
      <div className={`sparkline-trend-empty ${className}`} aria-label="No trend data available">
        —
      </div>
    );
  }
  
  // Calculate path data
  const pathData = useMemo(() => {
    const step = width / (points.length - 1);
    
    return points.map((point, i) => {
      const x = i * step;
      const y = height - (point * height);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
  }, [points, width, height]);
  
  return (
    <div 
      className={`sparkline-trend ${className}`} 
      aria-label={`Trend over time: ${data.text}`}
    >
      <svg width={width} height={height} role="img">
        <path 
          d={pathData} 
          stroke="currentColor" 
          strokeWidth="1.5" 
          fill="none" 
        />
        
        {showEndpoints && (
          <>
            <circle 
              cx={0} 
              cy={height - (points[0] * height)} 
              r="2" 
              fill="currentColor" 
            />
            <circle 
              cx={width} 
              cy={height - (points[points.length - 1] * height)} 
              r="2" 
              fill="currentColor" 
            />
          </>
        )}
        
        {showMinMax && minIndex !== undefined && (
          <circle 
            cx={minIndex * (width / (points.length - 1))} 
            cy={height - (points[minIndex] * height)} 
            r="2" 
            fill="#4b9fe1" 
          />
        )}
        
        {showMinMax && maxIndex !== undefined && (
          <circle 
            cx={maxIndex * (width / (points.length - 1))} 
            cy={height - (points[maxIndex] * height)} 
            r="2" 
            fill="#e15b4b" 
          />
        )}
      </svg>
    </div>
  );
};
```

### 2. Text Rendering (ASCII/Unicode)

```tsx
const SparklineTrendText = ({
  data,
  className = ''
}: SparklineTrendProps) => {
  const { text } = data;
  
  // No data check
  if (!text) {
    return (
      <div className={`sparkline-trend-empty ${className}`} aria-label="No trend data available">
        —
      </div>
    );
  }
  
  return (
    <div 
      className={`sparkline-trend-text ${className}`}
      aria-label={`Trend over time: ${describeTrend(data)}`}
    >
      {text}
    </div>
  );
};

// Helper function to describe trend for screen readers
const describeTrend = (data: SparklineData): string => {
  const { points, min, max } = data;
  if (!points || points.length === 0) return 'No data available';
  
  const first = points[0];
  const last = points[points.length - 1];
  const change = last - first;
  const range = max - min;
  
  let trend = 'Steady';
  if (change > 0.1) trend = 'Increasing';
  if (change > 0.3) trend = 'Strongly increasing';
  if (change < -0.1) trend = 'Decreasing';
  if (change < -0.3) trend = 'Strongly decreasing';
  
  let variability = 'with low variability';
  if (range > 0.5) variability = 'with moderate variability';
  if (range > 0.7) variability = 'with high variability';
  
  return `${trend} ${variability}. Starting at ${formatValue(min + (first * range))}, ending at ${formatValue(min + (last * range))}.`;
};
```

### 3. Combined Component

```tsx
const SparklineTrend = (props: SparklineTrendProps) => {
  const { renderMode = 'svg', data } = props;
  
  if (renderMode === 'text') {
    return <SparklineTrendText data={data} className={props.className} />;
  }
  
  return (
    <SparklineTrendSVG 
      data={data}
      width={props.width}
      height={props.height}
      showEndpoints={props.showEndpoints}
      showMinMax={props.showMinMax}
      className={props.className}
    />
  );
};
```

---

## Data Generation

The SparklineTrend requires properly formatted data. Here's a utility function to generate SparklineData:

```ts
/**
 * Generate sparkline data from raw time series
 * @param values Array of {timestamp, value} data points
 * @param options Configuration options
 * @returns SparklineData ready for rendering
 */
export function generateSparklineData(
  values: Array<{timestamp: number, value: number}>,
  options: {
    pointCount?: number;
    smoothing?: boolean;
    textSymbols?: string;
  } = {}
): SparklineData {
  // Default options
  const {
    pointCount = 8,
    smoothing = true,
    textSymbols = '▁▂▃▄▅▆▇█'
  } = options;
  
  // Handle empty data
  if (!values || values.length === 0) {
    return {
      points: [],
      min: 0,
      max: 0,
      text: '—'
    };
  }
  
  // Sort by timestamp
  const sorted = [...values].sort((a, b) => a.timestamp - b.timestamp);
  
  // Get min and max values
  const min = Math.min(...sorted.map(v => v.value));
  const max = Math.max(...sorted.map(v => v.value));
  const range = max - min || 1; // Avoid division by zero
  
  // Get timeRange
  const timeRange: [number, number] = [
    sorted[0].timestamp,
    sorted[sorted.length - 1].timestamp
  ];
  
  // Normalize to 0-1 range
  const normalized = sorted.map(v => ({
    timestamp: v.timestamp,
    value: (v.value - min) / range
  }));
  
  // Find min/max indices
  const minIndex = sorted.findIndex(v => v.value === min);
  const maxIndex = sorted.findIndex(v => v.value === max);
  
  // Resample to desired point count if we have more points than needed
  let resampledPoints: number[];
  if (normalized.length <= pointCount) {
    resampledPoints = normalized.map(v => v.value);
  } else {
    resampledPoints = resamplePoints(normalized, pointCount, smoothing);
  }
  
  // Generate text representation
  const text = generateTextSparkline(resampledPoints, textSymbols);
  
  return {
    points: resampledPoints,
    min,
    max,
    minIndex: minIndex >= 0 ? minIndex : undefined,
    maxIndex: maxIndex >= 0 ? maxIndex : undefined,
    text,
    timeRange
  };
}

/**
 * Resample time series data to a specified number of points
 */
function resamplePoints(
  normalized: Array<{timestamp: number, value: number}>,
  pointCount: number,
  smoothing: boolean
): number[] {
  const result: number[] = [];
  const timeStart = normalized[0].timestamp;
  const timeEnd = normalized[normalized.length - 1].timestamp;
  const timeRange = timeEnd - timeStart;
  
  // Generate evenly spaced time points
  for (let i = 0; i < pointCount; i++) {
    const targetTime = timeStart + (i / (pointCount - 1)) * timeRange;
    
    // Find nearest points
    let lowerIndex = 0;
    while (lowerIndex < normalized.length - 1 && 
           normalized[lowerIndex + 1].timestamp <= targetTime) {
      lowerIndex++;
    }
    
    const upperIndex = Math.min(lowerIndex + 1, normalized.length - 1);
    
    // Simple linear interpolation
    if (lowerIndex === upperIndex || !smoothing) {
      result.push(normalized[lowerIndex].value);
    } else {
      const lowerTime = normalized[lowerIndex].timestamp;
      const upperTime = normalized[upperIndex].timestamp;
      const timeFraction = (targetTime - lowerTime) / (upperTime - lowerTime);
      
      const lowerValue = normalized[lowerIndex].value;
      const upperValue = normalized[upperIndex].value;
      const interpolatedValue = lowerValue + timeFraction * (upperValue - lowerValue);
      
      result.push(interpolatedValue);
    }
  }
  
  return result;
}

/**
 * Generate ASCII/Unicode text representation of sparkline
 */
function generateTextSparkline(values: number[], symbols: string): string {
  if (!values || values.length === 0) return '—';
  
  // Quantize values to symbol indices
  return values.map(value => {
    const index = Math.min(
      Math.floor(value * symbols.length),
      symbols.length - 1
    );
    return symbols[index];
  }).join('');
}
```

---

## Accessibility Considerations

The SparklineTrend component includes several accessibility features:

1. **Descriptive Text**
   - ARIA labels describe the trend for screen readers
   - Text alternatives include direction and magnitude
   - Important points (min/max) are described

2. **Color Considerations**
   - Uses the currentColor for theming compatibility
   - Sufficient contrast for path and points
   - Additional visual cues beyond just color

3. **Keyboard Focus**
   - Component is not focusable by default (presentational)
   - When interactive features are added, proper focus management is implemented
   - Tooltips are keyboard accessible

4. **Screen Reader Support**
   - SVG has appropriate role and aria attributes
   - Trend description is generated automatically
   - Numerical information available as an alternative

---

## Usage Examples

### Basic Usage

```tsx
const trendData = generateSparklineData([
  { timestamp: Date.now() - 600000, value: 10 },
  { timestamp: Date.now() - 540000, value: 12 },
  { timestamp: Date.now() - 480000, value: 15 },
  { timestamp: Date.now() - 420000, value: 13 },
  { timestamp: Date.now() - 360000, value: 18 },
  { timestamp: Date.now() - 300000, value: 20 },
  { timestamp: Date.now() - 240000, value: 22 },
  { timestamp: Date.now() - 180000, value: 19 },
  { timestamp: Date.now() - 120000, value: 25 },
  { timestamp: Date.now() - 60000, value: 30 },
  { timestamp: Date.now(), value: 35 }
]);

<div className="detail-row">
  <span className="trend-label">📈 Mini-Trend (last 10m):</span>
  <SparklineTrend
    data={trendData}
    width={100}
    height={20}
    showEndpoints={true}
    showMinMax={true}
  />
</div>
```

### Text-Only Mode

```tsx
<div className="detail-row text-only">
  <span className="trend-label">Trend (last 10m):</span>
  <SparklineTrend
    data={trendData}
    renderMode="text"
    className="font-mono"
  />
</div>
```

### With Tooltips

```tsx
<div className="detail-row">
  <span className="trend-label">📈 Mini-Trend (last 10m):</span>
  <Tooltip
    content={
      <div>
        <div>Min: {formatValue(trendData.min)}</div>
        <div>Max: {formatValue(trendData.max)}</div>
        <div>Start: {formatTimestamp(trendData.timeRange[0])}</div>
        <div>End: {formatTimestamp(trendData.timeRange[1])}</div>
      </div>
    }
  >
    <SparklineTrend
      data={trendData}
      width={100}
      height={20}
      showEndpoints={true}
      showMinMax={true}
    />
  </Tooltip>
</div>
```

### Dynamic Updates

```tsx
// In a component with useEffect for updates
const [trendData, setTrendData] = useState<SparklineData | null>(null);

useEffect(() => {
  // Initial load
  updateTrendData();
  
  // Update every 60 seconds
  const interval = setInterval(updateTrendData, 60000);
  return () => clearInterval(interval);
}, [metricKey, seriesKey]);

const updateTrendData = async () => {
  try {
    const newData = await requestTrendData(metricKey, seriesKey, {
      timeRange: [Date.now() - 600000, Date.now()],
      pointCount: 10
    });
    
    setTrendData(newData);
  } catch (error) {
    console.error('Failed to update trend data:', error);
  }
};

// In the render
{trendData ? (
  <SparklineTrend data={trendData} width={100} height={20} />
) : (
  <div className="sparkline-placeholder">Loading...</div>
)}
```