/**
 * CardinalitySelectors
 * 
 * Custom hooks for accessing cardinality data from the store
 */

import { useStore } from '../../state/store';
import { CardinalityAnalysis, MetricCardinalityInfo, AttributeImpactInfo, Recommendation } from '../../utils/cardinalityEngine';

/**
 * Get a specific cardinality analysis by ID (usually a snapshot ID)
 */
export function useCardinalityAnalysis(analysisId?: string): CardinalityAnalysis | undefined {
  return useStore(state => {
    // If no analysis ID provided, use the selected snapshot ID
    const targetId = analysisId || state.uiState.selectedSnapshotId;
    if (!targetId) return undefined;
    
    try {
      return state.getCardinalityAnalysisById(targetId);
    } catch (error) {
      console.error(`Error fetching cardinality analysis for '${targetId}':`, error);
      return undefined;
    }
  });
}

/**
 * Hook to get summary statistics from a cardinality analysis
 */
export function useCardinalitySummary(analysisId?: string) {
  return useStore(state => {
    // If no analysis ID provided, use the selected snapshot ID
    const targetId = analysisId || state.uiState.selectedSnapshotId;
    if (!targetId) return null;
    
    try {
      const analysis = state.getCardinalityAnalysisById(targetId);
      if (!analysis) return null;
      
      return {
        totalCardinality: analysis.totalCardinality,
        totalMetrics: analysis.totalMetrics,
        totalDataPoints: analysis.totalDataPoints,
        timestamp: analysis.timestamp,
        topHighCardinalityMetrics: Object.values(analysis.metrics)
          .sort((a, b) => b.totalSeries - a.totalSeries)
          .slice(0, 5),
        topImpactAttributes: Object.values(analysis.attributeImpact)
          .sort((a, b) => b.weightedImpact - a.weightedImpact)
          .slice(0, 5)
      };
    } catch (error) {
      console.error(`Error fetching cardinality summary for '${targetId}':`, error);
      return null;
    }
  });
}

/**
 * Hook to get metrics with filtering and sorting options
 */
export function useCardinalityMetrics(options: {
  analysisId?: string;
  filterText?: string;
  metricType?: string;
  sortBy?: 'name' | 'cardinality' | 'datapoints';
  orderDir?: 'asc' | 'desc';
  limit?: number;
} = {}) {
  return useStore(state => {
    const { 
      analysisId,
      filterText = '',
      metricType,
      sortBy = 'cardinality',
      orderDir = 'desc',
      limit
    } = options;
    
    // If no analysis ID provided, use the selected snapshot ID
    const targetId = analysisId || state.uiState.selectedSnapshotId;
    if (!targetId) return [];
    
    try {
      const analysis = state.getCardinalityAnalysisById(targetId);
      if (!analysis) return [];
      
      // Filter metrics
      let metrics = Object.values(analysis.metrics);
      
      if (filterText) {
        const lowerFilter = filterText.toLowerCase();
        metrics = metrics.filter(m => 
          m.metricName.toLowerCase().includes(lowerFilter)
        );
      }
      
      if (metricType) {
        // This would need to be joined with metric type info from the metrics slice
        // For now, we'll skip type filtering
      }
      
      // Sort metrics
      switch (sortBy) {
        case 'name':
          metrics.sort((a, b) => {
            return orderDir === 'asc' 
              ? a.metricName.localeCompare(b.metricName)
              : b.metricName.localeCompare(a.metricName);
          });
          break;
        case 'cardinality':
          metrics.sort((a, b) => {
            return orderDir === 'asc'
              ? a.totalSeries - b.totalSeries
              : b.totalSeries - a.totalSeries;
          });
          break;
        case 'datapoints':
          metrics.sort((a, b) => {
            return orderDir === 'asc'
              ? a.totalDataPoints - b.totalDataPoints
              : b.totalDataPoints - a.totalDataPoints;
          });
          break;
      }
      
      // Apply limit
      if (limit && limit > 0) {
        metrics = metrics.slice(0, limit);
      }
      
      return metrics;
    } catch (error) {
      console.error(`Error fetching cardinality metrics for '${targetId}':`, error);
      return [];
    }
  });
}

/**
 * Hook to get all attributes sorted by impact
 */
export function useHighImpactAttributes(analysisId?: string, limit = 0) {
  return useStore(state => {
    // If no analysis ID provided, use the selected snapshot ID
    const targetId = analysisId || state.uiState.selectedSnapshotId;
    if (!targetId) return [];
    
    try {
      const analysis = state.getCardinalityAnalysisById(targetId);
      if (!analysis) return [];
      
      let attributes = Object.values(analysis.attributeImpact)
        .sort((a, b) => b.weightedImpact - a.weightedImpact);
      
      if (limit > 0) {
        attributes = attributes.slice(0, limit);
      }
      
      return attributes;
    } catch (error) {
      console.error(`Error fetching high-impact attributes for '${targetId}':`, error);
      return [];
    }
  });
}

/**
 * Hook to get recommendations for an analysis
 */
export function useRecommendations(analysisId?: string) {
  return useStore(state => {
    // If no analysis ID provided, use the selected snapshot ID
    const targetId = analysisId || state.uiState.selectedSnapshotId;
    if (!targetId) return [];
    
    try {
      return state.getRecommendationsForAnalysis(targetId);
    } catch (error) {
      console.error(`Error fetching recommendations for '${targetId}':`, error);
      return [];
    }
  });
}

/**
 * Hook to get the active simulation configuration
 */
export function useActiveSimulation() {
  return useStore(state => state.activeSimulation);
}

/**
 * Hook to get simulation results
 */
export function useSimulationResults(simulationId?: string) {
  return useStore(state => {
    // If no simulation ID provided, use the selected snapshot ID
    const targetId = simulationId || state.uiState.selectedSnapshotId;
    if (!targetId) return null;
    
    try {
      return state.simulationResults[targetId];
    } catch (error) {
      console.error(`Error fetching simulation results for '${targetId}':`, error);
      return null;
    }
  });
}

/**
 * Hook to get the cost model
 */
export function useCostModel() {
  return useStore(state => state.costModel);
}