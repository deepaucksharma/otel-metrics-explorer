import { useStore } from '../../services/stateStore';
import { MetricCard } from './MetricCard';
import { EmptyState } from '../ui/EmptyState';

interface MetricsListProps {
  snapshotId: string;
}

export function MetricsList({ snapshotId }: MetricsListProps) {
  const metrics = useStore(state => state.getMetricsForSnapshot(snapshotId));
  const filterText = useStore(state => state.uiState.filterText);
  const sortBy = useStore(state => state.uiState.sortBy);
  const expandedMetricIds = useStore(state => state.uiState.expandedMetricIds);
  const selectedMetricId = useStore(state => state.uiState.selectedMetricId);
  const setSelectedMetric = useStore(state => state.setSelectedMetric);
  
  // Apply filtering
  const filteredMetrics = metrics.filter(metric => {
    if (!filterText) return true;
    
    const searchText = filterText.toLowerCase();
    return (
      metric.name.toLowerCase().includes(searchText) ||
      (metric.description?.toLowerCase().includes(searchText))
    );
  });
  
  // Apply sorting
  const sortedMetrics = [...filteredMetrics].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'type') {
      return a.type.localeCompare(b.type);
    } else {
      // For cardinality, we would need to have that data available
      // For now, fallback to name sorting
      return a.name.localeCompare(b.name);
    }
  });
  
  if (sortedMetrics.length === 0) {
    return (
      <EmptyState
        title="No metrics found"
        description={filterText ? "No metrics match your search criteria. Try adjusting your filters." : "No metrics available in this snapshot."}
        icon="chart"
      />
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Metrics ({sortedMetrics.length})
        </h2>
        
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search metrics..."
            className="input"
            value={filterText}
            onChange={(e) => useStore.getState().setFilterText(e.target.value)}
          />
          
          <select
            className="input"
            value={sortBy}
            onChange={(e) => useStore.getState().setSortBy(e.target.value as any)}
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="cardinality">Sort by Cardinality</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {sortedMetrics.map(metric => (
          <MetricCard
            key={metric.id}
            metricId={metric.id}
            snapshotId={snapshotId}
            isExpanded={expandedMetricIds.includes(metric.id)}
            isSelected={selectedMetricId === metric.id}
            onSelect={() => setSelectedMetric(metric.id)}
          />
        ))}
      </div>
    </div>
  );
}
