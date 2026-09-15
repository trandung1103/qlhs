import { api } from './api';
import type {
  CreateSchoolYearInput,
  SchoolYear,
  UpdateSchoolYearInput,
} from '../types/school-year';

export const schoolYearsService = {
  list: () => api.get<SchoolYear[]>('/school-years').then((r) => r.data),
  create: (input: CreateSchoolYearInput) =>
    api.post<SchoolYear>('/school-years', input).then((r) => r.data),
  update: (id: string, input: UpdateSchoolYearInput) =>
    api.patch<SchoolYear>(`/school-years/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/school-years/${id}`),
};
