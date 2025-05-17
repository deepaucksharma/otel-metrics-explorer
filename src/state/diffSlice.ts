import { StateCreator } from 'zustand';

export interface DiffSlice {
  diffResults: Record<string, any>;
}

export const createDiffSlice: StateCreator<
  DiffSlice,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  DiffSlice
> = () => ({
  diffResults: {},
});

