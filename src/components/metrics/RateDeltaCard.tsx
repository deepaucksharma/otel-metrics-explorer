/**
 * RateDeltaCard Component
 * 
 * Displays metric rate and delta information for counter-type metrics
 * with support for showing counter resets.
 */

import { useState } from 'react';
import { useStore } from '../../services/stateStore';
import { eventBus } from '../../services/eventBus';
import { formatRate, formatDelta } from '../../utils/diffEngine';
import type { DiffedSeries } from '../../utils/diffEngine';

export interface RateDeltaCardProps {
  metricName: string;
  seriesKey?: string; // If not provided, will show the first series found for this metric
  compact?: boolean;
  showTrend?: boolean;
}

export function RateDeltaCard({
  metricName,
  seriesKey,
  compact = false,
  showTrend = true,
}: RateDeltaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get diffed metric and diffed series from the store
  const metric = useStore(state => {
    try {
      return state.getDiffedMetricByName(metricName);
    } catch (error) {
      console.error(`Error fetching diffed metric '${metricName}':`, error);
      return undefined;
    }
  });
  
  const series = useStore(state => {
    try {
      if (seriesKey) {
        return state.getDiffedSeriesByKey(seriesKey);
      } else if (metric) {
        const allSeries = state.getRelatedSeriesForMetric(metricName);
        return allSeries.length > 0 ? allSeries[0] : undefined;
      }
      return undefined;
    } catch (error) {
      console.error(`Error fetching diffed series for metric '${metricName}':`, error);
      return undefined;
    }
  });
  
  const diffTimeInfo = useStore(state => state.getDiffTimeInfo());
  
  // Handle inspect event emission
  const handleInspect = () => {
    eventBus.emit('ui.inspect', { metricName });
  };
  
  // Loading state if no metric or series found
  if (!metric || !series) {
    return (
      <div className={`${
        compact ? 'p-3' : 'p-4'
      } bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse`}>
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mx-auto mb-2"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
      </div>
    );
  }
  
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
          {metric.description && (
            <p 
              className={`text-neutral-500 dark:text-neutral-400 truncate ${
                compact ? 'text-xs' : 'text-sm'
              }`}
              title={metric.description}
            >
              {metric.description}
            </p>
          )}
          
          {/* Series attribute info */}
          {!compact && Object.keys(series.attributes).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(series.attributes).map(([key, value]) => (
                <span 
                  key={key}
                  className="text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded"
                  title={`${key}=${value}`}
                >
                  {key}={String(value).substring(0, 10)}{String(value).length > 10 ? '...' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className={`${compact ? '' : 'text-center'}`}>
          {/* Rate value */}
          <div 
            className={`font-bold ${
              compact ? 'text-lg' : 'text-3xl'
            } ${getRateColorClass(series)}`}
          >
            {formatRateValue(series, metric.unit)}
          </div>
          
          {/* Delta subheading */}
          <div 
            className={`${
              compact ? 'text-xs' : 'text-sm'
            } flex items-center justify-center text-neutral-500 dark:text-neutral-400`}
          >
            {series?.resetDetected ? (
              <span className="flex items-center">
                <ResetIcon className="mr-1" />
                Reset Detected
              </span>
            ) : (
              <>
                {showTrend && series?.delta !== undefined && (
                  <span className="mr-1">
                    {series.delta > 0 ? <UpIcon /> : series.delta < 0 ? <DownIcon /> : <NeutralIcon />}
                  </span>
                )}
                <span>
                  {series?.delta !== undefined 
                    ? `Δ ${formatDelta(series.delta, metric.unit)}` 
                    : 'No change detected'}
                </span>
              </>
            )}
          </div>
          
          {/* Time info */}
          {!compact && diffTimeInfo.timeGapMs > 0 && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              over {formatTimeSpan(diffTimeInfo.timeGapMs)}
            </div>
          )}
        </div>
      </div>
      
      {/* Type indicator */}
      <div className="absolute top-2 right-2">
        <span 
          className="inline-block w-2 h-2 rounded-full bg-green-500"
          title={`${metric.type} metric${metric.monotonic ? ' (monotonic)' : ''}`}
        />
      </div>
    </div>
  );
}

/**
 * Format rate value based on series data and units
 */
function formatRateValue(series: DiffedSeries, unit?: string): string {
  if (series.resetDetected) {
    // For reset counters, show the new value after reset
    if (series.valueWithReset !== undefined) {
      return formatDelta(series.valueWithReset, unit);
    }
    return formatRate(0, unit);
  }
  
  if (series.rate !== undefined) {
    return formatRate(series.rate, unit);
  }
  
  return 'N/A';
}

/**
 * Get CSS class for coloring the rate based on its value
 */
function getRateColorClass(series: DiffedSeries): string {
  if (series.resetDetected) {
    return 'text-amber-500 dark:text-amber-400';
  }
  
  if (series.rate === undefined) {
    return 'text-neutral-500 dark:text-neutral-400';
  }
  
  if (series.rate > 0) {
    return 'text-green-600 dark:text-green-400';
  }
  
  if (series.rate < 0) {
    return 'text-red-600 dark:text-red-400';
  }
  
  return 'text-neutral-800 dark:text-neutral-200';
}

/**
 * Format a time span in milliseconds into a human-readable string
 */
function formatTimeSpan(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}

// Icon components
function UpIcon() {
  return (
    <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14l5-5 5 5H7z" />
    </svg>
  );
}

function DownIcon() {
  return (
    <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}

function NeutralIcon() {
  return (
    <svg className="w-3 h-3 text-neutral-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 12h14" strokeWidth="2" stroke="currentColor" />
    </svg>
  );
}

function ResetIcon({ className = "" }) {
  return (
    <svg className={`w-3 h-3 text-amber-500 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4v5h5M4 4l7 7m9-7v5h-5m5-5l-7 7" />
    </svg>
  );
}