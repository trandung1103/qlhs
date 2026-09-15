import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GridViewState {
  columnWidths: Record<string, number>;
  columnOrder: string[];
  rowHeight: number;
  setColumnWidth: (key: string, width: number) => void;
  setColumnOrder: (order: string[]) => void;
  setRowHeight: (height: number) => void;
}

export const useGridViewStore = create<GridViewState>()(
  persist(
    (set, get) => ({
      columnWidths: {},
      columnOrder: [],
      rowHeight: 40,
      setColumnWidth: (key, width) =>
        set({ columnWidths: { ...get().columnWidths, [key]: width } }),
      setColumnOrder: (order) => set({ columnOrder: order }),
      setRowHeight: (height) => set({ rowHeight: height }),
    }),
    { name: 'sms-grid-view' },
  ),
);
