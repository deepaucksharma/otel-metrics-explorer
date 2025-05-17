# 82 · ui-DimensionalExplorer
_A micro-component in the **UI layer** for exploring metric dimensions_

---

## Responsibility

* Visualize the hierarchical structure of metric dimensions (Resource → Scope → DataPoint attributes)
* Allow filtering and interactive exploration of attributes
* Highlight cardinality impact with heat maps and series counts
* Show attribute changes between snapshots with visual indicators
* Enable selection of specific attribute combinations for detailed analysis
* Support both tree and flat list views for different exploration styles

---

## Visual Design

```text
RICH DIMENSIONAL EXPLORER (Filter: [state:user...          ]) (Tree | Flat List)             
                                                                               
Resource ⤵ (2 attributes, 48 series impacted by this group)                               
├─ host.name            = "alpha"   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  42 srs  (stable)                    
└─ process.pid          = 4321      ▒▒▒▒                 6 srs  (new in B) ❗             
                                                                               
Scope ⤵ (1 attribute, 128 series)                                                        
└─ io.opentelemetry.runtime 1.18.0                                                          
                                                                               
DataPoint Attributes (drill-down) ⤵ (showing top 3 by series count)                        
├─ state = user          ████████████████████  87 srs (68%)  Δ +5 srs                      
├─ state = system        ████              23 srs (18%)  Δ -2 srs                      
└─ state = idle          ██                18 srs (14%)  (stable)                      
[Show all 7 attributes...]                                                                   
───────────  ← click any leaf to pivot detail | Ctrl+Click to add to comparison  ───────────

⮕  Total Series for "process.cpu.time"            128 (Δ +3 vs A)                           
    •  Avg labels per-series                      3.2 (stable)                              
    •  Attribute with max uniq-values             host.name (32 values)                     
    ⤷  [Open full Cardinality Analyzer]   [View Attribute Stability Report]
```

This component displays:
- A hierarchical tree of Resource, Scope, and DataPoint attributes
- Heat maps indicating cardinality impact
- Series counts for each attribute value
- Change indicators (new, removed, increased, decreased)
- Filter controls for quick attribute filtering
- Toggle between tree and flat list views
- Summary statistics about cardinality
- Links to detailed cardinality analysis

---

## Props

```ts
export interface DimensionalExplorerProps {
  metricKey: string;                     // The selected metric to explore
  activeSnapshot: ParsedSnapshot;        // The active snapshot (B)
  baselineSnapshot?: ParsedSnapshot;     // Optional baseline snapshot (A) for comparison
  onSelectSeries: (seriesKey: string) => void;       // Callback when a series is selected
  onAddToComparison: (seriesKey: string) => void;    // Callback to add to comparison
  onShowAllAttributes: () => void;       // Callback to show all attributes
  onFilterChange: (filter: string) => void;          // Filter change handler
  onViewModeChange: (mode: 'tree' | 'list') => void; // View mode toggle handler
  onViewCardinalityReport: () => void;   // Handler for viewing cardinality report
  onViewStabilityReport: () => void;     // Handler for viewing stability report
  className?: string;                    // Additional CSS classes
}
```

---

## EventBus Subscriptions

| Event                 | Action                              |
|-----------------------|-------------------------------------|
| `snapshot.loaded`     | Update with new snapshot data       |
| `ui.metric.select`    | Load dimensions for selected metric |
| `ui.attribute.filter` | Apply filter to dimensions          |

---

## EventBus Emissions

| Event                | Payload                                          |
|----------------------|--------------------------------------------------|
| `ui.series.select`   | `{ metricKey: string, seriesKey: string }`      |
| `ui.compare.add`     | `{ metricKey: string, seriesKey: string }`      |
| `ui.filter.change`   | `{ filter: string }`                            |
| `ui.view.cardinality`| `{ metricKey: string }`                         |
| `ui.view.stability`  | `{ metricKey: string, attributeKey?: string }`  |

---

## Interface

### Dimension Tree Node

```ts
interface DimensionNode {
  type: 'resource' | 'scope' | 'datapoint';  // Node type
  key: string;                              // Attribute key
  value: string;                            // Attribute value
  seriesCount: number;                      // Number of series with this attribute
  seriesPercentage: number;                 // Percentage of total series
  children?: DimensionNode[];               // Child nodes (for nested attributes)
  changeStatus?: 'new' | 'removed' | 'increased' | 'decreased' | 'stable';  // Change vs baseline
  changeDelta?: number;                     // Change in series count
  heatMapScore: number;                     // 0-1 value for heat map intensity
}
```

### Filter Syntax

The filter input supports a simple query syntax:
- `key:value` - Filter attributes by exact key and value
- `key:*` - Show all values for a specific key
- `*:value` - Show all keys with a specific value
- `key1:value1,key2:value2` - Compound filters (AND)

---

## States and Modes

### View Modes

1. **Tree View**
   - Hierarchical visualization showing the natural OTLP structure
   - Resources → Scopes → DataPoint attributes
   - Collapsible sections for each level

2. **Flat List View**
   - All attributes shown in a flat, sortable list
   - Useful for quickly finding high-impact attributes
   - Can be sorted by key, value, series count, or change status

### Filter States

1. **Unfiltered**
   - Shows all attributes organized by type
   - Limited to showing top N values per attribute (with "Show all" option)

