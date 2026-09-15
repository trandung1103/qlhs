export type FieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'RADIO' | 'CHECKBOX';

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: 'Văn bản ngắn',
  TEXTAREA: 'Văn bản dài',
  NUMBER: 'Số',
  DATE: 'Ngày',
  SELECT: 'Chọn 1 (dropdown)',
  RADIO: 'Chọn 1 (radio)',
  CHECKBOX: 'Chọn nhiều',
};

export const FIELD_TYPES_WITH_OPTIONS: FieldType[] = ['SELECT', 'RADIO', 'CHECKBOX'];

export interface FieldOption {
  id: string;
  fieldDefinitionId: string;
  label: string;
  value: string;
  displayOrder: number;
  isActive: boolean;
}

export interface FieldDefinition {
  id: string;
  schoolYearId: string;
  name: string;
  key: string;
  type: FieldType;
  isSystem: boolean;
  isRequired: boolean;
  isVisible: boolean;
  isSearchable: boolean;
  isSortable: boolean;
  isActive: boolean;
  displayOrder: number;
  options: FieldOption[];
}

export interface CreateFieldDefinitionInput {
  schoolYearId: string;
  name: string;
  type: FieldType;
}
