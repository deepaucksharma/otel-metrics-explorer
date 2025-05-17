# 81 · ui-SnapshotTimeline
_A micro-component in the **UI layer** for temporal navigation_

---

## Responsibility

* Provide intuitive timeline navigation between metric snapshots
* Clearly visualize the relationship between active and baseline snapshots
* Support previous/next navigation when multiple snapshots are available
* Enable live update toggling for streaming data scenarios
* Communicate temporal context with clear timestamp and interval information

---

## Visual Design

```text
⏱ Snapshot Timeline:   ◀ previous | Active: B (14:37:10Z) | A (14:32:10Z) | next ▶  Δ +300s
                         └─ (compare with A)        └─ (baseline)           [Live Update ⏸]
```

This component appears at the top of the MetricInstanceWidget and provides a clear visual indication of:
- Which snapshot is currently active (B)
- Which snapshot serves as the baseline for comparison (A)
- The time interval between snapshots (Δ +300s)
- Navigation controls for moving through multiple snapshots
- A toggle for live updates in streaming scenarios

---

## Props

```ts
export interface SnapshotTimelineProps {
  snapshots: Record<string, SnapshotMetadata>;  // All available snapshots
  activeSnapshotId: string;                     // Currently selected "B" snapshot
  baselineSnapshotId?: string;                  // Optional "A" comparison snapshot
  isLiveMode: boolean;                          // Whether live updates are enabled
  onSelectSnapshot: (id: string, role: 'active' | 'baseline') => void;  // Selection handler
  onNavigate: (direction: 'prev' | 'next') => void;  // Previous/next navigation
  onToggleLive: () => void;                     // Live mode toggle handler
  className?: string;                           // Additional CSS classes
}

interface SnapshotMetadata {
  id: string;                // Unique identifier
  timestamp: number;         // Unix timestamp (milliseconds)
  label?: string;            // Optional human-readable label
  source: 'file' | 'live';   // Source of the snapshot
}
```

---

## EventBus Subscriptions

| Event             | Action                                |
|-------------------|---------------------------------------|
| `snapshot.loaded` | Add new snapshot to timeline          |
| `snapshot.select` | Update active/baseline selection      |
| `live.update`     | Add new snapshot and update timeline if in live mode |

---

## EventBus Emissions

| Event               | Payload                                       |
|---------------------|-----------------------------------------------|
| `snapshot.select`   | `{ id: string, role: 'active' or 'baseline' }`|
| `snapshot.navigate` | `{ direction: 'prev' or 'next' }`            |
| `live.toggle`       | `{ enabled: boolean }`                        |

---

## States

The timeline can exist in several states:

1. **Single Snapshot Mode**
   - Only one snapshot loaded (no comparison available)
   - "Previous" and "Next" buttons disabled
   - No baseline snapshot displayed

2. **Comparison Mode**
   - Two or more snapshots loaded
   - Active (B) and Baseline (A) snapshots displayed with time delta
   - "Previous" and "Next" buttons enabled if more snapshots exist
   
3. **Live Mode**
   - Continuously updating with new snapshots
   - Most recent snapshot auto-selected as Active (B)
   - Previous snapshot auto-selected as Baseline (A)
   - Toggle shows "Live Update ⏺️" in active state
   
4. **Historical Browsing Mode**
   - User manually navigating through multiple historical snapshots
   - Live updates disabled
   - Navigation controls enabled
   - Time delta shown between active and adjacent snapshots

---

## Render Structure (JSX)

```tsx
<div className="snapshot-timeline" role="navigation" aria-label="Snapshot Timeline">
  <span className="timeline-icon" aria-hidden="true">⏱</span>
  <span className="timeline-label">Snapshot Timeline:</span>
  
  <div className="timeline-navigation">
    <button 
      onClick={() => onNavigate('prev')} 
      disabled={!hasPrevious}
      aria-label="Previous snapshot"
    >
      ◀ previous
    </button>
    
    <div className="active-snapshot">
      <strong>Active: {activeSnapshot.label || 'B'}</strong> ({formatTimestamp(activeSnapshot.timestamp)})
      {baselineSnapshot && (
        <span className="comparison-note">└─ (compare with {baselineSnapshot.label || 'A'})</span>
      )}
    </div>
    
    {baselineSnapshot && (
      <div className="baseline-snapshot">
        <strong>{baselineSnapshot.label || 'A'}</strong> ({formatTimestamp(baselineSnapshot.timestamp)})
        <span className="comparison-note">└─ (baseline)</span>
      </div>
    )}
    
    <button 
      onClick={() => onNavigate('next')} 
      disabled={!hasNext}
      aria-label="Next snapshot"
    >
      next ▶
    </button>
    
    {timeDelta && (
      <div className="time-delta" aria-label={`Time difference: ${formatTimeDelta(timeDelta)}`}>
        Δ {formatTimeDelta(timeDelta)}
      </div>
    )}
  </div>
  
  <button 
    className={`live-toggle ${isLiveMode ? 'active' : ''}`}
    onClick={onToggleLive}
    aria-pressed={isLiveMode}
    aria-label={`Live updates ${isLiveMode ? 'enabled' : 'disabled'}`}
  >
    [Live Update {isLiveMode ? '⏺️' : '⏸'}]
  </button>
</div>
```

---

## Implementation Notes

### Timestamp Formatting

- Timestamps are displayed in a user-friendly format (ISO or localized)
- Time deltas are shown in appropriate units (seconds, minutes, hours)
- When delta is small, higher precision is used (ms or μs if relevant)

### Snapshot Selection

- Clicking on a snapshot sets it as active or baseline based on context
- When navigating with prev/next buttons, the active snapshot changes while maintaining baseline where possible
- In live mode, the timeline automatically shifts with new snapshots

### Live Mode Behavior

- When enabled, new snapshots are automatically added to the timeline
- The most recent snapshot becomes active (B)
- The previous active snapshot becomes baseline (A)
- The timeline shows a visual indication of real-time updates

### Accessibility

- Full keyboard navigation support
- ARIA labels for all interactive elements
- Screen reader announcements for snapshot changes
- High contrast visual indicators

---

## Usage Example

```tsx
<SnapshotTimeline
  snapshots={availableSnapshots}
  activeSnapshotId="snapshot-2023-05-18-14-37-10"
  baselineSnapshotId="snapshot-2023-05-18-14-32-10"
  isLiveMode={false}
  onSelectSnapshot={handleSnapshotSelect}
  onNavigate={handleNavigate}
  onToggleLive={handleLiveToggle}
  className="border-b border-gray-200 dark:border-gray-700"
/>
```