2. **Filtered**
   - Shows only attributes matching the filter criteria
   - Maintains hierarchical structure where possible

3. **Truncated**
   - Shows limited attributes with highest impact
   - "Show all 7 attributes..." control to expand

---

## Render Structure (JSX)

```tsx
<div className="dimensional-explorer" role="region" aria-label="Metric Dimensions Explorer">
  <div className="explorer-header">
    <h3>RICH DIMENSIONAL EXPLORER</h3>
    
    <div className="explorer-controls">
      <div className="filter-control">
        <label htmlFor="dimension-filter" className="sr-only">Filter dimensions</label>
        <input
          id="dimension-filter"
          type="text"
          placeholder="Filter: [state:user...]"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="filter-input"
        />
      </div>
      
      <div className="view-toggle">
        <button
          className={viewMode === 'tree' ? 'active' : ''}
          onClick={() => onViewModeChange('tree')}
          aria-pressed={viewMode === 'tree'}
        >
          Tree
        </button>
        <button
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => onViewModeChange('list')}
          aria-pressed={viewMode === 'list'}
        >
          Flat List
        </button>
      </div>
    </div>
  </div>
  
  <div className="dimension-sections">
    {/* Resource Attributes Section */}
    <div className="dimension-section">
      <div className="section-header">
        <h4>Resource ⤵</h4>
        <span className="section-summary">
          ({resourceAttrs.length} attributes, {resourceSeriesImpact} series impacted by this group)
        </span>
      </div>
      
      <ul className="dimension-list">
        {resourceAttrs.map(attr => (
          <li key={`${attr.key}-${attr.value}`} className="dimension-item">
            <span className="attribute-key">{attr.key}</span>
            <span className="attribute-equals">=</span>
            <span className="attribute-value">"{attr.value}"</span>
            
            <div 
              className="heat-map" 
              style={{ width: `${attr.heatMapScore * 100}%` }}
              aria-label={`Heat map: ${Math.round(attr.heatMapScore * 100)}% impact`}
            />
            
            <span className="series-count">
              {attr.seriesCount} srs
            </span>
            
            <span className={`change-indicator ${attr.changeStatus}`}>
              {renderChangeIndicator(attr.changeStatus, attr.changeDelta)}
            </span>
          </li>
        ))}
      </ul>
    </div>
    
    {/* Similar sections for Scope and DataPoint Attributes */}
    
    {isTruncated && (
      <button 
        className="show-all-button"
        onClick={onShowAllAttributes}
      >
        [Show all {totalAttributeCount} attributes...]
      </button>
    )}
    
    <div className="interaction-hint">
      ─── click any leaf to pivot detail | Ctrl+Click to add to comparison ───
    </div>
  </div>
  
  <div className="cardinality-summary">
    <div className="summary-header">
      ⮕ Total Series for "{metricName}"
      <span className="series-total">
        {totalSeries} {baselineSnapshot && `(Δ ${seriesDelta > 0 ? '+' : ''}${seriesDelta} vs A)`}
      </span>
    </div>
    
    <div className="summary-stats">
      <div className="stat-item">
        • Avg labels per-series
        <span className="stat-value">
          {avgLabelsPerSeries.toFixed(1)} {changeStatus === 'stable' ? '(stable)' : ''}
        </span>
      </div>
      
      <div className="stat-item">
        • Attribute with max uniq-values
        <span className="stat-value">
          {maxCardinalityAttr} ({maxCardinalityCount} values)
        </span>
      </div>
    </div>
    
    <div className="report-links">
      <button onClick={onViewCardinalityReport}>
        [Open full Cardinality Analyzer]
      </button>
      <button onClick={onViewStabilityReport}>
        [View Attribute Stability Report]
      </button>
    </div>
  </div>
</div>
```

---

## Implementation Notes

### Heat Map Visualization

- Heat maps are rendered as background bars with width proportional to impact
- Color intensity correlates with series count / percentage
- Accessibility considerations include proper aria attributes and contrasting colors

### Change Indicators

- Visual indicators show changes between snapshots:
  - `(new in B) ❗` for newly appeared attributes
  - `(removed from B)` for attributes no longer present
  - `Δ +5 srs` for increased series count
  - `Δ -2 srs` for decreased series count
  - `(stable)` for unchanged attributes

### Performance Optimizations

- Virtualized rendering for large attribute lists
- Intelligent truncation with "show more" functionality
- Memoization of dimension calculations
- Debounced filtering to prevent excessive re-renders

### Accessibility

- ARIA labels for heat maps and interactive elements
- Keyboard navigation for tree exploration
- Focus management for selection
- Screen reader announcements for changes in filter or selection

---

## Usage Example

```tsx
<DimensionalExplorer
  metricKey="process.cpu.time"
  activeSnapshot={currentSnapshot}
  baselineSnapshot={previousSnapshot}
  onSelectSeries={handleSeriesSelect}
  onAddToComparison={handleAddToComparison}
  onShowAllAttributes={handleShowAllAttributes}
  onFilterChange={handleFilterChange}
  onViewModeChange={handleViewModeChange}
  onViewCardinalityReport={handleViewCardinalityReport}
  onViewStabilityReport={handleViewStabilityReport}
  className="border rounded-lg p-4"
/>
```