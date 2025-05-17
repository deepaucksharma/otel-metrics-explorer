# 83 · ui-SeriesDetailPane
_A micro-component in the **UI layer** for detailed series analysis_

---

## Responsibility

* Display comprehensive details for a selected metric series
* Show current values, delta, and rate information with appropriate context
* Visualize recent trends with mini-sparklines
* Provide contribution and comparison statistics
* Display humanized/formatted views of technical values
* Show linked exemplars from the data point
* Provide access to raw OTLP JSON for inspection

---

## Visual Design

```text
DETAIL PANE (Selected: host.name="alpha", state="user")   [Pin Series] [Compare Series]     
                                                                                              
▸ Current Value (Snapshot B)        801.2 s      📈 Mini-Trend (last 10m):  ▂▃▄▅▆▇          
  Delta vs A                         +75.3 s  ▲                                             
  Rate / s (over Δ)                  0.251 s/s                                              
                                                                                              
▸ Contribution & Comparison (for "state=user" on "alpha")                                  
  – % of total "process.cpu.time" on "alpha": 55% (B) vs 52% (A)                           
  – % of total "state=user" across all hosts: 30% (B) vs 28% (A)                           
                                                                                              
▸ Humanised Views                                                                          
  – Seconds ➜ HH:MM:SS          00:13:21                                                     
  – % CPU (1 core, process uptime if avail.)   25.1 % (estimate)                           
                                                                                              
▸ Linked Exemplars (Snapshot B) (2 found)                                                  
  – traceID: a3f7b2... spanID: c4d8e1... val: 0.8s @14:37:05Z {http.route:"/api/data"}   [↗] 
  – traceID: b9c2e0... spanID: d1e5f2... val: 0.6s @14:36:50Z {db.statement:"SELECT..."} [↗] 
                                                                                              
▸ Raw OTLP JSON (⬈ copy)  (Point B | Point A | Diff)                                       
  { "timeUnixNano":"172883...", "value":801.2, "attrs":{...}, "exemplars": [...] }
```

This component provides:
- Current value with units, delta, and rate calculations
- Mini-trend sparkline for quick visualization of recent changes
- Contribution analysis showing percentage of total within specified contexts
- Humanized views that translate technical values into user-friendly formats
- Exemplar links for trace correlation
- Raw JSON access with comparison and diff views

---

## Props

```ts
export interface SeriesDetailPaneProps {
  metricKey: string;                     // The selected metric
  seriesKey: string;                     // The selected series
  activeSnapshot: ParsedSnapshot;        // The active snapshot (B)
  baselineSnapshot?: ParsedSnapshot;     // Optional baseline snapshot (A) for comparison
  timeInterval?: number;                 // Time interval between snapshots in seconds
  historicalData?: TimeseriesPoint[];    // Optional historical data for mini-trend
  exemplars?: Exemplar[];                // Optional exemplars for the series
  isPinned?: boolean;                    // Whether this series is pinned
  isComparing?: boolean;                 // Whether in comparison mode
  unit?: string;                         // Unit of measurement
  onPinSeries: () => void;               // Handler for pinning series
  onCompareToggle: () => void;           // Handler for adding to comparison
  onExemplarClick: (exemplar: Exemplar) => void; // Handler for exemplar click
  onJsonViewChange: (view: 'pointB' | 'pointA' | 'diff') => void; // Handler for JSON view toggle
  className?: string;                    // Additional CSS classes
}

interface TimeseriesPoint {
  timestamp: number;                     // Unix timestamp in ms
  value: number;                         // Value at this point
}

interface Exemplar {
  timeUnixNano: string;                  // Timestamp in nanos
  value: number;                         // Value of the exemplar
  traceId?: string;                      // Optional trace ID
  spanId?: string;                       // Optional span ID
  attributes?: Record<string, string>;   // Exemplar attributes
}
```

---

## EventBus Subscriptions

| Event                  | Action                                |
|------------------------|---------------------------------------|
| `ui.series.select`     | Update detail pane with selected series |
| `snapshot.loaded`      | Refresh values if current series affected |
| `series.pin`           | Update pin state                      |
| `series.compare.toggle`| Update comparison state               |

---

## EventBus Emissions

