import { StateCreator } from 'zustand';

export interface DiffSlice {
  diffResults: Record<string, any>;
  setDiffResult: (snapshotId: string, result: any) => void;
  clearDiffResults: () => void;
}

export const createDiffSlice: StateCreator<
  DiffSlice,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  DiffSlice
> = () => ({
  diffResults: {},

  setDiffResult: (snapshotId, result) => {
    set((state) => {
      state.diffResults[snapshotId] = result;
    });
  },

  clearDiffResults: () => {
    set((state) => {
      state.diffResults = {};
    });
  },
});

