/**
 * CardinalityOverview Component
 * 
 * Displays an overview of cardinality analysis results
 */

import React, { useState } from 'react';
import { useCardinalitySummary, useCardinalityMetrics, useHighImpactAttributes } from './CardinalitySelectors';
import { formatNumber, formatBytes, formatCost } from '../../utils/formatters';

interface CardinalityOverviewProps {
  analysisId?: string;
  onSelectMetric?: (metricId: string) => void;
  onSelectAttribute?: (attributeKey: string) => void;
}

export function CardinalityOverview({ 
  analysisId,
  onSelectMetric,
  onSelectAttribute
}: CardinalityOverviewProps) {
  // UI state
  const [sortBy, setSortBy] = useState<'name' | 'cardinality' | 'datapoints'>('cardinality');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterText, setFilterText] = useState('');
  
  // Get data from store
  const summary = useCardinalitySummary(analysisId);
  const metrics = useCardinalityMetrics({
    analysisId,
    filterText,
    sortBy,
    orderDir: sortOrder,
  });
  const highImpactAttributes = useHighImpactAttributes(analysisId, 5);
  
  // Handle sort toggle
  const handleSortChange = (field: 'name' | 'cardinality' | 'datapoints') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // If no data, show loading state
  if (!summary) {
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Cardinality Analysis</h2>
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">No cardinality data available. Upload a snapshot to begin analysis.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Overview Summary */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-2">Cardinality Overview</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800">Total Series</h3>
            <p className="text-2xl font-bold text-blue-900">{formatNumber(summary.totalCardinality)}</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded border border-green-100">
            <h3 className="text-sm font-medium text-green-800">Total Metrics</h3>
            <p className="text-2xl font-bold text-green-900">{formatNumber(summary.totalMetrics)}</p>
          </div>
          
          <div className="bg-purple-50 p-3 rounded border border-purple-100">
            <h3 className="text-sm font-medium text-purple-800">Total Data Points</h3>
            <p className="text-2xl font-bold text-purple-900">{formatNumber(summary.totalDataPoints)}</p>
          </div>
          
          <div className="bg-amber-50 p-3 rounded border border-amber-100">
            <h3 className="text-sm font-medium text-amber-800">Est. Monthly Storage</h3>
            <p className="text-2xl font-bold text-amber-900">{formatBytes(summary.totalCardinality * 100 * 30)}</p>
          </div>
        </div>
      </div>
      
      {/* High-Impact Attributes Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Top High-Impact Attributes</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attribute
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Values
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affected Metrics
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {highImpactAttributes.map((attr, index) => (
                <tr 
                  key={attr.attributeKey}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectAttribute?.(attr.attributeKey)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {attr.attributeKey}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${Math.round(attr.weightedImpact * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs mt-1 inline-block">
                      {Math.round(attr.weightedImpact * 100)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(attr.overallUniqueValues)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attr.affectedMetrics.length}
                  </td>
                </tr>
              ))}
              
              {highImpactAttributes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No high-impact attributes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Metrics List Section */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Metrics by Cardinality</h3>
          
          <div className="flex">
            <input
              type="text"
              placeholder="Filter metrics..."
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('name')}
                >
                  Metric Name
                  {sortBy === 'name' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('cardinality')}
                >
                  Series
                  {sortBy === 'cardinality' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('datapoints')}
                >
                  Data Points
                  {sortBy === 'datapoints' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Top Attribute
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric) => (
                <tr 
                  key={metric.metricId}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectMetric?.(metric.metricId)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {metric.metricName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(metric.totalSeries)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(metric.totalDataPoints)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.attributeCardinalityFactors.length > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {metric.attributeCardinalityFactors[0].attributeKey}
                        <span className="ml-1 text-blue-500">
                          ({metric.attributeCardinalityFactors[0].uniqueValues})
                        </span>
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.estimatedCost ? formatCost(metric.estimatedCost) : '-'}
                  </td>
                </tr>
              ))}
              
              {metrics.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No metrics found matching your filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}