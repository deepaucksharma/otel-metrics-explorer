import { useState } from 'react';
import { useStore } from '../../services/stateStore';
import { useMetricDefinitionById } from './MetricDefinitionSelector';
import { ParsedMetric } from '../../types/otlp';

interface DetailPanelProps {
  metricId: string | null;
  onClose: () => void;
}

export function DetailPanel({ metricId, onClose }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'attributes' | 'json'>('schema');
  
  // Get the selected metric from the store
  const metric = useStore(state => {
    if (!metricId) return null;
    return state.getMetricById(metricId);
  });
  
  // Get the metric definition (which has preprocessed metadata)
  const metricDefinition = useMetricDefinitionById(metricId);
  
  if (!metric) {
    return null;
  }
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 w-full max-w-md">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-lg font-semibold truncate" title={metric.name}>
          {metric.name}
        </h2>
        <button
          className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          onClick={onClose}
          aria-label="Close details panel"
        >
          <CloseIcon />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        <TabButton 
          active={activeTab === 'schema'} 
          onClick={() => setActiveTab('schema')}
        >
          Schema
        </TabButton>
        <TabButton 
          active={activeTab === 'attributes'} 
          onClick={() => setActiveTab('attributes')}
        >
          Attributes
        </TabButton>
        <TabButton 
          active={activeTab === 'json'} 
          onClick={() => setActiveTab('json')}
        >
          Raw JSON
        </TabButton>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'schema' && (
          <SchemaTab metric={metric} />
        )}
        
        {activeTab === 'attributes' && (
          <AttributesTab metric={metric} />
        )}
        
        {activeTab === 'json' && (
          <JsonTab metric={metric} />
        )}
      </div>
    </div>
  );
}

// Schema Tab Content
function SchemaTab({ metric }: { metric: ParsedMetric }) {
  return (
    <div className="space-y-6">
      {/* Basic Metadata */}
      <section>
        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-2">
          Metric Metadata
        </h3>
        <dl className="grid grid-cols-2 gap-4">
          <MetadataItem label="Name" value={metric.name} />
          <MetadataItem label="Type" value={metric.type} />
          {metric.unit && <MetadataItem label="Unit" value={metric.unit} />}
          {metric.temporality && <MetadataItem label="Temporality" value={metric.temporality} />}
          {metric.monotonic !== undefined && (
            <MetadataItem 
              label="Monotonic" 
              value={metric.monotonic ? 'Yes' : 'No'} 
            />
          )}
        </dl>
      </section>
      
      {/* Description */}
      {metric.description && (
        <section>
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-2">
            Description
          </h3>
          <p className="text-neutral-700 dark:text-neutral-300">
            {metric.description}
          </p>
        </section>
      )}
      
      {/* Data Points Summary */}
      <section>
        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-2">
          Data Points
        </h3>
        <dl className="grid grid-cols-2 gap-4">
          <MetadataItem 
            label="Count" 
            value={metric.dataPoints?.length.toString() || '0'} 
          />
          <MetadataItem 
            label="Attribute Keys" 
            value={metric.attributeKeys?.length.toString() || '0'} 
          />
        </dl>
      </section>
      
      {/* OTel Context */}
      <section>
        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-2">
          Instrumentation Context
        </h3>
        <dl className="grid grid-cols-1 gap-4">
          <MetadataItem 
            label="Resource Count" 
            value={metric.resourceIds?.length.toString() || '0'} 
          />
          <MetadataItem 
            label="Scope Count" 
            value={metric.scopeIds?.length.toString() || '0'} 
          />
        </dl>
      </section>
    </div>
  );
}

// Attributes Tab Content
function AttributesTab({ metric }: { metric: ParsedMetric }) {
  const [attributeView, setAttributeView] = useState<'keys' | 'values'>('keys');
  
  // Get the first datapoint to show its attributes (if any)
  const firstDataPoint = metric.dataPoints && metric.dataPoints.length > 0 
    ? metric.dataPoints[0] 
    : null;
  
  const attributeValues = firstDataPoint?.attributes || {};
  
  return (
    <div className="space-y-6">
      {/* View selector */}
      <div className="flex space-x-2">
        <button
          className={`px-3 py-1 text-sm rounded ${
            attributeView === 'keys' 
              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300' 
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
          }`}
          onClick={() => setAttributeView('keys')}
        >
          Attribute Keys
        </button>
        <button
          className={`px-3 py-1 text-sm rounded ${
            attributeView === 'values' 
              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300' 
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
          }`}
          onClick={() => setAttributeView('values')}
        >
          Sample Values
        </button>
      </div>
      
      {/* Attribute keys */}
      {attributeView === 'keys' && (
        <div>
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
            All Possible Attribute Keys ({metric.attributeKeys?.length || 0})
          </h3>
          
          {metric.attributeKeys && metric.attributeKeys.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {metric.attributeKeys.map(key => (
                <div 
                  key={key}
                  className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded text-sm"
                >
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400 italic">
              No attribute keys found.
            </p>
          )}
        </div>
      )}
      
      {/* Attribute values from first datapoint */}
      {attributeView === 'values' && (
        <div>
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
            Sample Values (from first data point)
          </h3>
          
          {Object.keys(attributeValues).length > 0 ? (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {Object.entries(attributeValues).map(([key, value]) => (
                <div key={key} className="py-2">
                  <div className="font-medium text-sm">{key}</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400 italic">
              No attribute values found in the first data point.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Json Tab Content
function JsonTab({ metric }: { metric: ParsedMetric }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
        Raw JSON Representation
      </h3>
      
      <div className="bg-neutral-800 text-neutral-200 p-4 rounded overflow-x-auto">
        <pre className="text-xs">
          {JSON.stringify(metric, null, 2)}
        </pre>
      </div>
      
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
        Note: This is the parsed internal representation, not the original OTLP JSON.
      </p>
    </div>
  );
}

// Helper Components
function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
        {value}
      </dd>
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
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        active 
          ? 'text-primary-600 border-b-2 border-primary-500' 
          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}