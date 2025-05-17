import type { Meta, StoryObj } from '@storybook/react';
import { RateDeltaCard } from './RateDeltaCard';
import { useStore } from '../../services/stateStore';
import { DiffedMetric, DiffedSeries } from '../../utils/diffEngine';

// Mock the store for Storybook
const mockDiffMetrics: Record<string, DiffedMetric> = {
  'process.cpu.utilization': {
    id: 'diff_metric_1',
    name: 'process.cpu.utilization',
    type: 'gauge',
    unit: 'percent',
    description: 'Process CPU utilization',
    series: {
      'process.cpu.utilization|cpu=0': {
        seriesKey: 'process.cpu.utilization|cpu=0',
        attributes: { cpu: '0' },
        valueA: 45.5,
        valueB: 65.2,
        delta: 19.7,
        rate: 1.97, // 19.7% per 10 seconds
      },
    },
  },
  'system.memory.usage': {
    id: 'diff_metric_2',
    name: 'system.memory.usage',
    type: 'gauge',
    unit: 'bytes',
    description: 'System memory usage',
    series: {
      'system.memory.usage|type=used': {
        seriesKey: 'system.memory.usage|type=used',
        attributes: { type: 'used' },
        valueA: 2147483648, // 2GB
        valueB: 3221225472, // 3GB
        delta: 1073741824, // 1GB increase
        rate: 107374182.4, // ~102.4MB per second
      },
    },
  },
  'http.server.requests': {
    id: 'diff_metric_3',
    name: 'http.server.requests',
    type: 'sum',
    monotonic: true,
    unit: '{requests}',
    description: 'Count of HTTP server requests',
    series: {
      'http.server.requests|method=GET,path=/api/users': {
        seriesKey: 'http.server.requests|method=GET,path=/api/users',
        attributes: { method: 'GET', path: '/api/users' },
        valueA: 1253,
        valueB: 1378,
        delta: 125,
        rate: 12.5, // 12.5 requests per second
      },
    },
  },
  'http.server.duration': {
    id: 'diff_metric_4',
    name: 'http.server.duration',
    type: 'histogram',
    unit: 'ms',
    description: 'Duration of HTTP server requests',
    series: {
      'http.server.duration|path=/api/users': {
        seriesKey: 'http.server.duration|path=/api/users',
        attributes: { path: '/api/users' },
        valueA: 128.5,
        valueB: 110.2,
        delta: -18.3,
        rate: -1.83, // 1.83ms improvement per second
      },
    },
  },
  'app.counter.resets': {
    id: 'diff_metric_5',
    name: 'app.counter.resets',
    type: 'sum',
    monotonic: true,
    description: 'Counter that resets',
    series: {
      'app.counter.resets|region=us-east': {
        seriesKey: 'app.counter.resets|region=us-east',
        attributes: { region: 'us-east' },
        valueA: 9876,
        valueB: 321,
        delta: -9555,
        resetDetected: true,
        valueWithReset: 321,
      },
    },
  },
};

// Mock time gap info
const mockTimeGap = {
  timeGapMs: 10000, // 10 seconds
  lastUpdated: Date.now(),
};

// Mock the useStore hook
jest.mock('../../services/stateStore', () => ({
  useStore: jest.fn((selector) => selector({
    diffStore: {
      currentDiff: {
        metrics: mockDiffMetrics,
        timeGapMs: mockTimeGap.timeGapMs,
        lastUpdated: mockTimeGap.lastUpdated,
        snapshotAId: 'snapA',
        snapshotBId: 'snapB',
        timestamp: Date.now(),
      },
    },
    getDiffedMetricByName: (name: string) => mockDiffMetrics[name],
    getDiffedSeriesByKey: (key: string) => {
      for (const metric of Object.values(mockDiffMetrics)) {
        if (metric.series[key]) {
          return metric.series[key];
        }
      }
      return undefined;
    },
    getRelatedSeriesForMetric: (name: string) => {
      const metric = mockDiffMetrics[name];
      return metric ? Object.values(metric.series) : [];
    },
    getDiffTimeInfo: () => mockTimeGap,
  })),
}));

const meta = {
  title: 'Metrics/RateDeltaCard',
  component: RateDeltaCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RateDeltaCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic stories showcasing different metric types and scenarios
export const CPUUtilization: Story = {
  args: {
    metricName: 'process.cpu.utilization',
  },
};

export const MemoryUsage: Story = {
  args: {
    metricName: 'system.memory.usage',
  },
};

export const HTTPRequests: Story = {
  args: {
    metricName: 'http.server.requests',
  },
};

export const PerformanceImprovement: Story = {
  args: {
    metricName: 'http.server.duration',
  },
};

export const CounterReset: Story = {
  args: {
    metricName: 'app.counter.resets',
  },
};

// Variant with compact mode
export const CompactCard: Story = {
  args: {
    metricName: 'http.server.requests',
    compact: true,
  },
};

// Variant without trend indicator
export const NoTrendIndicator: Story = {
  args: {
    metricName: 'http.server.requests',
    showTrend: false,
  },
};

// Card with specific series key
export const SpecificSeries: Story = {
  args: {
    metricName: 'http.server.requests',
    seriesKey: 'http.server.requests|method=GET,path=/api/users',
  },
};