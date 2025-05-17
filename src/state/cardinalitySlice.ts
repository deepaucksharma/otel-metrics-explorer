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
  setCardinalityAnalysis: (snapshotId: string, analysis: any) => void;
  setRecommendations: (snapshotId: string, recs: any) => void;
  updateCostModel: (partial: Partial<CostModel>) => void;
  clearCardinality: () => void;
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

  setCardinalityAnalysis: (snapshotId, analysis) => {
    set((state) => {
      state.cardinalityAnalysis[snapshotId] = analysis;
    });
  },

  setRecommendations: (snapshotId, recs) => {
    set((state) => {
      state.recommendations[snapshotId] = recs;
    });
  },

  updateCostModel: (partial) => {
    set((state) => {
      state.costModel = { ...state.costModel, ...partial };
    });
  },

  clearCardinality: () => {
    set((state) => {
      state.cardinalityAnalysis = {};
      state.recommendations = {};
    });
  },
});

