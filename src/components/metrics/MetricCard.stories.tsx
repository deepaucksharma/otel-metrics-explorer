import type { Meta, StoryObj } from '@storybook/react';
import { MetricCard } from './MetricCard';
import { useStore } from '../../services/stateStore';
import type { ParsedMetric, ParsedSnapshot } from '../../types/otlp';

const snapshotId = 'snapshot1';
const metricId = 'metric1';

const metric: ParsedMetric = {
  id: metricId,
  name: 'cpu_usage',
  description: 'CPU usage percent',
  unit: 'percent',
  type: 'gauge',
  temporality: 'cumulative',
  monotonic: false,
  dataPoints: [],
  attributeKeys: ['host', 'cpu'],
  resourceIds: [],
  scopeIds: [],
};

const snapshot: ParsedSnapshot = {
  id: snapshotId,
  timestamp: Date.now(),
  resources: [],
  metrics: { [metricId]: metric },
  metricCount: 1,
  totalSeries: 1,
  totalDataPoints: 0,
};

if (!useStore.getState().snapshots[snapshotId]) {
  useStore.getState().addSnapshot(snapshot);
}

const meta: Meta<typeof MetricCard> = {
  title: 'Metrics/MetricCard',
  component: MetricCard,
};

export default meta;

type Story = StoryObj<typeof MetricCard>;

export const Default: Story = {
  render: () => (
    <MetricCard
      metricId={metricId}
      snapshotId={snapshotId}
      isExpanded={false}
      isSelected={false}
      onSelect={() => {}}
    />
  ),
};
