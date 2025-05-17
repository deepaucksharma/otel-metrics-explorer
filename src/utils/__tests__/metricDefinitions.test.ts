import { buildMetricDefinitionsFromSnapshots } from '../metricDefinitions';
import { ParsedSnapshot } from '../../types/otlp';

describe('metricDefinitions', () => {
  describe('buildMetricDefinitionsFromSnapshots', () => {
    it('should create metric definitions from a single snapshot', () => {
      // Mock parsed snapshot
      const mockSnapshot: ParsedSnapshot = {
        id: 'snapshot-1',
        timestamp: 1620000000000,
        resources: [],
        metrics: {
          'metric-1': {
            id: 'metric-1',
            name: 'system.cpu.usage',
            description: 'CPU usage',
            unit: '%',
            type: 'gauge',
            dataPoints: [
              { 
                value: 45.5, 
                timeUnixNano: '1620000000000000000',
                attributes: {},
                seriesKey: 'system.cpu.usage|'
              },
              { 
                value: 50.2, 
                timeUnixNano: '1620000100000000000',
                attributes: { cpu: '0' },
                seriesKey: 'system.cpu.usage|cpu=0'
              },
              { 
                value: 30.1, 
                timeUnixNano: '1620000100000000000',
                attributes: { cpu: '1' },
                seriesKey: 'system.cpu.usage|cpu=1'
              }
            ],
            attributeKeys: ['cpu'],
            resourceIds: ['resource-1'],
            scopeIds: ['scope-1']
          },
          'metric-2': {
            id: 'metric-2',
            name: 'system.memory.usage',
            description: 'Memory usage',
            unit: 'bytes',
            type: 'gauge',
            dataPoints: [
              { 
                value: 1073741824, // 1GB
                timeUnixNano: '1620000000000000000',
                attributes: {},
                seriesKey: 'system.memory.usage|'
              }
            ],
            attributeKeys: [],
            resourceIds: ['resource-1'],
            scopeIds: ['scope-1']
          }
        },
        metricCount: 2,
        totalSeries: 4,
        totalDataPoints: 4
      };

      const snapshots = {
        'snapshot-1': mockSnapshot
      };

      const result = buildMetricDefinitionsFromSnapshots(snapshots);

      // Check the structure of the returned definitions
      expect(Object.keys(result)).toHaveLength(2);
      expect(result).toHaveProperty('system.cpu.usage');
      expect(result).toHaveProperty('system.memory.usage');
      
      // Check CPU metric definition details
      const cpuDef = result['system.cpu.usage'];
      expect(cpuDef.name).toBe('system.cpu.usage');
      expect(cpuDef.description).toBe('CPU usage');
      expect(cpuDef.unit).toBe('%');
      expect(cpuDef.type).toBe('gauge');
      expect(cpuDef.attributeKeys).toContain('cpu');
      expect(cpuDef.dataPointCount).toBe(3);
      expect(cpuDef.seriesCount).toBe(3); // 3 unique series
      expect(cpuDef.minValue).toBeCloseTo(30.1);
      expect(cpuDef.maxValue).toBeCloseTo(50.2);
      expect(cpuDef.avgValue).toBeCloseTo((45.5 + 50.2 + 30.1) / 3);
      expect(cpuDef.lastValue).toBeCloseTo(30.1); // Last value in the array
      
      // Check Memory metric definition details
      const memDef = result['system.memory.usage'];
      expect(memDef.name).toBe('system.memory.usage');
      expect(memDef.unit).toBe('bytes');
      expect(memDef.dataPointCount).toBe(1);
      expect(memDef.seriesCount).toBe(1);
      expect(memDef.lastValue).toBe(1073741824);
    });

    it('should properly update definitions from multiple snapshots', () => {
      // Mock snapshots
      const mockSnapshot1: ParsedSnapshot = {
        id: 'snapshot-1',
        timestamp: 1620000000000,
        resources: [],
        metrics: {
          'metric-1-a': {
            id: 'metric-1-a',
            name: 'http.server.requests',
            description: 'HTTP server requests',
            unit: 'count',
            type: 'sum',
            temporality: 'delta',
            monotonic: true,
            dataPoints: [
              { 
                value: 100, 
                timeUnixNano: '1620000000000000000',
                attributes: { method: 'GET', status: '200' },
                seriesKey: 'http.server.requests|method=GET,status=200'
              }
            ],
            attributeKeys: ['method', 'status'],
            resourceIds: ['resource-1'],
            scopeIds: ['scope-1']
          }
        },
        metricCount: 1,
        totalSeries: 1,
        totalDataPoints: 1
      };

      const mockSnapshot2: ParsedSnapshot = {
        id: 'snapshot-2',
        timestamp: 1620000100000, // Later timestamp
        resources: [],
        metrics: {
          'metric-1-b': {
            id: 'metric-1-b',
            name: 'http.server.requests', // Same metric name, different instance
            description: 'HTTP server requests',
            unit: 'count',
            type: 'sum',
            temporality: 'delta',
            monotonic: true,
            dataPoints: [
              { 
                value: 150, 
                timeUnixNano: '1620000100000000000',
                attributes: { method: 'GET', status: '200' },
                seriesKey: 'http.server.requests|method=GET,status=200'
              },
              { 
                value: 50, 
                timeUnixNano: '1620000100000000000',
                attributes: { method: 'POST', status: '201' },
                seriesKey: 'http.server.requests|method=POST,status=201'
              }
            ],
            attributeKeys: ['method', 'status', 'path'], // Added path attribute
            resourceIds: ['resource-1'],
            scopeIds: ['scope-1']
          }
        },
        metricCount: 1,
        totalSeries: 2,
        totalDataPoints: 2
      };

      const snapshots = {
        'snapshot-1': mockSnapshot1,
        'snapshot-2': mockSnapshot2
      };

      const result = buildMetricDefinitionsFromSnapshots(snapshots);

      // Check the structure of the returned definitions
      expect(Object.keys(result)).toHaveLength(1);
      expect(result).toHaveProperty('http.server.requests');
      
      // Check the merged definition details
      const reqDef = result['http.server.requests'];
      expect(reqDef.name).toBe('http.server.requests');
      expect(reqDef.type).toBe('sum');
      expect(reqDef.temporality).toBe('delta');
      expect(reqDef.monotonic).toBe(true);
      
      // Should have merged attribute keys from both snapshots
      expect(reqDef.attributeKeys).toHaveLength(3);
      expect(reqDef.attributeKeys).toContain('method');
      expect(reqDef.attributeKeys).toContain('status');
      expect(reqDef.attributeKeys).toContain('path');
      
      // Should have aggregated counts
      expect(reqDef.dataPointCount).toBe(3); // 1 + 2
      expect(reqDef.seriesCount).toBe(3); // 1 + 2 unique series
      
      // Should have correct min/max/avg
      expect(reqDef.minValue).toBe(50);
      expect(reqDef.maxValue).toBe(150);
      
      // Last value should be from the most recent snapshot
      expect(reqDef.lastValue).toBe(50); // Last datapoint in snapshot-2
    });

    it('should handle empty snapshots correctly', () => {
      const emptySnapshots = {};
      const result = buildMetricDefinitionsFromSnapshots(emptySnapshots);
      expect(result).toEqual({});
    });
  });
});