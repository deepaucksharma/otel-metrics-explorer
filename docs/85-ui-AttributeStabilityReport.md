# 85 · ui-AttributeStabilityReport
_A micro-component in the **UI layer** for analyzing attribute value stability_

---

## Responsibility

* Analyze and visualize the stability of attribute values across snapshots
* Identify high-churn attributes that contribute to cardinality challenges
* Provide trend information on how attribute values change over time
* Generate recommendations for attribute stabilization
* Support "what-if" scenario modeling for attribute value retention strategies

---

## Visual Design

```text
ATTRIBUTE STABILITY REPORT — process.cpu.time                                   [Export ⬇]
──────────────────────────────────────────────────────────────────────────────────────────
▸ Overview
  • Total attributes analyzed:       7
  • High churn attributes detected:  2
  • Potential cardinality savings:   -42% series (-54 series)
  • Analyzed snapshots:              12 snapshots over 1h

▸ Attribute Churn Analysis (sorted by stability impact)
                                                     
  1. transaction_id                            ⚠ HIGH CHURN
     ├─ Unique values: 98 across snapshots
     ├─ New values per snapshot: ~16.2 (avg), 24 (max)
     ├─ Value lifetime: 87% appear only once
     ├─ Stability score: 0.12/1.0 (lower is less stable)
     ├─ Metric impact: 76% of total series for process.cpu.time
     ├─ Recommendation: Consider dropping this attribute or apply sampling
     └─ [Simulate Impact] [View Value History]

  2. request_id                               ⚠ MEDIUM CHURN
     ├─ Unique values: 43 across snapshots  
     ├─ New values per snapshot: ~7.1 (avg), 12 (max)
     ├─ Value lifetime: 62% appear only once
     ├─ Stability score: 0.41/1.0 (lower is less stable)
     ├─ Metric impact: 33% of total series for process.cpu.time
     ├─ Recommendation: Consider attribute filtering or grouping
     └─ [Simulate Impact] [View Value History]

  3. endpoint                                 ✓ STABLE
     ├─ Unique values: 8 (consistent across snapshots)
     ├─ New values per snapshot: ~0.1 (avg), 1 (max)
     ├─ Value lifetime: 98% appear in multiple snapshots
     ├─ Stability score: 0.97/1.0 (higher is more stable)
     ├─ Metric impact: 6% of total series for process.cpu.time
     └─ [View Value History]

  ... 4 more attributes with stability score > 0.9 [Show All]

▸ Simulation Panel
  Selected attribute(s) to modify: transaction_id
  
  Strategy:
  (•) Drop attribute entirely
  ( ) Group by regex pattern: [                           ]
  ( ) Limit to top N values:  [   ] values, group others as "other"
  
  Projected Impact:
  • Series reduction: -42% (-54 series)
  • Cardinality score improvement: +38% (from 128 to 74 series)
  • Information loss risk: High (due to complete removal)
  
  [Apply to Config] [Reset Simulation]
```

This component provides:
- Overview of attribute stability across metric snapshots
- Detailed analysis of each attribute's churn characteristics
- Recommendations for addressing high-churn attributes
- Interactive simulation for testing cardinality reduction strategies
- Export functionality for sharing analysis results

---

## Props

```ts
export interface AttributeStabilityReportProps {
  metricKey: string;                     // The metric to analyze
  snapshots: ParsedSnapshot[];           // Array of snapshots for analysis
  timeInterval?: number;                 // Time interval between snapshots in seconds
  onSimulateImpact: (attribute: string, strategy: SimulationStrategy) => void; // Handler for simulation
  onViewValueHistory: (attribute: string) => void; // Handler for viewing value history
  onApplyToConfig: (recommendations: RecommendationConfig[]) => void; // Handler for applying to config
  onExport: () => void;                  // Handler for exporting report
  className?: string;                    // Additional CSS classes
}

export interface SimulationStrategy {
  type: 'drop' | 'group' | 'limit';      // Type of strategy
  pattern?: string;                      // Regex pattern for grouping
  limit?: number;                        // Limit for top N values
}

export interface RecommendationConfig {
  attribute: string;                     // Target attribute
  strategy: SimulationStrategy;          // Applied strategy
  impact: {                              // Calculated impact
    seriesReduction: number;             // Absolute reduction
    percentageReduction: number;         // Percentage reduction
    infoLossRisk: 'Low' | 'Medium' | 'High'; // Risk assessment
  };
}
```

