# 86 · ui-AttributeTreeExplorer
_A micro-component in the **UI layer** for exploring metric dimensions_

---

## Responsibility

* Visualize the hierarchical structure of metric dimensions (Resource → Scope → DataPoint attributes)
* Provide interactive exploration of attribute key-value pairs with heat map visualization
* Display series count and cardinality impact for each attribute value
* Support filtering, comparison, and pivoting operations
* Show change indicators between snapshots for attribute stability

---

## Visual Design

```text
 Resource ⤵ (2 attributes, 48 series impacted by this group)
 ├─ host.name            = "alpha"   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  42 srs  (stable)
 └─ process.pid          = 4321      ▒▒▒▒                6 srs  (new in B) ❗

 Scope ⤵ (1 attribute, 128 series)
 └─ io.opentelemetry.runtime 1.18.0

 DataPoint Attributes (drill-down) ⤵ (showing top 3 by series count)
 ├─ state = user          ████████████████████  87 srs (68%)  Δ +5 srs
 ├─ state = system        ████              23 srs (18%)  Δ -2 srs
 └─ state = idle          ██                18 srs (14%)  (stable)
 [Show all 7 attributes...]
```

This component appears within the DimensionalExplorer and provides a hierarchical view of:
- Resource attributes (host.name, process.pid)
- Scope attributes (instrumentation library)
- DataPoint attributes (state, environment, etc.)
- Heat maps to visualize series distribution
- Change indicators between snapshots

---

## Props

```ts
export interface AttributeTreeExplorerProps {
  dimensionalData: DimensionalData;    // Hierarchical attribute data
  selectedPath?: string[];             // Currently selected attribute path
  filterText?: string;                 // Optional filter to apply
  onSelect: (path: string[]) => void;  // Handler for attribute selection
  onAddToComparison: (path: string[]) => void; // Handler for comparison
  className?: string;                  // Additional CSS classes
}

interface DimensionalData {
  resource: AttributeGroup;           // Resource attributes
  scope: AttributeGroup;              // Scope attributes
  dataPoint: AttributeGroup;          // DataPoint attributes
  totalSeries: number;                // Total series for this metric
  seriesDelta?: number;               // Change in series count vs baseline
}

interface AttributeGroup {
  attributes: Record<string, AttributeValues>; // Key-value mapping
  totalAttributes: number;                     // Total attributes in group
  totalSeriesImpact: number;                   // Total series affected by group
}

interface AttributeValues {
  values: Record<string, AttributeValueStats>; // Stats for each value
  totalUniqueValues: number;                   // Count of unique values
  totalSeriesImpact: number;                   // Total series with this attribute
  changeStatus?: 'new' | 'removed' | 'modified' | 'stable'; // Status vs baseline
}

interface AttributeValueStats {
  value: string;                      // Attribute value
  seriesCount: number;                // Number of series with this value
  percentage: number;                 // Percentage of total series (0-1)
  delta?: number;                     // Change in series count vs baseline
  changeStatus?: 'new' | 'removed' | 'stable'; // Status vs baseline
}
```

---

## States

The tree explorer can exist in several states:

1. **Expanded State**
   - All attribute groups are visible
   - Individual attributes can be expanded/collapsed
   - Heat bars and series counts visible

2. **Filtered State**
   - Only attributes matching the filter are visible
   - Filter can match keys or values
   - Non-matching branches are hidden

3. **Selected State**
   - A specific attribute value is selected
   - Visually highlighted in the tree
   - Details available in related components

4. **Comparison State**
   - Change indicators visible for attributes and values
   - delta values (`Δ +5 srs`) show differences
   - Status indicators show new, removed, or stable state

---

## Render Structure (JSX)

