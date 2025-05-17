import { useState } from 'react';
import { useStore } from '../../services/stateStore';
import { eventBus } from '../../services/eventBus';
import { 
  useMetricDefinitions, 
  useMetricCountsByType 
} from '../metrics/MetricDefinitionSelector';

export function SidebarNavigator() {
  const [filterText, setFilterText] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const uiState = useStore(state => state.uiState);
  const setFilterTextInStore = useStore(state => state.setFilterText);
  const setSortBy = useStore(state => state.setSortBy);
  const setViewMode = useStore(state => state.setViewMode);
  
  // Get metrics based on the current filters
  const metricDefinitions = useMetricDefinitions({
    filterText,
    metricType: selectedType || undefined,
    sortBy: uiState.sortBy,
  });
  
  // Get counts by metric type
  const countsByType = useMetricCountsByType();
  
  // Apply filters from sidebar to global state
  const applyFilters = () => {
    setFilterTextInStore(filterText);
  };
  
  // Handle filter text change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };
  
  // Handle type filter selection
  const handleTypeSelect = (type: string | null) => {
    setSelectedType(type === selectedType ? null : type);
  };
  
  // Handle sort selection
  const handleSortSelect = (sortBy: 'name' | 'type' | 'cardinality') => {
    setSortBy(sortBy);
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode: 'list' | 'grid' | 'treemap') => {
    setViewMode(mode);
  };
  
  // Handle metric selection
  const handleMetricSelect = (metricName: string) => {
    // Find the metricId in the current snapshot
    const state = useStore.getState();
    const snapshotId = state.uiState.selectedSnapshotId;
    if (!snapshotId) return;
    
    const snapshot = state.snapshots[snapshotId];
    if (!snapshot) return;
    
    // Find the metric with matching name
    const metric = Object.values(snapshot.metrics).find(m => m.name === metricName);
    if (!metric) return;
    
    // Update selected metric
    state.setSelectedMetric(metric.id);
    
    // Emit event for metric selection
    eventBus.emit('ui.metric.select', { metricId: metric.id });
  };
  
  // Handle snapshot upload
  const handleFileUpload = () => {
    eventBus.emit('ui.file.ingest', { trigger: 'sidebar-button' });
  };
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Metrics Explorer</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {countsByType.total} metrics available
        </p>
      </div>
      
      {/* Search & Filter */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <input
            type="text"
            className="w-full px-3 py-2 pl-9 border border-neutral-300 dark:border-neutral-700 rounded-md 
                      bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
            placeholder="Search metrics..."
            value={filterText}
            onChange={handleFilterChange}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
          
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            onClick={applyFilters}
          >
            <FilterIcon />
          </button>
        </div>
        
        {/* Type filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          <TypeFilterBadge
            type="gauge"
            count={countsByType.gauge}
            selected={selectedType === 'gauge'}
            onClick={() => handleTypeSelect('gauge')}
          />
          <TypeFilterBadge
            type="sum"
            count={countsByType.sum}
            selected={selectedType === 'sum'}
            onClick={() => handleTypeSelect('sum')}
          />
          <TypeFilterBadge
            type="histogram"
            count={countsByType.histogram}
            selected={selectedType === 'histogram'}
            onClick={() => handleTypeSelect('histogram')}
          />
          <TypeFilterBadge
            type="summary"
            count={countsByType.summary}
            selected={selectedType === 'summary'}
            onClick={() => handleTypeSelect('summary')}
          />
        </div>
        
        {/* Sort & View Controls */}
        <div className="mt-3 flex justify-between">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Sort:</span>
            <button
              className={`text-xs px-2 py-1 rounded ${
                uiState.sortBy === 'name' 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => handleSortSelect('name')}
            >
              Name
            </button>
            <button
              className={`text-xs px-2 py-1 rounded ${
                uiState.sortBy === 'type' 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => handleSortSelect('type')}
            >
              Type
            </button>
            <button
              className={`text-xs px-2 py-1 rounded ${
                uiState.sortBy === 'cardinality' 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => handleSortSelect('cardinality')}
            >
              Series
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              className={`p-1 rounded ${
                uiState.viewMode === 'list' 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => handleViewModeChange('list')}
              aria-label="List view"
            >
              <ListIcon />
            </button>
            <button
              className={`p-1 rounded ${
                uiState.viewMode === 'grid' 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => handleViewModeChange('grid')}
              aria-label="Grid view"
            >
              <GridIcon />
            </button>
          </div>
        </div>
      </div>
      
      {/* Metrics List */}
      <div className="flex-1 overflow-y-auto">
        {metricDefinitions.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
            <p>No metrics found.</p>
            <p className="text-sm mt-2">
              {uiState.selectedSnapshotId 
                ? "Try adjusting your filters."
                : "Upload a metrics snapshot to get started."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {metricDefinitions.map(metric => (
              <li key={metric.name}>
                <button
                  className={`w-full text-left p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                    uiState.selectedMetricId && 
                    useStore.getState().getMetricById(uiState.selectedMetricId)?.name === metric.name
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                  onClick={() => handleMetricSelect(metric.name)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {metric.name}
                      </div>
                      {metric.description && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-1">
                          {metric.description}
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex flex-col items-end">
                      <TypeBadge type={metric.type} />
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {metric.seriesCount} series
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <button
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
          onClick={handleFileUpload}
        >
          Upload Snapshot
        </button>
      </div>
    </div>
  );
}

function TypeFilterBadge({ 
  type, 
  count, 
  selected, 
  onClick 
}: { 
  type: string; 
  count: number; 
  selected: boolean; 
  onClick: () => void;
}) {
  let bgColor = '';
  
  switch (type) {
    case 'gauge':
      bgColor = selected 
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-blue-50 dark:hover:bg-blue-900/30';
      break;
    case 'sum':
      bgColor = selected 
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-green-50 dark:hover:bg-green-900/30';
      break;
    case 'histogram':
      bgColor = selected 
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-purple-50 dark:hover:bg-purple-900/30';
      break;
    case 'summary':
      bgColor = selected 
        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' 
        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-orange-50 dark:hover:bg-orange-900/30';
      break;
    default:
      bgColor = selected 
        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300' 
        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
  }
  
  return (
    <button
      className={`text-xs px-2 py-1 rounded-full ${bgColor}`}
      onClick={onClick}
    >
      {type} ({count})
    </button>
  );
}

function TypeBadge({ type }: { type: string }) {
  let bgColor = '';
  
  switch (type) {
    case 'gauge':
      bgColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      break;
    case 'sum':
      bgColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case 'histogram':
      bgColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      break;
    case 'summary':
      bgColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      break;
    default:
      bgColor = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
  }
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${bgColor}`}>
      {type}
    </span>
  );
}

// Icon Components
function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}