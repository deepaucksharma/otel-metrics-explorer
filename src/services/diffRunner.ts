/**
 * Diff Runner Service
 * 
 * This service listens for snapshot loading events and computes diffs
 * between snapshots, then updates the diff store.
 */

import { eventBus } from './eventBus';
import { useStore } from './stateStore';
import { computeDiffs } from '../utils/diffEngine';
import type { ParsedSnapshot } from '../types/otlp';

interface SnapshotLoadedEvent {
  snapshotId: string;
  frame?: 'A' | 'B';
  fileName: string;
  timestamp: number;
}

// Initialize our snapshot references
let snapshotA: ParsedSnapshot | null = null;
let snapshotB: ParsedSnapshot | null = null;

/**
 * Initialize the diff runner service
 */
export function initDiffRunner() {
  // Listen for snapshot loaded events
  eventBus.on('snapshot.loaded', handleSnapshotLoaded);

  // Return a cleanup function
  return () => {
    eventBus.off('snapshot.loaded', handleSnapshotLoaded);
  };
}

/**
 * Handle snapshot loaded events
 */
function handleSnapshotLoaded(event: SnapshotLoadedEvent) {
  const store = useStore.getState();
  
  try {
    const snapshot = store.snapshots[event.snapshotId];
    if (!snapshot) {
      console.error('DiffRunner: Snapshot not found in store', event.snapshotId);
      return;
    }

    // Determine which frame (A or B) this snapshot belongs to
    const frame = event.frame || determineSnapshotFrame(snapshot, store);
    
    // Store the snapshot in the appropriate variable
    if (frame === 'A') {
      snapshotA = snapshot;
      
      // Log info
      console.info('DiffRunner: Snapshot A loaded', snapshot.id);
      
      // If we also have B, compute a diff
      if (snapshotB) {
        computeAndStoreDiff(snapshotA, snapshotB);
      }
    } else if (frame === 'B') {
      snapshotB = snapshot;
      
      // Log info
      console.info('DiffRunner: Snapshot B loaded', snapshot.id);
      
      // If we also have A, compute a diff
      if (snapshotA) {
        computeAndStoreDiff(snapshotA, snapshotB);
      }
    }
    
  } catch (error) {
    console.error('DiffRunner: Error handling snapshot loaded event', error);
  }
}

/**
 * Determine which frame a snapshot belongs to if not specified
 */
function determineSnapshotFrame(snapshot: ParsedSnapshot, store: ReturnType<typeof useStore.getState>): 'A' | 'B' {
  // Default behavior: 
  // - If no snapshots are loaded yet, this is A
  // - If A is already loaded, this is B
  // - If both are loaded, replace B (more recent)
  
  if (!snapshotA) {
    return 'A';
  }
  
  // Default to B if A is already loaded
  return 'B';
}

/**
 * Compute a diff between two snapshots and store it
 */
function computeAndStoreDiff(snapshotA: ParsedSnapshot, snapshotB: ParsedSnapshot) {
  try {
    // Ensure B is chronologically after A
    if (snapshotB.timestamp < snapshotA.timestamp) {
      // Swap them if needed
      [snapshotA, snapshotB] = [snapshotB, snapshotA];
    }
    
    // Compute the diff
    const diffResult = computeDiffs(snapshotA, snapshotB);
    
    // Store the diff
    const store = useStore.getState();
    store.setDiffStore(diffResult);
    
    // Emit an event that a diff is ready
    eventBus.emit('diff.computed', {
      diffId: `${snapshotA.id}_${snapshotB.id}`,
      snapshotAId: snapshotA.id,
      snapshotBId: snapshotB.id,
      timestamp: Date.now()
    });
    
    console.info('DiffRunner: Computed diff between snapshots', {
      snapshotA: snapshotA.id,
      snapshotB: snapshotB.id,
      metricsCount: Object.keys(diffResult.metrics).length
    });
    
  } catch (error) {
    console.error('DiffRunner: Error computing diff', error);
    
    // Emit error event
    eventBus.emit('diff.error', {
      error: error instanceof Error ? error.message : 'Unknown error computing diff',
      timestamp: Date.now()
    });
  }
}

/**
 * Manually trigger a diff computation between two specific snapshots
 */
export function computeDiffForSnapshots(snapshotAId: string, snapshotBId: string) {
  const store = useStore.getState();
  
  const snapA = store.snapshots[snapshotAId];
  const snapB = store.snapshots[snapshotBId];
  
  if (!snapA || !snapB) {
    console.error('DiffRunner: Cannot compute diff, one or both snapshots not found');
    return;
  }
  
  // Update our references
  snapshotA = snapA;
  snapshotB = snapB;
  
  // Compute the diff
  computeAndStoreDiff(snapA, snapB);
}

/**
 * Clear all snapshot references and diff data
 */
export function clearDiffRunner() {
  snapshotA = null;
  snapshotB = null;
  
  const store = useStore.getState();
  store.clearDiffStore();
}