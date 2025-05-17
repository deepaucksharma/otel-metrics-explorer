/**
 * Tests for the Cardinality Engine
 */
import { describe, it, expect } from 'vitest';
import { analyzeCardinality, simulateRecommendations } from '../cardinalityEngine';
import { ParsedSnapshot, MetricType } from '../../types/otlp';

// Create a simple test snapshot
const createTestSnapshot = (): ParsedSnapshot => ({
  id: 'test-snapshot',
  timestamp: Date.now(),
  resources: [
    {
      id: 'resource-1',
      attributes: {
        'service.name': 'test-service',
      },
      scopes: [
        {
          id: 'scope-1',
          name: 'test-scope',
          metricIds: ['metric-1', 'metric-2'],
        },
      ],
    },
  ],
  metrics: {
    'metric-1': {
      id: 'metric-1',
      name: 'system.cpu.usage',
      description: 'CPU usage',
      unit: 'percent',
      type: 'gauge' as MetricType,
      dataPoints: [
        {
          attributes: { cpu: 'cpu0', host: 'host1', region: 'us-east-1' },
          timeUnixNano: '1640995200000000000',
          startTimeUnixNano: '1640995100000000000',
          value: 45.5,
          seriesKey: 'system.cpu.usage|cpu=cpu0,host=host1,region=us-east-1',
        },
        {
          attributes: { cpu: 'cpu1', host: 'host1', region: 'us-east-1' },
          timeUnixNano: '1640995200000000000',
          startTimeUnixNano: '1640995100000000000',
          value: 32.1,
          seriesKey: 'system.cpu.usage|cpu=cpu1,host=host1,region=us-east-1',
        },
        {
          attributes: { cpu: 'cpu0', host: 'host2', region: 'us-east-1' },
          timeUnixNano: '1640995200000000000',
          startTimeUnixNano: '1640995100000000000',
          value: 41.2,
          seriesKey: 'system.cpu.usage|cpu=cpu0,host=host2,region=us-east-1',
        },
      ],
      attributeKeys: ['cpu', 'host', 'region'],
      resourceIds: ['resource-1'],
      scopeIds: ['scope-1'],
    },
    'metric-2': {
      id: 'metric-2',
      name: 'http.server.requests',
      description: 'HTTP server request count',
      unit: '{requests}',
      type: 'sum' as MetricType,
      monotonic: true,
      dataPoints: [
        {
          attributes: { method: 'GET', path: '/api/users', status: '200', host: 'host1' },
          timeUnixNano: '1640995200000000000',
          startTimeUnixNano: '1640995100000000000',
          value: 1250,
          seriesKey: 'http.server.requests|method=GET,path=/api/users,status=200,host=host1',
        },
        {
          attributes: { method: 'POST', path: '/api/users', status: '201', host: 'host1' },
          timeUnixNano: '1640995200000000000',
          startTimeUnixNano: '1640995100000000000',
          value: 542,
          seriesKey: 'http.server.requests|method=POST,path=/api/users,status=201,host=host1',
        },
        {
          attributes: { method: 'GET', path: '/api/products', status: '200', host: 'host1' },
          timeUnixNano: '1640995200000000000',
          startTimeUnixNano: '1640995100000000000',
          value: 418,
          seriesKey: 'http.server.requests|method=GET,path=/api/products,status=200,host=host1',
        },
      ],
      attributeKeys: ['method', 'path', 'status', 'host'],
      resourceIds: ['resource-1'],
      scopeIds: ['scope-1'],
    },
  },
  metricCount: 2,
  totalSeries: 6,
  totalDataPoints: 6,
});

// Create a snapshot with high cardinality
const createHighCardinalitySnapshot = (): ParsedSnapshot => {
  const snapshot = createTestSnapshot();
  
  // Add a metric with high cardinality due to a transaction_id attribute
  const metric3 = {
    id: 'metric-3',
    name: 'app.transactions',
    description: 'Transaction processing',
    unit: '{transactions}',
    type: 'sum' as MetricType,
    dataPoints: [],
    attributeKeys: ['transaction_id', 'user_id', 'region', 'status'],
    resourceIds: ['resource-1'],
    scopeIds: ['scope-1'],
  };
  
  // Generate 100 different transaction IDs
  for (let i = 0; i < 100; i++) {
    metric3.dataPoints.push({
      attributes: { 
        transaction_id: `tx-${i}`, 
        user_id: `user-${Math.floor(i / 10)}`, // 10 different users
        region: i % 2 === 0 ? 'us-east-1' : 'us-west-1', // 2 different regions
        status: i % 4 === 0 ? 'completed' : i % 4 === 1 ? 'pending' : i % 4 === 2 ? 'failed' : 'processing' // 4 different statuses
      },
      timeUnixNano: '1640995200000000000',
      startTimeUnixNano: '1640995100000000000',
      value: 1,
      seriesKey: `app.transactions|transaction_id=tx-${i},user_id=user-${Math.floor(i / 10)},region=${i % 2 === 0 ? 'us-east-1' : 'us-west-1'},status=${i % 4 === 0 ? 'completed' : i % 4 === 1 ? 'pending' : i % 4 === 2 ? 'failed' : 'processing'}`,
    });
  }
  
  // Add the metric to the snapshot
  snapshot.metrics['metric-3'] = metric3;
  snapshot.metricCount = 3;
  snapshot.totalSeries = 106; // 6 from original + 100 from new metric
  snapshot.totalDataPoints = 106;
  
  // Update the scope to include the new metric
  snapshot.resources[0].scopes[0].metricIds.push('metric-3');
  
  return snapshot;
};