| Event                  | Payload                                |
|------------------------|----------------------------------------|
| `series.pin`           | `{ metricKey: string, seriesKey: string, pinned: boolean }` |
| `series.compare.toggle`| `{ metricKey: string, seriesKey: string, comparing: boolean }` |
| `exemplar.select`      | `{ exemplar: Exemplar }`              |
| `ui.copy.json`         | `{ content: string }`                 |

---

## States

### Content Sections

Each section of the detail pane can be in one of these states:

1. **Current Value Section**
   - Has value: Shows current value with unit, delta, and rate
   - No value: Displays "No data available"
   - Error: Shows error message with refresh option

2. **Mini-Trend Section**
   - Has data: Renders sparkline
   - Loading: Shows skeleton/pulse animation
   - No data: Hides section or shows placeholder
   - Error: Shows error icon with tooltip

3. **Contribution Section**
   - Has comparison data: Shows percentages for both snapshots
   - Single snapshot: Shows current percentages only
   - No context: Displays "Insufficient data for comparison"

4. **Exemplars Section**
   - Has exemplars: Lists all exemplars with details
   - No exemplars: Shows "No exemplars found in this snapshot"
   - Too many: Shows top N with "Show all" option

### UI States

The component can be in these UI states:

1. **Normal View**
   - Single series details are shown
   - "Pin" and "Compare" options available

2. **Pinned View**
   - Visual indicator shows series is pinned
   - "Unpin" option available
   - Details persist when selecting other series

3. **Comparison View**
   - Side-by-side view of multiple series
   - "Remove from comparison" option available

---

## Render Structure (JSX)

```tsx
<div className="series-detail-pane" role="region" aria-label="Series Details">
  <div className="pane-header">
    <h3 className="pane-title">
      DETAIL PANE (Selected: {selectedContext})
    </h3>
    
    <div className="pane-actions">
      <button 
        className={`pin-button ${isPinned ? 'active' : ''}`}
        onClick={onPinSeries}
        aria-pressed={isPinned}
      >
        [Pin Series]
      </button>
      
      <button 
        className={`compare-button ${isComparing ? 'active' : ''}`}
        onClick={onCompareToggle}
        aria-pressed={isComparing}
      >
        [Compare Series]
      </button>
    </div>
  </div>
  
  <div className="detail-sections">
    {/* Current Value Section */}
    <section className="detail-section">
      <h4 className="section-header">▸ Current Value (Snapshot B)</h4>
      
      <div className="value-row">
        <span className="current-value">{formatValue(currentValue, unit)}</span>
        
        <div className="mini-trend">
          <span className="trend-label">📈 Mini-Trend (last 10m):</span>
          <SparklineChart data={historicalData} height={20} width={100} />
        </div>
      </div>
      
      {baselineSnapshot && (
        <>
          <div className="delta-row">
            <span className="delta-label">Delta vs A</span>
            <span className={`delta-value ${deltaValue > 0 ? 'positive' : 'negative'}`}>
              {deltaValue > 0 ? '+' : ''}{formatValue(deltaValue, unit)} {deltaValue > 0 ? '▲' : '▼'}
            </span>
          </div>
          
          {rateValue && (
            <div className="rate-row">
              <span className="rate-label">Rate / s (over Δ)</span>
              <span className="rate-value">{formatValue(rateValue, `${unit}/s`)}</span>
            </div>
          )}
        </>
      )}
    </section>
    
    {/* Contribution & Comparison Section */}
    <section className="detail-section">
      <h4 className="section-header">▸ Contribution & Comparison (for {contributionContext})</h4>
      
      {contributionStats.map(stat => (
        <div key={stat.label} className="contribution-row">
          <span className="contribution-label">– {stat.label}:</span>
          <span className="contribution-value">
            {stat.currentPct}% (B)
            {stat.baselinePct !== undefined && (
              <> vs {stat.baselinePct}% (A)</>
            )}
          </span>
        </div>
      ))}
    </section>
    
    {/* Humanised Views Section */}
    <section className="detail-section">
      <h4 className="section-header">▸ Humanised Views</h4>
      
      {humanizedViews.map(view => (
        <div key={view.label} className="humanized-row">
          <span className="humanized-label">– {view.label}</span>
          <span className="humanized-value">{view.value}</span>
        </div>
      ))}
    </section>
    
    {/* Exemplars Section */}
    <section className="detail-section">
      <h4 className="section-header">
        ▸ Linked Exemplars (Snapshot B)
        {exemplars && exemplars.length > 0 && (
          <span className="exemplar-count">({exemplars.length} found)</span>
        )}
      </h4>
      
      {exemplars && exemplars.length > 0 ? (
        <div className="exemplars-list">
          {exemplars.map((exemplar, index) => (
            <div key={index} className="exemplar-row">
              <span className="exemplar-label">–</span>
              <span className="exemplar-trace">
                traceID: {truncateId(exemplar.traceId)}
                {exemplar.spanId && <> spanID: {truncateId(exemplar.spanId)}</>}
              </span>
              <span className="exemplar-value">
                val: {formatValue(exemplar.value, unit)} @{formatTime(exemplar.timeUnixNano)}
              </span>
              <span className="exemplar-attrs">
                {formatExemplarAttrs(exemplar.attributes)}
              </span>
              <button 
                className="trace-link"
                onClick={() => onExemplarClick(exemplar)}
                aria-label={`View trace ${exemplar.traceId}`}
              >
                [↗]
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-exemplars">No exemplars found in this snapshot</div>
      )}
    </section>
    
    {/* Raw JSON Section */}
    <section className="detail-section">
      <div className="section-header-with-tabs">
        <h4 className="section-header">▸ Raw OTLP JSON</h4>
        <button className="copy-button" onClick={handleCopyJson} aria-label="Copy JSON">⬈ copy</button>
        
        <div className="json-view-tabs">
          <button 
            className={jsonView === 'pointB' ? 'active' : ''}
            onClick={() => onJsonViewChange('pointB')}
          >
            Point B
          </button>
          <button 
            className={jsonView === 'pointA' ? 'active' : ''}
            onClick={() => onJsonViewChange('pointA')}
            disabled={!baselineSnapshot}
          >
            Point A
          </button>
          <button 
            className={jsonView === 'diff' ? 'active' : ''}
            onClick={() => onJsonViewChange('diff')}
            disabled={!baselineSnapshot}
          >
            Diff
          </button>
        </div>
      </div>
      
      <div className="json-display">
        <pre>{currentJson}</pre>
      </div>
    </section>
  </div>
</div>
```

