import { StateCreator } from 'zustand';

export interface CostModel {
  costPerSeries: number;
  costPerDataPoint: number;
  retentionPeriodDays: number;
  scrapeIntervalSeconds: number;
  currency: string;
}

export interface CardinalitySlice {
  cardinalityAnalysis: Record<string, any>;
  recommendations: Record<string, any>;
  costModel: CostModel;
}

export const createCardinalitySlice: StateCreator<
  CardinalitySlice,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  CardinalitySlice
> = (set, get) => ({
  cardinalityAnalysis: {},
  recommendations: {},
  costModel: {
    costPerSeries: 0.001,
    costPerDataPoint: 0.0000001,
    retentionPeriodDays: 30,
    scrapeIntervalSeconds: 60,
    currency: 'USD',
  },
});

