import { api } from './api';
import type {
  PaginatedResult,
  Student,
  StudentFormValues,
  StudentQueryParams,
} from '../types/student';

export const studentsService = {
  list: (params: StudentQueryParams) =>
    api
      .get<PaginatedResult<Student>>('/students', { params })
      .then((r) => r.data),
  get: (id: string) => api.get<Student>(`/students/${id}`).then((r) => r.data),
  create: (input: Partial<StudentFormValues> & { schoolYearId: string; classId: string }) =>
    api.post<Student>('/students', input).then((r) => r.data),
  update: (id: string, input: Partial<StudentFormValues>) =>
    api.patch<Student>(`/students/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/students/${id}`),
  reorder: (input: { schoolYearId: string; classId: string; items: { studentId: string; order: number }[] }) =>
    api.patch<{ success: true }>('/students/reorder', input).then((r) => r.data),
  seedDemo: (input: { schoolYearId: string; classId: string }) =>
    api.post<{ createdCount: number }>('/students/seed-demo', input).then((r) => r.data),
  bulkUpdate: (input: {
    schoolYearId: string;
    classId: string;
    rows: { studentId: string; values: Record<string, unknown> }[];
  }) =>
    api
      .post<{
        success: boolean;
        updatedCount: number;
        errors: { row: number; field: string; message: string }[];
      }>('/students/bulk-update', input)
      .then((r) => r.data),
};
