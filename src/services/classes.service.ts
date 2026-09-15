import { api } from './api';
import type { CreateClassInput, SchoolClass, UpdateClassInput } from '../types/class';

export const classesService = {
  list: (schoolYearId: string) =>
    api.get<SchoolClass[]>('/classes', { params: { schoolYearId } }).then((r) => r.data),
  create: (input: CreateClassInput) =>
    api.post<SchoolClass>('/classes', input).then((r) => r.data),
  update: (id: string, input: UpdateClassInput) =>
    api.patch<SchoolClass>(`/classes/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/classes/${id}`),
};
