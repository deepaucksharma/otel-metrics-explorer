import { useState } from 'react';
import { useStore } from '../../services/stateStore';
import { ParsedMetric, MetricType } from '../../contracts/otlp';

interface MetricCardProps {
  metricId: string;
  snapshotId: string;
  isExpanded: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export function MetricCard({ 
  metricId, 
  snapshotId, 
  isExpanded, 
  isSelected,
  onSelect 
}: MetricCardProps) {
  const metric = useStore(state => {
    const snapshot = state.snapshots[snapshotId];
    return snapshot?.metrics[metricId];
  });
  
  const toggleExpandedMetric = useStore(state => state.toggleExpandedMetric);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'attributes' | 'datapoints'>('overview');
  
  if (!metric) {
    return (
      <div className="card bg-neutral-100 dark:bg-neutral-800 p-4 animate-pulse">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
      </div>
    );
  }
  
  const handleToggleExpand = () => {
    toggleExpandedMetric(metricId);
  };
  
  const handleSelect = () => {
    onSelect();
  };
  
  return (
    <div 
      className={`card border-2 transition-colors ${
        isSelected 
          ? 'border-primary-500' 
          : 'border-transparent hover:border-primary-100'
      }`}
      onClick={handleSelect}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">{metric.name}</h3>
            <MetricTypeBadge type={metric.type} />
            {metric.unit && (
              <span className="text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded">
                {metric.unit}
              </span>
            )}
          </div>
          
          {metric.description && (
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
              {metric.description}
            </p>
          )}
        </div>
        
        <button
          className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleExpand();
          }}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse metric details' : 'Expand metric details'}
        >
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>
      
      {!isExpanded && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <DataPointMetric 
              label="Data Points" 
              value={metric.dataPoints?.length || 0} 
            />
            
            <DataPointMetric 
              label="Attributes" 
              value={metric.attributeKeys?.length || 0}
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              className="btn btn-outline py-1 px-3 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandedMetric(metricId);
                setActiveTab('overview');
              }}
            >
              Details
            </button>
          </div>
        </div>
      )}
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex space-x-1 border-b border-neutral-200 dark:border-neutral-700">
            <TabButton 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </TabButton>
            <TabButton 
              active={activeTab === 'attributes'} 
              onClick={() => setActiveTab('attributes')}
            >
              Attributes
            </TabButton>
            <TabButton 
              active={activeTab === 'datapoints'} 
              onClick={() => setActiveTab('datapoints')}
            >
              Data Points
            </TabButton>
          </div>
          
          <div className="p-2">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Metadata</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <MetadataItem label="Type" value={metric.type} />
                    <MetadataItem label="Unit" value={metric.unit || 'None'} />
                    <MetadataItem label="Temporality" value={metric.temporality || 'N/A'} />
                    <MetadataItem 
                      label="Monotonic" 
                      value={metric.monotonic === undefined ? 'N/A' : metric.monotonic ? 'Yes' : 'No'} 
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium">Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <MetadataItem label="Data Points" value={String(metric.dataPoints?.length || 0)} />
                    <MetadataItem label="Attributes" value={String(metric.attributeKeys?.length || 0)} />
                    <MetadataItem label="Resources" value={String(metric.resourceIds?.length || 0)} />
                    <MetadataItem label="Scopes" value={String(metric.scopeIds?.length || 0)} />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'attributes' && (
              <div>
                <h4 className="font-medium mb-2">Attribute Keys</h4>
                {metric.attributeKeys?.length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {metric.attributeKeys.map(key => (
                      <div 
                        key={key}
                        className="bg-neutral-100 dark:bg-neutral-700 rounded px-2 py-1 text-sm"
                      >
                        {key}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm italic">
                    No attributes available.
                  </p>
                )}
              </div>
            )}
            
            {activeTab === 'datapoints' && (
              <div>
                <h4 className="font-medium mb-2">Data Points</h4>
                {metric.dataPoints?.length ? (
                  <div className="text-sm">
                    {/* In a real implementation, we would have a paginated table of data points */}
                    <p className="text-neutral-500 dark:text-neutral-400">
                      This metric has {metric.dataPoints.length} data points.
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                      Data point visualization would be shown here.
                    </p>
                  </div>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm italic">
                    No data points available.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricTypeBadge({ type }: { type: MetricType }) {
  let backgroundColor = '';
  
  switch (type) {
    case 'gauge':
      backgroundColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      break;
    case 'sum':
      backgroundColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case 'histogram':
      backgroundColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      break;
    case 'summary':
      backgroundColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      break;
    default:
      backgroundColor = 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
  }
  
  return (
    <span className={`text-xs font-medium ${backgroundColor} px-2 py-0.5 rounded`}>
      {type}
    </span>
  );
}

function DataPointMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col text-sm">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function TabButton({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      className={`px-3 py-2 text-sm font-medium transition-colors ${
        active 
          ? 'text-primary-600 border-b-2 border-primary-500' 
          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  );
}
