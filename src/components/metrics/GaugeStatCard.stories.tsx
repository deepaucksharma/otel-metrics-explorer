import type { Meta, StoryObj } from '@storybook/react';
import { GaugeStatCard } from './GaugeStatCard';

// Mock store data
import { useStore } from '../../services/stateStore';

// Mock the Zustand store
jest.mock('../../services/stateStore', () => ({
  useStore: jest.fn(),
}));

// Create different mock implementations for different story scenarios
const mockMemoryMetric = {
  id: 'memory-metric',
  name: 'process.runtime.jvm.memory.heap',
  description: 'JVM heap memory usage',
  unit: 'bytes',
  type: 'gauge',
  dataPoints: [
    { value: 1073741824, timeUnixNano: '1620000000000000000' }, // ~1GB
  ],
  attributeKeys: ['pool', 'type'],
  resourceIds: ['resource-1'],
  scopeIds: ['scope-1'],
};

const mockCpuMetric = {
  id: 'cpu-metric',
  name: 'process.cpu.utilization',
  description: 'CPU utilization',
  unit: '%',
  type: 'gauge',
  dataPoints: [
    { value: 42.5, timeUnixNano: '1620000000000000000' },
  ],
  attributeKeys: ['core', 'state'],
  resourceIds: ['resource-1'],
  scopeIds: ['scope-1'],
};

const mockLatencyMetric = {
  id: 'latency-metric',
  name: 'http.server.request.duration',
  description: 'HTTP request duration',
  unit: 's',
  type: 'gauge',
  dataPoints: [
    { value: 0.125, timeUnixNano: '1620000000000000000' }, // 125ms
  ],
  attributeKeys: ['method', 'status_code'],
  resourceIds: ['resource-1'],
  scopeIds: ['scope-1'],
};

const mockEmptyMetric = {
  id: 'empty-metric',
  name: 'empty.metric',
  description: 'Metric with no data points',
  unit: 'count',
  type: 'gauge',
  dataPoints: [],
  attributeKeys: [],
  resourceIds: ['resource-1'],
  scopeIds: ['scope-1'],
};

const meta: Meta<typeof GaugeStatCard> = {
  title: 'Components/Metrics/GaugeStatCard',
  component: GaugeStatCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GaugeStatCard>;

// Memory usage story
export const MemoryUsage: Story = {
  args: {
    metricId: 'memory-metric',
    snapshotId: 'snapshot-1',
    showLabels: true,
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation(selector => 
        selector({
          snapshots: {
            'snapshot-1': {
              metrics: {
                'memory-metric': mockMemoryMetric,
              },
            },
          },
        })
      );
      return <Story />;
    },
  ],
};

// CPU usage story
export const CpuUtilization: Story = {
  args: {
    metricId: 'cpu-metric',
    snapshotId: 'snapshot-1',
    showLabels: true,
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation(selector => 
        selector({
          snapshots: {
            'snapshot-1': {
              metrics: {
                'cpu-metric': mockCpuMetric,
              },
            },
          },
        })
      );
      return <Story />;
    },
  ],
};

// HTTP latency story
export const HttpLatency: Story = {
  args: {
    metricId: 'latency-metric',
    snapshotId: 'snapshot-1',
    showLabels: true,
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation(selector => 
        selector({
          snapshots: {
            'snapshot-1': {
              metrics: {
                'latency-metric': mockLatencyMetric,
              },
            },
          },
        })
      );
      return <Story />;
    },
  ],
};

// Empty story
export const NoDataPoints: Story = {
  args: {
    metricId: 'empty-metric',
    snapshotId: 'snapshot-1',
    showLabels: true,
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation(selector => 
        selector({
          snapshots: {
            'snapshot-1': {
              metrics: {
                'empty-metric': mockEmptyMetric,
              },
            },
          },
        })
      );
      return <Story />;
    },
  ],
};

// Compact version
export const CompactMemoryUsage: Story = {
  args: {
    metricId: 'memory-metric',
    snapshotId: 'snapshot-1',
    compact: true,
    showLabels: true,
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation(selector => 
        selector({
          snapshots: {
            'snapshot-1': {
              metrics: {
                'memory-metric': mockMemoryMetric,
              },
            },
          },
        })
      );
      return <Story />;
    },
  ],
};

// No labels
export const NoLabels: Story = {
  args: {
    metricId: 'cpu-metric',
    snapshotId: 'snapshot-1',
    showLabels: false,
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation(selector => 
        selector({
          snapshots: {
            'snapshot-1': {
              metrics: {
                'cpu-metric': mockCpuMetric,
              },
            },
          },
        })
      );
      return <Story />;
    },
  ],
};

// Error state (metric not found)
export const MetricNotFound: Story = {
  args: {
    metricId: 'non-existent-metric',
    snapshotId: 'snapshot-1',
    showLabels: true,
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation(selector => 
        selector({
          snapshots: {
            'snapshot-1': {
              metrics: {},
            },
          },
        })
      );
      return <Story />;
    },
  ],
};