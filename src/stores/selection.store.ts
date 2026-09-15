import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SelectionState {
  schoolYearId: string | null;
  classId: string | null;
  setSchoolYearId: (id: string | null) => void;
  setClassId: (id: string | null) => void;
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set) => ({
      schoolYearId: null,
      classId: null,
      setSchoolYearId: (id) => set({ schoolYearId: id, classId: null }),
      setClassId: (id) => set({ classId: id }),
    }),
    { name: 'sms-selection' },
  ),
);