```tsx
<div className="attribute-tree-explorer" role="tree" aria-label="Metric Dimension Tree">
  {/* Resource Attributes */}
  <div className="attribute-group" role="treeitem" aria-expanded={isResourceExpanded}>
    <button
      className="group-header"
      onClick={() => toggleGroup('resource')}
      aria-label={`Resource attributes (${dimensionalData.resource.totalAttributes} attributes, ${dimensionalData.resource.totalSeriesImpact} series)`}
    >
      <span className="group-arrow">{isResourceExpanded ? '⤵' : '▶'}</span>
      <span className="group-title">Resource</span>
      <span className="group-stats">
        ({dimensionalData.resource.totalAttributes} attributes, {dimensionalData.resource.totalSeriesImpact} series impacted by this group)
      </span>
    </button>
    
    {isResourceExpanded && (
      <div className="attribute-list" role="group">
        {Object.entries(dimensionalData.resource.attributes)
          .filter(([key, _]) => matchesFilter(key, filterText))
          .map(([key, attr]) => (
            <AttributeItems
              key={`resource.${key}`}
              groupType="resource"
              attributeKey={key}
              attributeValues={attr}
              selectedPath={selectedPath}
              totalSeries={dimensionalData.totalSeries}
              onSelect={onSelect}
              onAddToComparison={onAddToComparison}
            />
          ))}
      </div>
    )}
  </div>
  
  {/* Scope Attributes */}
  <div className="attribute-group" role="treeitem" aria-expanded={isScopeExpanded}>
    <button
      className="group-header"
      onClick={() => toggleGroup('scope')}
      aria-label={`Scope attributes (${dimensionalData.scope.totalAttributes} attributes, ${dimensionalData.scope.totalSeriesImpact} series)`}
    >
      <span className="group-arrow">{isScopeExpanded ? '⤵' : '▶'}</span>
      <span className="group-title">Scope</span>
      <span className="group-stats">
        ({dimensionalData.scope.totalAttributes} attributes, {dimensionalData.scope.totalSeriesImpact} series)
      </span>
    </button>
    
    {isScopeExpanded && (
      <div className="attribute-list" role="group">
        {Object.entries(dimensionalData.scope.attributes)
          .filter(([key, _]) => matchesFilter(key, filterText))
          .map(([key, attr]) => (
            <AttributeItems
              key={`scope.${key}`}
              groupType="scope"
              attributeKey={key}
              attributeValues={attr}
              selectedPath={selectedPath}
              totalSeries={dimensionalData.totalSeries}
              onSelect={onSelect}
              onAddToComparison={onAddToComparison}
            />
          ))}
      </div>
    )}
  </div>
  
  {/* DataPoint Attributes */}
  <div className="attribute-group" role="treeitem" aria-expanded={isDataPointExpanded}>
    <button
      className="group-header"
      onClick={() => toggleGroup('dataPoint')}
      aria-label={`DataPoint attributes (${dimensionalData.dataPoint.totalAttributes} attributes, showing top ${visibleDataPointAttributes} by series count)`}
    >
      <span className="group-arrow">{isDataPointExpanded ? '⤵' : '▶'}</span>
      <span className="group-title">DataPoint Attributes (drill-down)</span>
      <span className="group-stats">
        (showing top {visibleDataPointAttributes} by series count)
      </span>
    </button>
    
    {isDataPointExpanded && (
      <div className="attribute-list" role="group">
        {topDataPointAttributes
          .filter(([key, _]) => matchesFilter(key, filterText))
          .map(([key, attr]) => (
            <AttributeItems
              key={`dataPoint.${key}`}
              groupType="dataPoint"
              attributeKey={key}
              attributeValues={attr}
              selectedPath={selectedPath}
              totalSeries={dimensionalData.totalSeries}
              onSelect={onSelect}
              onAddToComparison={onAddToComparison}
            />
          ))}
          
        {hasMoreDataPointAttributes && (
          <button 
            className="show-more-button"
            onClick={showAllDataPointAttributes}
            aria-label={`Show all ${dimensionalData.dataPoint.totalAttributes} attributes`}
          >
            [Show all {dimensionalData.dataPoint.totalAttributes} attributes...]
          </button>
        )}
      </div>
    )}
  </div>
</div>
```

### AttributeItems Component

```tsx
const AttributeItems = ({
  groupType,
  attributeKey,
  attributeValues,
  selectedPath,
  totalSeries,
  onSelect,
  onAddToComparison
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Sort values by series count (descending)
  const sortedValues = Object.entries(attributeValues.values)
    .sort(([, a], [, b]) => b.seriesCount - a.seriesCount);
  
  return (
    <div className="attribute-item" role="treeitem" aria-expanded={isExpanded}>
      <button
        className="attribute-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={`Attribute ${attributeKey} (${attributeValues.totalUniqueValues} unique values)`}
      >
        <span className="attribute-arrow">{isExpanded ? '▼' : '▶'}</span>
        <span className="attribute-name">{attributeKey}</span>
      </button>
      
      {isExpanded && (
        <div className="attribute-values" role="group">
          {sortedValues.map(([value, stats]) => {
            const path = [groupType, attributeKey, value];
            const isSelected = arePathsEqual(path, selectedPath);
            const changeIndicator = getChangeIndicator(stats);
            
            return (
              <div 
                key={`${groupType}.${attributeKey}.${value}`}
                className={`attribute-value-item ${isSelected ? 'selected' : ''}`}
                role="treeitem"
              >
                <div 
                  className="attribute-value"
                  onClick={() => onSelect(path)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelect(path);
                      e.preventDefault();
                    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
                      onAddToComparison(path);
                      e.preventDefault();
                    }
                  }}
                  tabIndex={0}
                  aria-selected={isSelected}
                >
                  <span className="value-connector">{isSelected ? '■' : '├─'}</span>
                  <span className="value-name">{attributeKey}</span>
                  <span className="value-equals">=</span>
                  <span className="value-value">"{value}"</span>
                  
                  <div className="heat-bar-container">
                    <div 
                      className="heat-bar" 
                      style={{ width: `${stats.percentage * 100}%` }}
                      title={`${stats.percentage * 100}% of total series`}
                      aria-hidden="true"
                    />
                  </div>
                  
                  <span className="series-count">
                    {stats.seriesCount} srs ({Math.round(stats.percentage * 100)}%)
                  </span>
                  
                  {changeIndicator && (
                    <span className={`change-indicator ${changeIndicator.type}`} aria-label={changeIndicator.ariaLabel}>
                      {changeIndicator.text}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper function to generate change indicators
const getChangeIndicator = (stats) => {
  if (!stats.changeStatus && !stats.delta) return null;
  
  if (stats.changeStatus === 'new') {
    return {
      text: '(new in B) ❗',
      type: 'new',
      ariaLabel: 'New in current snapshot'
    };
  }
  
  if (stats.changeStatus === 'removed') {
    return {
      text: '(removed in B) ❗',
      type: 'removed',
      ariaLabel: 'Removed in current snapshot'
    };
  }
  
  if (stats.changeStatus === 'stable') {
    return {
      text: '(stable)',
      type: 'stable',
      ariaLabel: 'Stable between snapshots'
    };
  }
  
  if (stats.delta) {
    const prefix = stats.delta > 0 ? '+' : '';
    return {
      text: `Δ ${prefix}${stats.delta} srs`,
      type: stats.delta > 0 ? 'increased' : 'decreased',
      ariaLabel: `${Math.abs(stats.delta)} series ${stats.delta > 0 ? 'added' : 'removed'}`
    };
  }
  
  return null;
};
```