describe('Cardinality Engine', () => {
  describe('analyzeCardinality', () => {
    it('should analyze a snapshot and return cardinality analysis', () => {
      const snapshot = createTestSnapshot();
      const analysis = analyzeCardinality(snapshot);
      
      // Check basic properties
      expect(analysis.snapshotId).toBe(snapshot.id);
      expect(analysis.totalMetrics).toBe(2);
      expect(analysis.totalCardinality).toBe(6);
      
      // Check metric analysis
      expect(Object.keys(analysis.metrics).length).toBe(2);
      expect(analysis.metrics['metric-1']).toBeDefined();
      expect(analysis.metrics['metric-2']).toBeDefined();
      
      // Check attribute impact
      expect(Object.keys(analysis.attributeImpact).length).toBeGreaterThan(0);
      
      // Check recommendations
      expect(analysis.overallRecommendations.length).toBeGreaterThan(0);
    });
    
    it('should correctly identify high-cardinality attributes', () => {
      const snapshot = createHighCardinalitySnapshot();
      const analysis = analyzeCardinality(snapshot);
      
      // Check that transaction_id is identified as high-cardinality
      const transactionIdImpact = Object.values(analysis.attributeImpact)
        .find(attr => attr.attributeKey === 'transaction_id');
      
      expect(transactionIdImpact).toBeDefined();
      expect(transactionIdImpact?.overallUniqueValues).toBe(100);
      expect(transactionIdImpact?.weightedImpact).toBeGreaterThan(0.5); // Should have high impact
      
      // Check that we have recommendations for transaction_id
      const transactionIdRecommendation = analysis.overallRecommendations
        .find(rec => rec.attributeKey === 'transaction_id');
      
      expect(transactionIdRecommendation).toBeDefined();
      expect(transactionIdRecommendation?.type).toBe('drop');
      expect(transactionIdRecommendation?.priority).toBe('high');
      
      // Check metric-specific analysis
      const transactionsMetric = analysis.metrics['metric-3'];
      expect(transactionsMetric).toBeDefined();
      expect(transactionsMetric.totalSeries).toBe(100);
      
      // Find the highest impact attribute for this metric
      const highestImpactFactor = transactionsMetric.attributeCardinalityFactors[0];
      expect(highestImpactFactor.attributeKey).toBe('transaction_id');
      expect(highestImpactFactor.uniqueValues).toBe(100);
    });
    
    it('should filter metrics based on options', () => {
      const snapshot = createHighCardinalitySnapshot();
      const analysis = analyzeCardinality(snapshot, {
        includeMetrics: ['system.cpu.usage'], // Only include one metric
      });
      
      // Should only have one metric
      expect(Object.keys(analysis.metrics).length).toBe(1);
      expect(analysis.metrics['metric-1']).toBeDefined();
      expect(analysis.metrics['metric-2']).toBeUndefined();
      expect(analysis.metrics['metric-3']).toBeUndefined();
      
      // Total cardinality should match only the included metric
      expect(analysis.totalCardinality).toBe(3); // 3 series in system.cpu.usage
    });
    
    it('should exclude metrics based on options', () => {
      const snapshot = createHighCardinalitySnapshot();
      const analysis = analyzeCardinality(snapshot, {
        excludeMetrics: ['app.transactions'], // Exclude the high-cardinality metric
      });
      
      // Should have two metrics
      expect(Object.keys(analysis.metrics).length).toBe(2);
      expect(analysis.metrics['metric-1']).toBeDefined();
      expect(analysis.metrics['metric-2']).toBeDefined();
      expect(analysis.metrics['metric-3']).toBeUndefined();
      
      // Total cardinality should match only the included metrics
      expect(analysis.totalCardinality).toBe(6); // 3 + 3 series in the two metrics
    });
  });
  
  describe('simulateRecommendations', () => {
    it('should simulate the impact of applying recommendations', () => {
      const snapshot = createHighCardinalitySnapshot();
      const analysis = analyzeCardinality(snapshot);
      
      // Find the transaction_id recommendation
      const recommendation = analysis.overallRecommendations
        .find(rec => rec.attributeKey === 'transaction_id');
      
      expect(recommendation).toBeDefined();
      
      // Create a cost model
      const costModel = {
        costPerSeries: 0.001,
        costPerDataPoint: 0.0000001,
        retentionPeriodDays: 30,
        scrapeIntervalSeconds: 60,
        currency: 'USD',
      };
      
      // Simulate applying the recommendation
      const impact = simulateRecommendations(snapshot, [recommendation!], costModel);
      
      // Check the impact
      expect(impact.originalCardinality).toBe(snapshot.totalSeries);
      expect(impact.cardinalityReduction).toBeGreaterThan(0);
      expect(impact.projectedCardinality).toBeLessThan(impact.originalCardinality);
      expect(impact.percentReduction).toBeGreaterThan(0);
      expect(impact.estimatedSavings).toBeGreaterThan(0);
      
      // Should affect the app.transactions metric
      expect(impact.metricsAffected).toContain('app.transactions');
    });
  });
});