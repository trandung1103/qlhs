import type { FieldDefinition, FieldType } from '../../types/field';
import type { Student } from '../../types/student';
import type { EditKind, StudentColumnDef } from './student-columns';

const TYPE_TO_EDIT_KIND: Record<FieldType, EditKind> = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  DATE: 'date',
  SELECT: 'select',
  RADIO: 'select',
  CHECKBOX: 'multiselect',
};

export function fieldDefinitionToColumn(fd: FieldDefinition): StudentColumnDef {
  const options = fd.options
    .filter((o) => o.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((o) => ({ label: o.label, value: o.value }));
  const labelByValue = new Map(options.map((o) => [o.value, o.label]));

  const getValues = (s: Student) =>
    (s.fieldValues ?? [])
      .filter((v) => v.fieldDefinitionId === fd.id)
      .map((v) => v.value ?? '')
      .filter((v) => v !== '');

  return {
    key: fd.id,
    label: fd.name,
    defaultVisible: true,
    isDynamic: true,
    editKind: TYPE_TO_EDIT_KIND[fd.type],
    options: fd.type === 'SELECT' || fd.type === 'RADIO' || fd.type === 'CHECKBOX' ? options : undefined,
    getValue: (s) => {
      const values = getValues(s);
      if (fd.type === 'CHECKBOX') {
        return values.map((v) => labelByValue.get(v) ?? v).join(', ');
      }
      if (fd.type === 'SELECT' || fd.type === 'RADIO') {
        return values[0] ? labelByValue.get(values[0]) ?? values[0] : '';
      }
      return values[0] ?? '';
    },
    parseValue: (text) => {
      if (fd.type === 'CHECKBOX') {
        return text
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
      return text.trim();
    },
  };
}
