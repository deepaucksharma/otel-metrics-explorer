# Metric Card Component

## Overview

The Metric Card Component is a core UI element in the OTLP Process Metrics Explorer that displays comprehensive information about a single metric. It serves as both a summary view and an expandable detailed view of metric data, attributes, and metadata.

## Responsibilities

1. Display essential metric metadata (name, description, unit, type)
2. Visualize metric values appropriately based on the metric type
3. Show attribute distribution and cardinality information
4. Provide expandable sections for detailed exploration
5. Enable comparison between two metric snapshots
6. Highlight potential issues or optimization opportunities
7. Offer contextual actions for further analysis

## Component Structure

```typescript
interface MetricCardProps {
  metricId: string;
  snapshotId: string;
  comparisonSnapshotId?: string;
  initiallyExpanded?: boolean;
  showCardinality?: boolean;
  onSelectForAnalysis?: (metricId: string) => void;
}

interface MetricCardState {
  isExpanded: boolean;
  selectedTab: 'overview' | 'attributes' | 'datapoints' | 'recommendations';
  showRawData: boolean;
}
```

## Visual Design

The Metric Card has a responsive layout with the following sections:

### Header Section
- Metric name (with copy button)
- Metric type badge (gauge, counter, histogram, etc.)
- Unit display (if available)
- Temporality indicator (delta/cumulative)
- Actions menu (expand, analyze, export)

### Summary Section
- Brief description (truncated with expand option)
- Key statistics appropriate to the metric type:
  - Gauge: current value, min, max
  - Counter: total, rate of change
  - Histogram: count, sum, quantiles
- Mini-visualization appropriate to the metric type
- Attribute cardinality summary (if enabled)

### Expanded Detail Section
With tabs for:

1. **Overview**: Comprehensive metadata and statistics
2. **Attributes**: Interactive attribute analysis and distribution
3. **Data Points**: Paginated table of individual data points
4. **Recommendations**: Suggestions for optimization (if available)

## Visualization Strategy

The component adapts its visualization based on the metric type:

- **Gauge**: Circular or linear gauge showing current value and range
- **Counter**: Trend line with delta indicators
- **Histogram**: Mini-histogram showing distribution buckets
- **Summary**: Quantile visualization with markers

For comparison view, side-by-side or overlay visualizations are used with clear delta indicators.

## Interaction Patterns

- Click/tap header to expand/collapse detail view
- Tab navigation for detailed sections
- Hover tooltips for additional information
- Context menu for actions (analyze, export, pin)
- Click on attributes to filter/group by that attribute
- Toggle switches for different visualization modes

## State Management

The component maintains minimal local state, mainly for UI interactions:
- Expanded/collapsed state
- Active tab selection
- Visualization preferences

Core metric data is sourced from the global state store, ensuring consistency across the application.

## Accessibility Considerations

- All interactive elements are keyboard accessible
- Proper ARIA attributes for expandable sections
- Screen reader announcements for metric changes
- Color schemes that work with various forms of color blindness
- Text alternatives for all visualizations

## Performance Optimizations

- Lazy loading of detailed sections
- Virtualized lists for data points and high-cardinality attributes
- Memoization of computed values and renderers
- Throttled updates for rapidly changing metrics
- Progressive loading indicators for complex visualizations

## Example Usage

```tsx
// In a metric list component
function MetricList({ snapshotId, comparisonSnapshotId }) {
  const metrics = useMetricsFromSnapshot(snapshotId);
  const [selectedMetricId, setSelectedMetricId] = useState(null);
  
  return (
    <div className="metric-list">
      {metrics.map(metric => (
        <MetricCard
          key={metric.id}
          metricId={metric.id}
          snapshotId={snapshotId}
          comparisonSnapshotId={comparisonSnapshotId}
          initiallyExpanded={metric.id === selectedMetricId}
          showCardinality={true}
          onSelectForAnalysis={setSelectedMetricId}
        />
      ))}
    </div>
  );
}
```

## Event Handling

The component listens for and emits the following events:

- Listens for `snapshot.loaded` to refresh data
- Listens for `metric.selected` to expand when selected elsewhere
- Emits `metric.analyzed` when detailed analysis is requested
- Emits `metric.visualize` when a specialized visualization is requested

## Dependencies

- MetricData service: For accessing metric data from the state
- AttributeAnalyzer: For attribute distribution analysis
- VisualizationFactory: For generating appropriate visualizations
- CardinalityService: For accessing cardinality information
- RecommendationEngine: For optimization suggestions

The Metric Card Component serves as the central unit of the metrics exploration interface, balancing information density with clarity and providing contextually appropriate visualizations and actions.
