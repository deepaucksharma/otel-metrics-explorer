# 84 · ui-SchemaInfoStrip
_A micro-component in the **UI layer** for OTLP schema visualization_

---

## Responsibility

* Display complete OTLP schema information for the selected metric
* Provide clear indication of instrument type, unit, temporality, and monotonicity
* Offer contextual help through hover tooltips explaining each schema property
* Present metric description in a human-readable format
* Allow toggling between basic and detailed schema views

---

## Visual Design

```text
Metric • process.cpu.time                                                                   
───────────────────────────────────────────────────────────────────────────────────────────
INSTRUMENT  Sum (Counter)                UNIT   s (seconds)       i⃝ Hover for details      
TEMPORALITY CUMULATIVE                   MONOTONIC  yes                                    
DESCRIPTION  "CPU time consumed by the process"                                             
```

This component provides:
- Metric name with clear typographic hierarchy
- OTLP schema properties in standard terminology
- Contextual help via hover tooltips
- Clear labeling of metric description
- Compact yet comprehensive display of technical metadata

---

## Props

```ts
export interface SchemaInfoStripProps {
  metricKey: string;                     // The selected metric
  metricDefinition: MetricDefinition;    // Metadata for the metric
  showDetailedView?: boolean;            // Whether to show detailed schema view
  onToggleDetailView?: () => void;       // Handler for toggling detail view
  className?: string;                    // Additional CSS classes
}

interface MetricDefinition {
  name: string;                          // Metric name
  description?: string;                  // Optional description
  unit?: string;                         // Unit of measurement
  type: 'gauge' | 'sum' | 'histogram';   // OTLP metric type
  aggregationTemporality?: 'delta' | 'cumulative'; // For sum/histogram
  isMonotonic?: boolean;                 // For sum metrics
  schemaUrl?: string;                    // Optional schema URL
  instrumentType?: string;               // Counter, UpDownCounter, etc.
}
```

---

## EventBus Subscriptions

| Event              | Action                               |
|--------------------|--------------------------------------|
| `ui.metric.select` | Update schema strip with selected metric info |
| `ui.view.toggle`   | Toggle between basic and detailed schema view |

---

## EventBus Emissions

| Event                | Payload                            |
|----------------------|------------------------------------|
| `ui.view.toggle`     | `{ view: 'schema', detailed: boolean }` |
| `ui.help.show`       | `{ topic: string, content: string }` |

---

## States

### View Modes

1. **Basic View**
   - Shows essential schema information (type, unit, description)
   - Compact presentation for at-a-glance understanding

2. **Detailed View**
   - Shows additional schema information (schema URL, exemplar support)
   - Expanded presentation with more technical details
   - Links to semantic conventions if available

### Information States

For each schema property, the component can be in one of these states:

1. **Known Value**
   - Shows the actual value from the metric definition
   - Applies appropriate styling based on the value type

2. **Unknown/Missing Value**
   - Shows "unknown" or "not specified"
   - Uses muted styling to indicate missing information

3. **Help Available**
   - Shows info icon (i⃝) for properties with available explanations
   - Enables hover tooltip with detailed explanation

---

## Render Structure (JSX)

