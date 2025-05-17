# 85 · ui-ActionFooter
_A micro-component in the **UI layer** for contextual metric actions_

---

## Responsibility

* Provide a set of contextual actions based on the selected metric and series
* Enable quick access to related functionality and documentation
* Support dynamic action generation based on metric properties
* Provide consistent action presentation with clear visual hierarchy
* Handle action triggers and event emissions

---

## Visual Design

```text
────────────────────────────────────────── ACTIONS ───────────────────────────────────────────
 [Show Metric Definition Over Time] [Inspect Sibling Series] [Open OTEL Docs for process.cpu.time]
```

This component appears at the bottom of the MetricInstanceWidget and provides:
- A collection of action buttons relevant to the current context
- Clear labeling for each action with consistent styling
- Dynamic actions based on metric type and selected series
- Separation from the main content with a visual divider

---

## Props

```ts
export interface ActionFooterProps {
  metricKey: string;                  // Unique metric identifier
  metricDefinition: MetricDefinition; // Metric schema information
  selectedSeriesPath?: string[];      // Currently selected attribute path
  className?: string;                 // Additional CSS classes
}
```

---

## EventBus Emissions

| Event                     | Payload                                      |
|---------------------------|----------------------------------------------|
| `ui.definition.history`   | `{ metricKey: string }`                      |
| `ui.inspect.siblings`     | `{ metricKey: string, attributePath: string[] }` |
| `ui.docs.open`            | `{ metricKey: string, metricType: string }`  |
| `ui.whatif.simulate`      | `{ metricKey: string, attributePath: string[] }` |
| `ui.config.generate`      | `{ metricKey: string }`                      |

---

## States

The action footer generates different sets of actions based on context:

1. **Basic Metric Actions**
   - Show metric definition history
   - Open OTel documentation for the metric type
   - Available regardless of selection state

2. **Selected Series Actions**
   - Inspect sibling series (same attribute, different values)
   - Simulate attribute dropping (cardinality analysis)
   - Only available when a specific series is selected

3. **Type-Specific Actions**
   - Counter metrics: Analyze reset patterns
   - Histogram metrics: Bucket distribution analysis
   - Only available for relevant metric types

4. **Data Quality Actions**
   - View exemplar coverage
   - Analyze missing data points
   - Available when data quality information exists

---

## Render Structure (JSX)

```tsx
<div className="action-footer" role="region" aria-label="Metric Actions">
  <div className="action-divider" aria-hidden="true">
    {/* Visual separator */}
    ACTIONS
  </div>
  
  <div className="action-buttons">
    {/* Core actions - always available */}
    <button 
      className="action-button"
      onClick={handleShowDefinitionHistory}
      aria-label="Show metric definition history over time"
    >
      [Show Metric Definition Over Time]
    </button>
    
    <button 
      className="action-button"
      onClick={handleOpenOtelDocs}
      aria-label={`Open OpenTelemetry documentation for ${metricDefinition.name}`}
    >
      [Open OTEL Docs for {metricDefinition.name}]
    </button>
    
    {/* Series-specific actions */}
    {selectedSeriesPath && (
      <button 
        className="action-button"
        onClick={handleInspectSiblings}
        aria-label="Inspect sibling series with the same attributes"
      >
        [Inspect Sibling Series]
      </button>
    )}
    
    {/* Type-specific actions */}
    {metricDefinition.type === 'histogram' && (
      <button 
        className="action-button"
        onClick={handleViewDistribution}
        aria-label="View histogram bucket distribution"
      >
        [View Bucket Distribution]
      </button>
    )}
    
    {isCounterMetric && (
      <button 
        className="action-button"
        onClick={handleAnalyzeResets}
        aria-label="Analyze counter reset patterns"
      >
        [Analyze Reset Patterns]
      </button>
    )}
    
    {/* Cardinality actions */}
    {selectedSeriesPath && selectedSeriesPath.length > 0 && (
      <button 
        className="action-button"
        onClick={handleSimulateAttributeDrop}
        aria-label="Simulate cardinality impact of dropping this attribute"
      >
        [Simulate Dropping {selectedSeriesPath[selectedSeriesPath.length - 2]}]
      </button>
    )}
    
    {/* Configuration actions */}
    <button 
      className="action-button"
      onClick={handleGenerateConfig}
      aria-label="Generate OpenTelemetry collector configuration"
    >
      [Generate Collector Config]
    </button>
    
    {/* Dynamically generated additional actions based on context */}
    {dynamicActions.map((action, index) => (
      <button 
        key={index}
        className="action-button"
        onClick={() => handleDynamicAction(action)}
        aria-label={action.ariaLabel}
      >
        [{action.label}]
      </button>
    ))}
  </div>
</div>
```

---

## Implementation Notes

### Action Generation

- Actions are dynamically generated based on metric type, selection state, and available data
- Core actions are always present for consistency
- Dynamic actions are added based on contextual relevance
- Actions are ordered by relevance and frequency of use

### Event Handling

- Each action triggers a specific event on the EventBus
- Events include relevant context (metric key, series key, etc.)
- Actions may also trigger direct callbacks for immediate UI updates

### Visual Design

- Actions use consistent button styling with square brackets for visual grouping
- Hover and focus states provide clear feedback
- Disabled actions are visually distinct but still visible
- On smaller screens, actions wrap to multiple rows with consistent spacing

### Extensibility

- New actions can be registered based on metric properties
- Plugin architecture allows adding domain-specific actions
- Custom action handlers can be registered for specialized functionality

### Accessibility

- All action buttons have appropriate ARIA labels
- Keyboard navigation follows logical order
- Focus states are clearly visible
- Screen readers announce action text and purpose

---

## Usage Example

```tsx
<ActionFooter
  metricKey="process.cpu.time"
  metricDefinition={{
    name: 'process.cpu.time',
    type: 'sum',
    description: 'CPU time consumed by the process',
    unit: 's',
    isMonotonic: true,
    temporality: 'cumulative'
  }}
  selectedSeriesPath={['resource', 'host.name', 'alpha', 'dataPoint', 'state', 'user']}
  className="mt-4 pt-2 border-t"
/>
```