---

## Implementation Notes

### Data Preparation

Before rendering, the raw data is transformed into a hierarchical structure:

1. **Grouping**
   - Attributes are grouped by their source (Resource, Scope, DataPoint)
   - Within groups, attributes are organized by key
   - Values within each key are sorted by series count

2. **Calculation**
   - Series counts and percentages are pre-calculated
   - Heat bar widths derived from percentage (0-100%)
   - Change indicators determined by comparing snapshots

3. **Filtering**
   - Filtering is applied during rendering
   - Matches can be on attribute keys or values
   - Case-insensitive partial matching supported
   - Path-based filtering (e.g., "resource.host.name:alpha")

### Interaction Handling

The tree supports rich interaction patterns:

1. **Selection**
   - Click on attribute value selects it
   - Selected state passed to parent components
   - Keyboard accessible with Enter/Space

2. **Comparison**
   - Ctrl+Click adds to comparison set
   - Multiple values can be compared
   - Comparison state is managed externally

3. **Expansion**
   - Groups and attributes can expand/collapse
   - State is maintained internally
   - Keyboard accessible with Enter/Space

### Accessibility

The component is designed with accessibility in mind:

1. **Keyboard Navigation**
   - Full keyboard navigation with arrow keys
   - Enter/Space for selection and expansion
   - Ctrl+Enter for adding to comparison

2. **Screen Reader Support**
   - ARIA roles and attributes for tree structure
   - Meaningful labels for all interactive elements
   - Status announcements for selection and expansion

3. **Semantic Markup**
   - Appropriate roles and structures for tree visualization
   - Proper heading hierarchy
   - Descriptive text for icons and visual elements

### Performance Optimization

The component is optimized for large attribute sets:

1. **Virtualization**
   - For large attribute sets, only visible items are rendered
   - Smooth scrolling through large lists
   - Minimal DOM nodes for optimal performance

2. **Memoization**
   - Component and subcomponents are memoized
   - Sorted and filtered lists are cached
   - Re-rendering only when data or selection changes

3. **Progressive Loading**
   - Initial loading shows limited DataPoint attributes
   - "Show more" functionality for on-demand loading
   - Background calculation for improved responsiveness

---

## Usage Example

```tsx
<AttributeTreeExplorer
  dimensionalData={{
    resource: {
      attributes: {
        'host.name': {
          values: {
            'alpha': { value: 'alpha', seriesCount: 42, percentage: 0.328, changeStatus: 'stable' },
            'beta': { value: 'beta', seriesCount: 22, percentage: 0.172, delta: -3 }
          },
          totalUniqueValues: 2,
          totalSeriesImpact: 64
        },
        'process.pid': {
          values: {
            '4321': { value: '4321', seriesCount: 6, percentage: 0.047, changeStatus: 'new' }
          },
          totalUniqueValues: 1,
          totalSeriesImpact: 6
        }
      },
      totalAttributes: 2,
      totalSeriesImpact: 70
    },
    scope: {
      attributes: {
        'io.opentelemetry.runtime': {
          values: {
            '1.18.0': { value: '1.18.0', seriesCount: 128, percentage: 1.0 }
          },
          totalUniqueValues: 1,
          totalSeriesImpact: 128
        }
      },
      totalAttributes: 1,
      totalSeriesImpact: 128
    },
    dataPoint: {
      attributes: {
        'state': {
          values: {
            'user': { value: 'user', seriesCount: 87, percentage: 0.68, delta: 5 },
            'system': { value: 'system', seriesCount: 23, percentage: 0.18, delta: -2 },
            'idle': { value: 'idle', seriesCount: 18, percentage: 0.14, changeStatus: 'stable' }
          },
          totalUniqueValues: 3,
          totalSeriesImpact: 128
        }
      },
      totalAttributes: 1,
      totalSeriesImpact: 128
    },
    totalSeries: 128,
    seriesDelta: 3
  }}
  selectedPath={['dataPoint', 'state', 'user']}
  filterText=""
  onSelect={handleSelect}
  onAddToComparison={handleAddToComparison}
  className="p-4 border rounded"
/>
```