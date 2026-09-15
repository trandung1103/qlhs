import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'table' | 'card';

interface ViewModeState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      viewMode: 'table',
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    { name: 'sms-view-mode' },
  ),
);
