import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../services/stateStore';
import { eventBus } from '../../services/eventBus';
import { GaugeStatCard } from './GaugeStatCard';
import { DetailPanel } from './DetailPanel';
import { EmptyState } from '../ui/EmptyState';

export function MetricsView() {
  const { 
    selectedSnapshotId, 
    filterText, 
    viewMode, 
    sortBy,
    selectedMetricId,
  } = useStore(state => state.uiState);
  
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const setSelectedMetric = useStore(state => state.setSelectedMetric);
  
  // Handle metric inspection events
  useEffect(() => {
    const handleInspectMetric = ({ metricId }: { metricId: string }) => {
      setSelectedMetric(metricId);
      setDetailPanelOpen(true);
    };
    
    eventBus.on('ui.inspect', handleInspectMetric);
    
    return () => {
      eventBus.clearEvent('ui.inspect');
    };
  }, [setSelectedMetric]);
  
  const metrics = useStore(state => {
    try {
      if (!state.uiState.selectedSnapshotId) return [];
      
      const snapshot = state.snapshots[state.uiState.selectedSnapshotId];
      if (!snapshot || !snapshot.metrics) return [];
      
      return Object.values(snapshot.metrics);
    } catch (error) {
      console.error("Error getting metrics:", error);
      return [];
    }
  });
  
  // Apply filters and sort
  const filteredMetrics = useMemo(() => {
    if (!metrics.length) return [];
    
    let result = metrics;
    
    // Apply text filter if present
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter(metric => 
        metric.name.toLowerCase().includes(lowerFilter) || 
        (metric.description?.toLowerCase().includes(lowerFilter))
      );
    }
    
    // Apply sorting
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'cardinality':
          // For now, sort by attribute count as a proxy for cardinality
          return (b.attributeKeys?.length || 0) - (a.attributeKeys?.length || 0);
        default:
          return 0;
      }
    });
  }, [metrics, filterText, sortBy]);

  // Close detail panel
  const handleCloseDetailPanel = () => {
    setDetailPanelOpen(false);
  };
  
  // If no snapshot selected
  if (!selectedSnapshotId) {
    return (
      <EmptyState
        icon="📊"
        title="No metrics data loaded"
        description="Upload an OTLP metrics snapshot to get started."
        actionLabel="Upload Snapshot"
        // This would trigger the file upload in a real implementation
        onAction={() => eventBus.emit('ui.file.ingest', { trigger: 'empty-state' })}
      />
    );
  }
  
  // If no metrics found
  if (filteredMetrics.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No metrics found"
        description={filterText ? `No metrics match the filter "${filterText}"` : "No metrics available in this snapshot."}
        actionLabel={filterText ? "Clear Filter" : ""}
        onAction={filterText ? () => useStore.getState().setFilterText('') : undefined}
      />
    );
  }
  
  // Get diff store info to see if we have diff data
  const hasDiffData = useStore(state => !!state.diffStore?.currentDiff);
  
  // Render the grid or list based on view mode
  return (
    <div className="flex h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Display mode indicator (Gauge vs Rate) */}
        {hasDiffData && (
          <div className="mb-4 px-3 py-2 bg-green-100 dark:bg-green-900 rounded-md text-green-800 dark:text-green-200 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Showing rate and delta metrics between snapshots</span>
          </div>
        )}
      
        <div 
          className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          {filteredMetrics.map(metric => {
            // If we have diff data and this is a gauge or monotonic sum, 
            // show a RateDeltaCard instead of a GaugeStatCard
            const shouldShowRateCard = hasDiffData && 
              (metric.type === 'gauge' || (metric.type === 'sum' && metric.monotonic));
            
            if (shouldShowRateCard) {
              // Import dynamically to avoid circular dependencies
              const { RateDeltaCard } = require('./RateDeltaCard');
              
              return (
                <div key={metric.id}>
                  <RateDeltaCard
                    metricName={metric.name}
                    compact={viewMode === 'list'}
                  />
                </div>
              );
            }
            
            // Otherwise, show a regular GaugeStatCard
            return (
              <div key={metric.id}>
                <GaugeStatCard
                  metricId={metric.id}
                  snapshotId={selectedSnapshotId}
                  compact={viewMode === 'list'}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Detail Panel */}
      {detailPanelOpen && selectedMetricId && (
        <DetailPanel 
          metricId={selectedMetricId}
          onClose={handleCloseDetailPanel}
        />
      )}
    </div>
  );
}