```tsx
<div className="schema-info-strip" role="region" aria-label="Metric Schema Information">
  <div className="metric-header">
    <span className="metric-keyword">Metric •</span>
    <h2 className="metric-name">{metricDefinition.name}</h2>
    
    <button 
      className="view-toggle"
      onClick={onToggleDetailView}
      aria-pressed={showDetailedView}
      aria-label={`Toggle ${showDetailedView ? 'basic' : 'detailed'} schema view`}
    >
      View: [{showDetailedView ? 'Schema+' : 'Basic'}]
    </button>
  </div>
  
  <div className="schema-separator" aria-hidden="true" />
  
  <div className="schema-properties">
    <div className="schema-row">
      <div className="schema-property">
        <span className="property-label">INSTRUMENT</span>
        <span className="property-value">
          {metricDefinition.type === 'sum' && (
            metricDefinition.isMonotonic 
              ? 'Sum (Counter)' 
              : 'Sum (UpDownCounter)'
          )}
          {metricDefinition.type === 'gauge' && 'Gauge'}
          {metricDefinition.type === 'histogram' && 'Histogram'}
        </span>
      </div>
      
      <div className="schema-property">
        <span className="property-label">UNIT</span>
        <span className="property-value">
          {metricDefinition.unit 
            ? `${metricDefinition.unit} ${formatUnitDescription(metricDefinition.unit)}`
            : 'unspecified'
          }
        </span>
        <button 
          className="help-icon" 
          aria-label="Show information about units"
          onMouseEnter={() => handleShowHelp('unit')}
          onFocus={() => handleShowHelp('unit')}
        >
          i⃝
        </button>
      </div>
    </div>
    
    <div className="schema-row">
      <div className="schema-property">
        <span className="property-label">TEMPORALITY</span>
        <span className="property-value">
          {metricDefinition.aggregationTemporality 
            ? metricDefinition.aggregationTemporality.toUpperCase()
            : (metricDefinition.type === 'gauge' ? 'N/A' : 'unspecified')
          }
        </span>
        <button 
          className="help-icon" 
          aria-label="Show information about temporality"
          onMouseEnter={() => handleShowHelp('temporality')}
          onFocus={() => handleShowHelp('temporality')}
        >
          i⃝
        </button>
      </div>
      
      <div className="schema-property">
        <span className="property-label">MONOTONIC</span>
        <span className="property-value">
          {metricDefinition.type === 'sum'
            ? (metricDefinition.isMonotonic ? 'yes' : 'no')
            : 'N/A'
          }
        </span>
      </div>
    </div>
    
    {showDetailedView && (
      <div className="schema-row">
        <div className="schema-property full-width">
          <span className="property-label">SCHEMA URL</span>
          <span className="property-value">
            {metricDefinition.schemaUrl 
              ? (
                <a 
                  href={metricDefinition.schemaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="schema-link"
                >
                  {formatSchemaUrl(metricDefinition.schemaUrl)}
                </a>
              )
              : 'none'
            }
          </span>
        </div>
      </div>
    )}
    
    <div className="schema-row">
      <div className="schema-property full-width">
        <span className="property-label">DESCRIPTION</span>
        <span className="property-value description">
          {metricDefinition.description 
            ? `"${metricDefinition.description}"`
            : 'No description provided'
          }
        </span>
      </div>
    </div>
  </div>
</div>
```

---

## Implementation Notes

### Unit Formatting

- Translates abbreviated units to human-readable form (e.g., "s" → "seconds")
- Handles composite units like "By/s" (bytes per second)
- Follows OTel semantic conventions for unit representation

### Help Content

Help tooltips provide explanations for OTLP concepts:

- **INSTRUMENT**:
  - Gauge: Reports instantaneous measurement values
  - Sum (Counter): Monotonically increasing counter
  - Sum (UpDownCounter): Non-monotonic counter that can increase or decrease
  - Histogram: Reports distribution of values

- **UNIT**:
  - Explains standard OTLP unit format
  - Provides examples of common units (s, ms, By, 1)
  - Lists unit conversion considerations

- **TEMPORALITY**:
  - DELTA: Reports change since last measurement
  - CUMULATIVE: Reports total since reset
  - Explains implications for downstream systems

- **MONOTONIC**:
  - Explains that monotonic metrics only increase (never decrease)
  - Discusses implications for rate calculations and resets

### Schema URL Handling

- Formats schema URLs for display (truncating if necessary)
- Provides direct links to semantic convention documentation
- Offers standardized explanations based on schema namespace

### Accessibility

- ARIA labels for all interactive elements
- Keyboard-accessible help tooltips
- Screen reader announcements for view changes
- Semantic HTML structure with appropriate landmark roles

---

## Usage Example

```tsx
<SchemaInfoStrip
  metricKey="process.cpu.time"
  metricDefinition={{
    name: "process.cpu.time",
    description: "CPU time consumed by the process",
    unit: "s",
    type: "sum",
    aggregationTemporality: "cumulative",
    isMonotonic: true,
    instrumentType: "Counter",
    schemaUrl: "https://opentelemetry.io/schemas/1.9.0"
  }}
  showDetailedView={false}
  onToggleDetailView={handleToggleDetailView}
  className="bg-gray-50 dark:bg-gray-800 rounded-t-lg p-4"
/>
```