---

## Implementation Notes

### Value Formatting

- Values are formatted according to their unit (e.g., seconds, bytes, count)
- Delta values include appropriate sign and direction indicator
- Rate values are calculated as delta ÷ time interval
- Values use appropriate precision based on magnitude

### Mini-Trend Sparkline

- Rendered using SVG for optimal performance
- Automatically scales to fit the available data range
- Shows relative changes rather than absolute values
- Provides visual context for the current value

### Humanized Views

- Converts seconds to HH:MM:SS format
- Translates raw values to percentages where appropriate
- Estimates derived metrics (e.g., CPU % utilization)
- Applies domain-specific formatting for special metrics

### Exemplar Handling

- Truncates long IDs for display
- Formats timestamps in human-readable format
- Displays key attributes with ellipses for long values
- Links to trace visualization systems where available

### JSON View

- Pretty-prints JSON for readability
- Provides syntax highlighting
- Generates semantic diff between Point A and B
- Includes copy functionality with clipboard API

### Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation for section headers (accordion pattern)
- Screen reader announcements for view changes
- High contrast for all value indicators

---

## Usage Example

```tsx
<SeriesDetailPane
  metricKey="process.cpu.time"
  seriesKey="process.cpu.time|host.name=alpha,state=user"
  activeSnapshot={currentSnapshot}
  baselineSnapshot={previousSnapshot}
  timeInterval={300}
  historicalData={cpuTimeHistory}
  exemplars={cpuExemplars}
  isPinned={false}
  isComparing={false}
  unit="s"
  onPinSeries={handlePinSeries}
  onCompareToggle={handleCompareToggle}
  onExemplarClick={handleExemplarClick}
  onJsonViewChange={handleJsonViewChange}
  className="border-l border-gray-200 dark:border-gray-700"
/>
```