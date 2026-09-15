import { api } from './api';
import type { CreateFieldDefinitionInput, FieldDefinition, FieldOption } from '../types/field';

export const fieldsService = {
  list: (schoolYearId: string) =>
    api.get<FieldDefinition[]>('/fields', { params: { schoolYearId } }).then((r) => r.data),
  create: (input: CreateFieldDefinitionInput) =>
    api.post<FieldDefinition>('/fields', input).then((r) => r.data),
  remove: (id: string) => api.delete(`/fields/${id}`),
  createOption: (fieldId: string, input: { label: string; value: string; displayOrder?: number }) =>
    api.post<FieldOption>(`/fields/${fieldId}/options`, input).then((r) => r.data),
};
