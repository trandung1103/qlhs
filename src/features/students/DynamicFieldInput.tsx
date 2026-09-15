import { Input, InputNumber, DatePicker, Select, Radio, Checkbox } from 'antd';
import dayjs from 'dayjs';
import type { FieldDefinition } from '../../types/field';

interface Props {
  fieldDefinition: FieldDefinition;
  value: string | string[] | undefined;
  onChange: (value: string | string[] | undefined) => void;
}

export function DynamicFieldInput({ fieldDefinition, value, onChange }: Props) {
  const options = fieldDefinition.options
    .filter((o) => o.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((o) => ({ label: o.label, value: o.value }));

  switch (fieldDefinition.type) {
    case 'TEXTAREA':
      return (
        <Input.TextArea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
        />
      );
    case 'NUMBER':
      return (
        <InputNumber
          style={{ width: '100%' }}
          value={value !== undefined && value !== '' ? Number(value) : undefined}
          onChange={(v) => onChange(v == null ? '' : String(v))}
        />
      );
    case 'DATE':
      return (
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          value={value ? dayjs(value as string) : null}
          onChange={(d) => onChange(d ? d.toISOString() : undefined)}
        />
      );
    case 'SELECT':
      return (
        <Select
          allowClear
          style={{ width: '100%' }}
          value={(value as string) || undefined}
          onChange={(v) => onChange(v)}
          options={options}
        />
      );
    case 'RADIO':
      return (
        <Radio.Group
          value={(value as string) || undefined}
          onChange={(e) => onChange(e.target.value)}
          options={options}
        />
      );
    case 'CHECKBOX':
      return (
        <Checkbox.Group
          value={(value as string[]) ?? []}
          onChange={(v) => onChange(v as string[])}
          options={options}
        />
      );
    default:
      return <Input value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}
