import { useState } from 'react';
import { useStore } from '../../services/stateStore';
import { eventBus } from '../../services/eventBus';

export interface GaugeStatCardProps {
  metricId: string;
  snapshotId: string;
  compact?: boolean;
  showLabels?: boolean;
}

export function GaugeStatCard({
  metricId,
  snapshotId,
  compact = false,
  showLabels = true,
}: GaugeStatCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get metric data from store
  const metric = useStore(state => {
    const snapshot = state.snapshots[snapshotId];
    return snapshot?.metrics[metricId];
  });

  // Get latest value from the metric's datapoints
  const latestValue = useStore(state => {
    // First try to get value from metric definitions (optimized)
    const metric = state.snapshots[snapshotId]?.metrics[metricId];
    if (!metric) return null;
    
    const metricDef = state.metricDefinitions[metric.name];
    if (metricDef?.lastValue !== undefined) {
      return metricDef.lastValue;
    }
    
    // Fallback to direct datapoints access
    const dataPoints = metric.dataPoints;
    if (!dataPoints || dataPoints.length === 0) return null;
    
    // For gauge metrics, use the most recent datapoint's value
    // For most precise results, we would sort by timeUnixNano, but for simplicity
    // we'll assume the last datapoint in the array is the most recent
    const latestDataPoint = dataPoints[dataPoints.length - 1];
    return latestDataPoint.value;
  });
  
  if (!metric) {
    return (
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mx-auto mb-2"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
      </div>
    );
  }

  // Handle click to inspect this metric
  const handleInspect = () => {
    eventBus.emit('ui.inspect', { metricId });
  };

  // Format value based on unit if present
  const formattedValue = formatValue(latestValue, metric.unit);
  
  return (
    <div
      className={`${
        compact ? 'p-3' : 'p-4'
      } bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer relative ${
        isHovered ? 'ring-2 ring-primary-300 dark:ring-primary-700' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleInspect}
    >
      <div className={`flex ${compact ? 'flex-row items-center' : 'flex-col'} justify-between`}>
        <div className={`${compact ? 'mr-4' : 'mb-2'}`}>
          <h3 
            className={`font-medium text-neutral-800 dark:text-neutral-100 truncate ${
              compact ? 'text-sm' : 'text-base'
            }`}
            title={metric.name}
          >
            {metric.name}
          </h3>
          {showLabels && metric.description && (
            <p 
              className={`text-neutral-500 dark:text-neutral-400 truncate ${
                compact ? 'text-xs' : 'text-sm'
              }`}
              title={metric.description}
            >
              {metric.description}
            </p>
          )}
        </div>
        
        <div className={`${compact ? '' : 'text-center'}`}>
          <div 
            className={`font-bold text-neutral-900 dark:text-neutral-50 ${
              compact ? 'text-lg' : 'text-3xl'
            }`}
          >
            {latestValue === null ? 'N/A' : formattedValue}
          </div>
          {showLabels && metric.unit && (
            <div 
              className={`text-neutral-500 dark:text-neutral-400 ${
                compact ? 'text-xs' : 'text-sm'
              }`}
            >
              {metric.unit}
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute top-2 right-2">
        <span 
          className="inline-block w-2 h-2 rounded-full bg-green-500"
          title="Gauge metric"
        ></span>
      </div>
    </div>
  );
}

// Helper to format value based on unit
function formatValue(value: number | null, unit?: string): string {
  if (value === null) return 'N/A';
  
  // Format based on unit type
  if (unit) {
    // Bytes formatting
    if (unit.toLowerCase() === 'bytes' || unit.toLowerCase() === 'by') {
      return formatBytes(value);
    }
    
    // Seconds formatting
    if (unit.toLowerCase() === 's' || unit.toLowerCase() === 'seconds') {
      return formatSeconds(value);
    }
    
    // Percentage formatting
    if (unit.toLowerCase() === '%' || unit.toLowerCase() === 'percent') {
      return `${value.toFixed(1)}%`;
    }
  }
  
  // Default number formatting
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  // Handle decimals
  if (Number.isInteger(value)) {
    return value.toString();
  }
  
  return value.toFixed(2);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSeconds(seconds: number): string {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${remainingMinutes}m`;
}