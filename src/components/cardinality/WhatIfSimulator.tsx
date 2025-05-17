/**
 * WhatIfSimulator Component
 * 
 * Interactive interface for simulating cardinality reduction by dropping or transforming attributes
 */

import React, { useState, useEffect } from 'react';
import { 
  useStore, 
} from '../../state/store';
import {
  useCardinalityAnalysis,
  useHighImpactAttributes,
  useRecommendations,
  useActiveSimulation,
  useCostModel
} from './CardinalitySelectors';
import { simulateRecommendations } from '../../services/cardinalityRunner';
import { formatNumber, formatPercent, formatCost } from '../../utils/formatters';
import { Recommendation } from '../../utils/cardinalityEngine';

interface WhatIfSimulatorProps {
  analysisId?: string;
}

export function WhatIfSimulator({ analysisId }: WhatIfSimulatorProps) {
  // Get state from store
  const selectedSnapshotId = useStore(state => state.uiState.selectedSnapshotId);
  const targetId = analysisId || selectedSnapshotId;
  
  const analysis = useCardinalityAnalysis(targetId);
  const highImpactAttributes = useHighImpactAttributes(targetId);
  const recommendations = useRecommendations(targetId);
  const activeSimulation = useActiveSimulation();
  const costModel = useCostModel();
  
  // Local state
  const [selectedRecommendations, setSelectedRecommendations] = useState<Recommendation[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'custom'>('recommendations');
  
  // Store actions
  const setSimulationResults = useStore(state => state.setSimulationResult);
  
  // Reset selected recommendations when analysis changes
  useEffect(() => {
    setSelectedRecommendations([]);
    setSimulationResult(null);
  }, [targetId]);
  
  // Toggle a recommendation selection
  const toggleRecommendation = (recommendation: Recommendation) => {
    const isSelected = selectedRecommendations.some(
      r => r.attributeKey === recommendation.attributeKey && r.type === recommendation.type
    );
    
    if (isSelected) {
      setSelectedRecommendations(prev => 
        prev.filter(r => !(r.attributeKey === recommendation.attributeKey && r.type === recommendation.type))
      );
    } else {
      setSelectedRecommendations(prev => [...prev, recommendation]);
    }
  };
  
  // Run simulation based on selected recommendations
  const runSimulation = async () => {
    if (!targetId || !selectedRecommendations.length) return;
    
    setSimulationLoading(true);
    
    try {
      const result = await simulateRecommendations(targetId, selectedRecommendations);
      setSimulationResult(result);
      
      // Save to store for persistence
      if (result) {
        setSimulationResults(targetId, result);
      }
    } catch (error) {
      console.error('Error running simulation:', error);
      // Show error notification here
    } finally {
      setSimulationLoading(false);
    }
  };
  
  // If no analysis is available
  if (!analysis) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">What-If Simulator</h2>
        <p className="text-gray-500">
          No cardinality analysis available. Upload a snapshot to begin simulation.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">What-If Simulator</h2>
        <p className="text-gray-500 mt-1">
          Simulate the impact of various cardinality reduction strategies
        </p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              selectedTab === 'recommendations'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTab('recommendations')}
          >
            Recommendations
          </button>
          <button
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              selectedTab === 'custom'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTab('custom')}
          >
            Custom Simulation
          </button>
        </nav>
      </div>
      
      {/* Recommendations Tab */}
      {selectedTab === 'recommendations' && (
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recommended Actions</h3>
            <p className="text-sm text-gray-500">
              Select one or more recommendations to simulate their combined impact
            </p>
          </div>
          
          <div className="overflow-hidden mb-6 border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recommendation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recommendations.map((rec, index) => {
                  const isSelected = selectedRecommendations.some(
                    r => r.attributeKey === rec.attributeKey && r.type === rec.type
                  );
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={isSelected}
                          onChange={() => toggleRecommendation(rec)}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {rec.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-green-600 mr-2">
                            -{formatNumber(rec.impact.cardinalityReduction)} series
                          </span>
                          <span className="text-xs">
                            ({formatPercent(rec.impact.percentReduction / 100)})
                          </span>
                        </div>
                        {rec.impact.estimatedSavings && (
                          <div className="text-xs text-green-600 mt-1">
                            Est. savings: {formatCost(rec.impact.estimatedSavings)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rec.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : rec.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                
                {recommendations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No recommendations available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">
                {selectedRecommendations.length} recommendations selected
              </span>
            </div>
            <button
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={runSimulation}
              disabled={selectedRecommendations.length === 0 || simulationLoading}
            >
              {simulationLoading ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      )}
      
      {/* Custom Simulation Tab */}
      {selectedTab === 'custom' && (
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Custom Simulation</h3>
            <p className="text-sm text-gray-500">
              Manually select attributes to drop or transform
            </p>
          </div>
          
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-2">High-Impact Attributes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highImpactAttributes.map(attr => (
                <div key={attr.attributeKey} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-blue-600">{attr.attributeKey}</h5>
                      <p className="text-sm text-gray-500">
                        {formatNumber(attr.overallUniqueValues)} unique values across {attr.affectedMetrics.length} metrics
                      </p>
                    </div>
                    
                    <div className="ml-4">
                      <button
                        className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full hover:bg-red-200"
                        onClick={() => {
                          // Add to selected recommendations
                          const newRec: Recommendation = {
                            type: 'drop',
                            attributeKey: attr.attributeKey,
                            targetMetrics: attr.affectedMetrics,
                            description: `Drop attribute '${attr.attributeKey}' across ${attr.affectedMetrics.length} metrics`,
                            impact: {
                              cardinalityReduction: Math.round(analysis.totalCardinality * attr.weightedImpact),
                              percentReduction: Math.round(attr.weightedImpact * 100)
                            },
                            priority: attr.weightedImpact > 0.3 ? 'high' : 'medium'
                          };
                          
                          setSelectedRecommendations(prev => [...prev, newRec]);
                        }}
                      >
                        Drop
                      </button>
                      
                      <button
                        className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full ml-2 hover:bg-yellow-200"
                        onClick={() => {
                          // Add to selected recommendations
                          const newRec: Recommendation = {
                            type: 'transform',
                            attributeKey: attr.attributeKey,
                            targetMetrics: attr.affectedMetrics,
                            description: `Transform values of '${attr.attributeKey}' to reduce cardinality`,
                            impact: {
                              cardinalityReduction: Math.round(analysis.totalCardinality * attr.weightedImpact * 0.7),
                              percentReduction: Math.round(attr.weightedImpact * 70)
                            },
                            priority: 'medium',
                            transformRegex: 's/(.{10}).*/\\1.../'
                          };
                          
                          setSelectedRecommendations(prev => [...prev, newRec]);
                        }}
                      >
                        Transform
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">
                {selectedRecommendations.length} actions selected
              </span>
            </div>
            <button
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={runSimulation}
              disabled={selectedRecommendations.length === 0 || simulationLoading}
            >
              {simulationLoading ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      )}
      
      {/* Simulation Results */}
      {simulationResult && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Simulation Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Original Cardinality</h4>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(simulationResult.originalCardinality)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Projected Cardinality</h4>
              <p className="text-2xl font-bold text-green-600">{formatNumber(simulationResult.projectedCardinality)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Reduction</h4>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(simulationResult.cardinalityReduction)}
                </p>
                <p className="ml-2 text-lg text-green-600">
                  ({formatPercent(simulationResult.percentReduction / 100)})
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
            <h4 className="text-md font-medium text-gray-800 mb-2">Estimated Monthly Savings</h4>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-green-600">
                {formatCost(simulationResult.estimatedSavings)}
              </p>
              <p className="ml-3 text-gray-500 text-sm">
                Based on {formatNumber(simulationResult.cardinalityReduction)} series at {formatCost(costModel.costPerSeries)} per series
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-md font-medium text-gray-800 mb-2">Implementation Details</h4>
            
            {selectedRecommendations.map((rec, index) => (
              <div key={index} className="mb-2 pb-2 border-b border-gray-100 last:border-b-0 last:mb-0 last:pb-0">
                <p className="font-medium">{rec.description}</p>
                
                {rec.type === 'drop' && (
                  <pre className="text-sm bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                    {`# OTLP Collector config snippet
processors:
  attributes/drop_${rec.attributeKey}:
    actions:
      - key: ${rec.attributeKey}
        action: delete`}
                  </pre>
                )}
                
                {rec.type === 'transform' && rec.transformRegex && (
                  <pre className="text-sm bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                    {`# OTLP Collector config snippet
processors:
  transform/truncate_${rec.attributeKey}:
    metric_statements:
      - context: datapoint
        statements:
          - set(attributes["${rec.attributeKey}"], regex_replace(attributes["${rec.attributeKey}"], "${rec.transformRegex}"))`}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}