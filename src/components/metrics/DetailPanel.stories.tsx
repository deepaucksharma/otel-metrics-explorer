import type { Meta, StoryObj } from '@storybook/react';
import { DetailPanel } from './DetailPanel';

// Mock store data
import { useStore } from '../../services/stateStore';

// Mock the Zustand store
jest.mock('../../services/stateStore', () => ({
  useStore: jest.fn(),
}));

// Mock metric
const mockMetric = {
  id: 'test-metric-id',
  name: 'process.runtime.jvm.memory.heap',
  description: 'JVM heap memory usage in bytes',
  unit: 'bytes',
  type: 'gauge',
  dataPoints: [
    {
      value: 1073741824, // 1GB
      timeUnixNano: '1620000000000000000',
      attributes: {
        pool: 'eden',
        type: 'heap'
      },
      seriesKey: 'process.runtime.jvm.memory.heap|pool=eden,type=heap'
    }
  ],
  attributeKeys: ['pool', 'type'],
  resourceIds: ['resource-1'],
  scopeIds: ['scope-1']
};

// Mock metric definition
const mockDefinition = {
  id: 'test-metric-id',
  name: 'process.runtime.jvm.memory.heap',
  description: 'JVM heap memory usage in bytes',
  unit: 'bytes',
  type: 'gauge',
  attributeKeys: ['pool', 'type'],
  dataPointCount: 1,
  seriesCount: 1,
  minValue: 1073741824,
  maxValue: 1073741824,
  avgValue: 1073741824,
  lastValue: 1073741824
};

const meta: Meta<typeof DetailPanel> = {
  title: 'Components/Metrics/DetailPanel',
  component: DetailPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px', height: '600px', border: '1px solid #e2e8f0' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DetailPanel>;

// Basic story with selected metric
export const Default: Story = {
  args: {
    metricId: 'test-metric-id',
    onClose: () => console.log('Close panel clicked'),
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation((selector) => {
        // This mock simulates what the getMetricById selector would return
        const state = {
          getMetricById: (id: string) => id === 'test-metric-id' ? mockMetric : null,
          metricDefinitions: {
            'process.runtime.jvm.memory.heap': mockDefinition
          }
        };
        return selector(state);
      });
      return <Story />;
    },
  ],
};

// Schema tab explicitly selected
export const SchemaTab: Story = {
  args: {
    metricId: 'test-metric-id',
    onClose: () => console.log('Close panel clicked'),
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation((selector) => {
        // This mock simulates what the getMetricById selector would return
        const state = {
          getMetricById: (id: string) => id === 'test-metric-id' ? mockMetric : null,
          metricDefinitions: {
            'process.runtime.jvm.memory.heap': mockDefinition
          }
        };
        return selector(state);
      });
      
      // Force Schema tab to be active
      return (
        <div className="schema-tab-story">
          <Story />
        </div>
      );
    },
  ],
};

// Attributes tab explicitly selected
export const AttributesTab: Story = {
  args: {
    metricId: 'test-metric-id',
    onClose: () => console.log('Close panel clicked'),
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation((selector) => {
        // This mock simulates what the getMetricById selector would return
        const state = {
          getMetricById: (id: string) => id === 'test-metric-id' ? {
            ...mockMetric,
            attributeKeys: ['pool', 'type', 'state', 'gc', 'region', 'arena']
          } : null,
          metricDefinitions: {
            'process.runtime.jvm.memory.heap': mockDefinition
          }
        };
        return selector(state);
      });
      
      // Force Attributes tab to be active
      return (
        <div className="attributes-tab-story">
          <Story />
        </div>
      );
    },
  ],
};

// JSON tab explicitly selected
export const JsonTab: Story = {
  args: {
    metricId: 'test-metric-id',
    onClose: () => console.log('Close panel clicked'),
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation((selector) => {
        // This mock simulates what the getMetricById selector would return
        const state = {
          getMetricById: (id: string) => id === 'test-metric-id' ? mockMetric : null,
          metricDefinitions: {
            'process.runtime.jvm.memory.heap': mockDefinition
          }
        };
        return selector(state);
      });
      
      // Force JSON tab to be active
      return (
        <div className="json-tab-story">
          <Story />
        </div>
      );
    },
  ],
};

// Null metric ID
export const NoSelectedMetric: Story = {
  args: {
    metricId: null,
    onClose: () => console.log('Close panel clicked'),
  },
};

// Metric not found
export const MetricNotFound: Story = {
  args: {
    metricId: 'non-existent-id',
    onClose: () => console.log('Close panel clicked'),
  },
  decorators: [
    (Story) => {
      // Set up the mock implementation for this story
      (useStore as jest.Mock).mockImplementation((selector) => {
        // This mock simulates what the getMetricById selector would return
        const state = {
          getMetricById: () => null,
          metricDefinitions: {}
        };
        return selector(state);
      });
      return <Story />;
    },
  ],
};