import { StateCreator } from 'zustand';
import { CardinalityAnalysis, Recommendation, RecommendationImpact } from '../utils/cardinalityEngine';

export interface CostModel {
  costPerSeries: number;
  costPerDataPoint: number;
  retentionPeriodDays: number;
  scrapeIntervalSeconds: number;
  currency: string;
}

export interface SimulationConfig {
  attributesToDrop: string[];
  attributesToTransform: Array<{
    key: string;
    regex: string;
  }>;
  attributesToAggregate: Array<{
    key: string;
    function: string;
  }>;
  metricsToFilter: string[];
}

export interface CardinalitySlice {
  // State
  cardinalityAnalysis: Record<string, CardinalityAnalysis>;
  recommendations: Record<string, Recommendation[]>;
  simulationResults: Record<string, RecommendationImpact>;
  activeSimulation: SimulationConfig | null;
  costModel: CostModel;
  
  // Actions
  setCardinalityAnalysis: (analysis: CardinalityAnalysis) => void;
  clearCardinalityAnalysis: (analysisId?: string) => void;
  setRecommendations: (analysisId: string, recommendations: Recommendation[]) => void;
  setSimulationResult: (simulationId: string, result: RecommendationImpact) => void;
  setActiveSimulation: (config: SimulationConfig | null) => void;
  updateCostModel: (updates: Partial<CostModel>) => void;
  
  // Selectors
  getCardinalityAnalysisById: (analysisId: string) => CardinalityAnalysis | undefined;
  getMetricCardinalityById: (analysisId: string, metricId: string) => any | undefined;
  getRecommendationsForAnalysis: (analysisId: string) => Recommendation[];
  getHighestCardinalityMetrics: (analysisId: string, limit?: number) => any[];
  getHighestImpactAttributes: (analysisId: string, limit?: number) => any[];
}

export const createCardinalitySlice: StateCreator<
  CardinalitySlice,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  CardinalitySlice
> = (set, get) => ({
  // Initial state
  cardinalityAnalysis: {},
  recommendations: {},
  simulationResults: {},
  activeSimulation: null,
  costModel: {
    costPerSeries: 0.001,
    costPerDataPoint: 0.0000001,
    retentionPeriodDays: 30,
    scrapeIntervalSeconds: 60,
    currency: 'USD',
  },
  
  // Actions
  setCardinalityAnalysis: (analysis) => {
    set((state) => {
      state.cardinalityAnalysis[analysis.snapshotId] = analysis;
      
      // Auto-set the recommendations from the analysis
      state.recommendations[analysis.snapshotId] = analysis.overallRecommendations;
    });
  },
  
  clearCardinalityAnalysis: (analysisId) => {
    set((state) => {
      if (analysisId) {
        delete state.cardinalityAnalysis[analysisId];
        delete state.recommendations[analysisId];
        delete state.simulationResults[analysisId];
      } else {
        state.cardinalityAnalysis = {};
        state.recommendations = {};
        state.simulationResults = {};
      }
    });
  },
  
  setRecommendations: (analysisId, recommendations) => {
    set((state) => {
      state.recommendations[analysisId] = recommendations;
    });
  },
  
  setSimulationResult: (simulationId, result) => {
    set((state) => {
      state.simulationResults[simulationId] = result;
    });
  },
  
  setActiveSimulation: (config) => {
    set((state) => {
      state.activeSimulation = config;
    });
  },
  
  updateCostModel: (updates) => {
    set((state) => {
      state.costModel = {
        ...state.costModel,
        ...updates
      };
    });
  },
  
  // Selectors
  getCardinalityAnalysisById: (analysisId) => {
    return get().cardinalityAnalysis[analysisId];
  },
  
  getMetricCardinalityById: (analysisId, metricId) => {
    const analysis = get().cardinalityAnalysis[analysisId];
    if (!analysis) return undefined;
    
    return analysis.metrics[metricId];
  },
  
  getRecommendationsForAnalysis: (analysisId) => {
    return get().recommendations[analysisId] || [];
  },
  
  getHighestCardinalityMetrics: (analysisId, limit = 10) => {
    const analysis = get().cardinalityAnalysis[analysisId];
    if (!analysis) return [];
    
    return Object.values(analysis.metrics)
      .sort((a, b) => b.totalSeries - a.totalSeries)
      .slice(0, limit);
  },
  
  getHighestImpactAttributes: (analysisId, limit = 10) => {
    const analysis = get().cardinalityAnalysis[analysisId];
    if (!analysis) return [];
    
    return Object.values(analysis.attributeImpact)
      .sort((a, b) => b.weightedImpact - a.weightedImpact)
      .slice(0, limit);
  }
});