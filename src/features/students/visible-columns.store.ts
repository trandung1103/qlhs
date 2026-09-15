import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STUDENT_COLUMNS } from './student-columns';

const defaultVisibleKeys = STUDENT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);

interface VisibleColumnsState {
  visibleKeys: string[];
  setVisibleKeys: (keys: string[]) => void;
}

export const useVisibleColumnsStore = create<VisibleColumnsState>()(
  persist(
    (set) => ({
      visibleKeys: defaultVisibleKeys,
      setVisibleKeys: (keys) => set({ visibleKeys: keys }),
    }),
    { name: 'sms-visible-columns' },
  ),
);
