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
    if (!state.uiState.selectedSnapshotId) return [];
    
    const snapshot = state.snapshots[state.uiState.selectedSnapshotId];
    if (!snapshot) return [];
    
    return Object.values(snapshot.metrics);
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
  
  // Render the grid or list based on view mode
  return (
    <div className="flex h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        <div 
          className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          {filteredMetrics.map(metric => (
            <div key={metric.id}>
              <GaugeStatCard
                metricId={metric.id}
                snapshotId={selectedSnapshotId}
                compact={viewMode === 'list'}
              />
            </div>
          ))}
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