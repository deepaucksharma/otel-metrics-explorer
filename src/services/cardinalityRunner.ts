/**
 * Cardinality Runner Service
 * 
 * Listens for snapshot events and manages the cardinality analysis process.
 * Can use either the sync or worker-based implementation based on data size.
 */

import { eventBus } from './eventBus';
import { useStore } from '../state/store';
import { SnapshotLoadedEvent } from '../types/otlp';
import { 
  analyzeCardinality,
  AnalysisOptions
} from '../utils/cardinalityEngine';

// Size threshold for worker offloading (in data points)
const WORKER_THRESHOLD = 5000;

// Default analysis options
const DEFAULT_OPTIONS: AnalysisOptions = {
  attributeThreshold: 50,
  depthLimit: 2,
  calculateCombinations: true
};

/**
 * Initialize the cardinality runner service
 */
export function initCardinalityRunner() {
  // Listen for snapshot loaded events
  eventBus.on('snapshot.loaded', handleSnapshotLoaded);

  // Return a cleanup function
  return () => {
    eventBus.off('snapshot.loaded', handleSnapshotLoaded);
  };
}

/**
 * Handle a snapshot loaded event
 */
async function handleSnapshotLoaded(event: SnapshotLoadedEvent) {
  const { snapshotId } = event;
  const store = useStore.getState();
  
  // Get the snapshot
  const snapshot = store.snapshots[snapshotId];
  if (!snapshot) {
    console.error(`Cardinality Runner: Snapshot ${snapshotId} not found`);
    return;
  }
  
  // Get the cost model from the store
  const { costModel } = store;
  
  // Determine if we should use a worker based on data size
  const useWorker = snapshot.totalDataPoints > WORKER_THRESHOLD;
  
  try {
    // Emit that analysis is starting
    eventBus.emit('cardinality.analyzing', {
      snapshotId,
      timestamp: Date.now(),
      useWorker
    });
    
    let analysis;
    
    // Use either sync or worker implementation
    if (useWorker) {
      analysis = await runWorkerAnalysis(snapshot, {
        ...DEFAULT_OPTIONS,
        costModel
      });
    } else {
      // Simple synchronous analysis for smaller datasets
      analysis = analyzeCardinality(snapshot, {
        ...DEFAULT_OPTIONS,
        costModel
      });
    }
    
    // Update store with analysis results
    store.setCardinalityAnalysis(analysis);
    
    // Emit that analysis is complete
    eventBus.emit('cardinality.analyzed', {
      snapshotId,
      analysisId: analysis.snapshotId,
      timestamp: Date.now(),
      totalCardinality: analysis.totalCardinality
    });
  } catch (error) {
    console.error('Cardinality Runner: Error analyzing snapshot', error);
    
    // Emit analysis error
    eventBus.emit('cardinality.error', {
      snapshotId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
}

/**
 * Run the analysis in a web worker
 */
async function runWorkerAnalysis(snapshot: any, options: AnalysisOptions) {
  return new Promise((resolve, reject) => {
    // Create a worker
    const worker = new Worker(
      new URL('../workers/cardinalityAnalyzer.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    // Generate a unique ID for this request
    const requestId = `analyze-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Set up message handler
    worker.addEventListener('message', (event) => {
      const { id, success, data, error } = event.data;
      
      // Ignore messages for other requests
      if (id !== requestId) return;
      
      if (success) {
        resolve(data);
      } else {
        reject(new Error(error || 'Unknown error in worker'));
      }
      
      // Terminate the worker
      worker.terminate();
    });
    
    // Set up error handler
    worker.addEventListener('error', (error) => {
      reject(error);
      worker.terminate();
    });
    
    // Send the request to the worker
    worker.postMessage({
      id: requestId,
      action: 'analyze',
      payload: {
        snapshot,
        options
      }
    });
  });
}

/**
 * Simulate recommendations in a worker
 */
export async function simulateRecommendations(snapshotId: string, recommendations: any[]) {
  const store = useStore.getState();
  
  // Get the snapshot
  const snapshot = store.snapshots[snapshotId];
  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }
  
  // Get the cost model from the store
  const { costModel } = store;
  
  // Create a worker
  const worker = new Worker(
    new URL('../workers/cardinalityAnalyzer.worker.ts', import.meta.url),
    { type: 'module' }
  );
  
  return new Promise((resolve, reject) => {
    // Generate a unique ID for this request
    const requestId = `simulate-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Set up message handler
    worker.addEventListener('message', (event) => {
      const { id, success, data, error } = event.data;
      
      // Ignore messages for other requests
      if (id !== requestId) return;
      
      if (success) {
        resolve(data);
      } else {
        reject(new Error(error || 'Unknown error in worker'));
      }
      
      // Terminate the worker
      worker.terminate();
    });
    
    // Set up error handler
    worker.addEventListener('error', (error) => {
      reject(error);
      worker.terminate();
    });
    
    // Send the request to the worker
    worker.postMessage({
      id: requestId,
      action: 'simulate',
      payload: {
        snapshot,
        recommendations,
        costModel
      }
    });
  });
}