---

## EventBus Subscriptions

| Event                    | Action                                   |
|--------------------------|------------------------------------------|
| `ui.view.stability`      | Initialize stability report for selected metric |
| `snapshot.loaded`        | Update analysis with new snapshot data    |
| `simulation.complete`    | Update UI with simulation results         |

---

## EventBus Emissions

| Event                    | Payload                                   |
|--------------------------|-------------------------------------------|
| `simulation.request`     | `{ metricKey: string, attribute: string, strategy: SimulationStrategy }` |
| `ui.view.valueHistory`   | `{ metricKey: string, attribute: string }` |
| `config.recommendation`  | `{ metricKey: string, recommendations: RecommendationConfig[] }` |

---

## States

### Analysis Status

1. **Loading**
   - Initial data gathering and calculation
   - Shows progress indicator

2. **Complete**
   - Full analysis results available
   - All sections populated with data

3. **Error**
   - Analysis failed
   - Shows error message with retry option

### Attribute Categories

Attributes are classified into these stability categories:

1. **High Churn** (Stability score < 0.3)
   - Significant impact on cardinality
   - High percentage of one-time values
   - Strong recommendations for action

2. **Medium Churn** (Stability score 0.3-0.7)
   - Moderate impact on cardinality
   - Some ephemeral values mixed with stable values
   - Recommendations for potential grouping or filtering

3. **Stable** (Stability score > 0.7)
   - Minimal impact on cardinality
   - Consistent values across snapshots
   - No action necessary

### Simulation Mode

When running simulations, the component can be in:

1. **Inactive**
   - No simulation in progress
   - Simulation panel collapsed or hidden

2. **Configuring**
   - User selecting attributes and strategies
   - Simulation panel expanded but no results yet

3. **Results**
   - Simulation complete
   - Impact metrics displayed
   - Apply/Reset options available

---

## Implementation Notes

### Stability Metrics

The component calculates several key metrics for each attribute:

1. **Unique Value Count**
   - Total number of distinct values across all snapshots
   - Indicates overall attribute cardinality

2. **New Values Per Snapshot**
   - Average and maximum number of new values appearing in each snapshot
   - Measures the rate of cardinality growth

3. **Value Lifetime**
   - Percentage of values that appear in only one snapshot
   - High percentage indicates ephemeral values (like UUIDs)

4. **Stability Score**
   - Composite score from 0-1 (higher = more stable)
   - Calculated from value persistence, predictability, and impact

5. **Metric Impact**
   - Percentage of total series affected by this attribute
   - Indicates the priority for optimization

### Recommendation Engine

The component generates recommendations based on:

1. **Attribute Type Detection**
   - Identifies common patterns like UUIDs, timestamps, request IDs
   - Recommends strategies tailored to the attribute type

2. **Value Distribution Analysis**
   - Analyzes value frequency distribution
   - Recommends top-N approach if distribution is heavily skewed

3. **Cardinality Impact Modeling**
   - Projects impact of different strategies on overall cardinality
   - Ranks recommendations by cardinality reduction potential

4. **Information Value Assessment**
   - Evaluates the diagnostic value of the attribute
   - Balances cardinality reduction against information loss

### Simulation Implementation

1. **Strategy Options**
   - Drop: Completely remove the attribute
   - Group: Apply regex grouping for similar values
   - Limit: Keep top N values, group others as "other"

2. **Impact Calculation**
   - Projects series reduction based on snapshots
   - Estimates improvement to overall cardinality score
   - Assesses information loss risk

3. **Visual Feedback**
   - Displays clear before/after metrics
   - Highlights potential information loss concerns
   - Provides option to apply to config generator

### Accessibility

- ARIA labels for all interactive elements
- Screen reader support for data tables and charts
- Keyboard navigation for attribute expansion/collapse
- Focus management during simulation changes

---

## Usage Example

```tsx
<AttributeStabilityReport
  metricKey="process.cpu.time"
  snapshots={allSnapshots}
  timeInterval={300}
  onSimulateImpact={handleSimulateImpact}
  onViewValueHistory={handleViewValueHistory}
  onApplyToConfig={handleApplyToConfig}
  onExport={handleExportReport}
  className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow"
/>
```