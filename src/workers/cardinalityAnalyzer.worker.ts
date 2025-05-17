/**
 * Cardinality Analyzer Worker
 * 
 * This Web Worker handles cardinality analysis off the main thread
 * to avoid blocking the UI during processing of large datasets.
 */

import { ParsedSnapshot } from '../types/otlp';
import { 
  analyzeCardinality, 
  simulateRecommendations,
  CardinalityAnalysis,
  AnalysisOptions,
  Recommendation,
  RecommendationImpact
} from '../utils/cardinalityEngine';

// Define the message types for Worker communication
interface WorkerMessage {
  id: string;
  action: 'analyze' | 'simulate';
  payload: AnalyzePayload | SimulatePayload;
}

interface AnalyzePayload {
  snapshot: ParsedSnapshot;
  options?: AnalysisOptions;
}

interface SimulatePayload {
  snapshot: ParsedSnapshot;
  recommendations: Recommendation[];
  costModel: {
    costPerSeries: number;
    costPerDataPoint: number;
    retentionPeriodDays: number;
    scrapeIntervalSeconds: number;
    currency: string;
  };
}

interface WorkerResponse {
  id: string;
  success: boolean;
  data?: CardinalityAnalysis | RecommendationImpact;
  error?: string;
  action: string;
}

// Set up event listener for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { id, action, payload } = event.data;
  
  try {
    if (action === 'analyze') {
      const analyzePayload = payload as AnalyzePayload;
      const { snapshot, options } = analyzePayload;
      
      // Log the start of analysis
      console.time(`Cardinality analysis for snapshot ${snapshot.id}`);
      
      // Perform analysis
      const analysisResult = analyzeCardinality(snapshot, options);
      
      console.timeEnd(`Cardinality analysis for snapshot ${snapshot.id}`);
      
      // Send successful response back to main thread
      self.postMessage({
        id,
        action,
        success: true,
        data: analysisResult
      } as WorkerResponse);
    }
    else if (action === 'simulate') {
      const simulatePayload = payload as SimulatePayload;
      const { snapshot, recommendations, costModel } = simulatePayload;
      
      // Log the start of simulation
      console.time(`Simulation for ${recommendations.length} recommendations`);
      
      // Perform simulation
      const simulationResult = simulateRecommendations(
        snapshot, 
        recommendations,
        costModel
      );
      
      console.timeEnd(`Simulation for ${recommendations.length} recommendations`);
      
      // Send successful response back to main thread
      self.postMessage({
        id,
        action,
        success: true,
        data: simulationResult
      } as WorkerResponse);
    }
    else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    // Send error response back to main thread
    self.postMessage({
      id,
      action,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in cardinality analyzer'
    } as WorkerResponse);
  }
});

export default {} as typeof Worker & { new(): Worker };