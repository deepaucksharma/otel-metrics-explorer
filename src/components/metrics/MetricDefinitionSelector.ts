import { useStore } from '../../services/stateStore';
import type { MetricDefinition } from '../../utils/metricDefinitions';

/**
 * Custom hook to get all metric definitions with optional filtering
 */
export function useMetricDefinitions(options: {
  filterText?: string;
  metricType?: string;
  sortBy?: 'name' | 'type' | 'cardinality';
} = {}) {
  return useStore(state => {
    const { filterText, metricType, sortBy } = options;
    let definitions = Object.values(state.metricDefinitions);
    
    // Apply text filter if present
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      definitions = definitions.filter(
        def => def.name.toLowerCase().includes(lowerFilter) || 
              (def.description?.toLowerCase().includes(lowerFilter))
      );
    }
    
    // Apply type filter if present
    if (metricType) {
      definitions = definitions.filter(def => def.type === metricType);
    }
    
    // Apply sorting
    if (sortBy) {
      definitions = [...definitions].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'type':
            return a.type.localeCompare(b.type);
          case 'cardinality':
            // Sort by series count as a measure of cardinality
            return b.seriesCount - a.seriesCount;
          default:
            return 0;
        }
      });
    }
    
    return definitions;
  });
}

/**
 * Custom hook to get metric counts grouped by type
 */
export function useMetricCountsByType() {
  return useStore(state => {
    const definitions = Object.values(state.metricDefinitions);
    const counts: Record<string, number> = {
      gauge: 0,
      sum: 0,
      histogram: 0,
      summary: 0,
      total: definitions.length
    };
    
    // Count metrics by type
    definitions.forEach(def => {
      if (def.type in counts) {
        counts[def.type]++;
      }
    });
    
    return counts;
  });
}

/**
 * Custom hook to get metrics with high cardinality
 * High cardinality is defined as metrics with more than
 * a given threshold of unique series
 */
export function useHighCardinalityMetrics(threshold = 10) {
  return useStore(state => {
    const definitions = Object.values(state.metricDefinitions);
    return definitions
      .filter(def => def.seriesCount > threshold)
      .sort((a, b) => b.seriesCount - a.seriesCount);
  });
}

/**
 * Custom hook to get a specific metric definition by name
 */
export function useMetricDefinition(metricName: string): MetricDefinition | undefined {
  return useStore(state => state.metricDefinitions[metricName]);
}

/**
 * Custom hook to get a specific metric definition by ID
 */
export function useMetricDefinitionById(metricId: string | null): MetricDefinition | undefined {
  return useStore(state => {
    if (!metricId) return undefined;
    
    const selectedSnapshotId = state.uiState.selectedSnapshotId;
    if (!selectedSnapshotId) return undefined;
    
    const metric = state.snapshots[selectedSnapshotId]?.metrics[metricId];
    if (!metric) return undefined;
    
    return state.metricDefinitions[metric.name];
  });
}