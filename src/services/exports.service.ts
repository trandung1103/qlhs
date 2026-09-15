import { api } from './api';
import type { Gender, StudentStatus } from '../types/student';

export interface ExportStudentsInput {
  schoolYearId: string;
  classId?: string;
  fields: string[];
  search?: string;
  filters?: {
    gender?: Gender;
    status?: StudentStatus;
    hasHealthInsurance?: boolean;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export const exportsService = {
  async exportStudents(input: ExportStudentsInput, filename = 'danh-sach-hoc-sinh.xlsx') {
    const response = await api.post('/students/export', input, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
