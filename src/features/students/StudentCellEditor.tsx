import { useRef } from 'react';
import { Input, Select, DatePicker, InputNumber } from 'antd';
import dayjs from 'dayjs';
import type { RenderEditCellProps } from 'react-data-grid';
import type { Student } from '../../types/student';
import { GENDER_LABELS, STUDENT_STATUS_LABELS } from '../../types/student';
import type { StudentColumnDef } from './student-columns';

interface Props extends RenderEditCellProps<Student> {
  columnDef: StudentColumnDef;
}

function getDynamicValues(row: Student, fieldId: string): string[] {
  return (row.fieldValues ?? [])
    .filter((v) => v.fieldDefinitionId === fieldId)
    .map((v) => v.value ?? '');
}

function withDynamicValues(row: Student, fieldId: string, values: string[]): Student {
  const others = (row.fieldValues ?? []).filter((v) => v.fieldDefinitionId !== fieldId);
  const next = values.map((value) => ({ fieldDefinitionId: fieldId, value }));
  return { ...row, fieldValues: [...others, ...next] };
}

export function StudentCellEditor({ row, column, onRowChange, onClose, columnDef }: Props) {
  const rawValue = columnDef.isDynamic
    ? getDynamicValues(row, columnDef.key)[0]
    : ((row as any)[columnDef.key] as unknown);
  const rawValues = columnDef.isDynamic ? getDynamicValues(row, columnDef.key) : [];
  const committedRef = useRef(false);

  const commit = (value: unknown) => {
    if (committedRef.current) return;
    committedRef.current = true;
    if (columnDef.isDynamic) {
      const values = Array.isArray(value) ? (value as string[]) : value == null ? [] : [String(value)];
      onRowChange(withDynamicValues(row, columnDef.key, values), true);
    } else {
      onRowChange({ ...row, [columnDef.key]: value } as Student, true);
    }
  };

  if (columnDef.editKind === 'date') {
    return (
      <DatePicker
        autoFocus
        open
        style={{ width: column.width as number }}
        format="DD/MM/YYYY"
        value={rawValue ? dayjs(rawValue as string) : null}
        onChange={(d) => commit(d ? d.toISOString() : null)}
        onOpenChange={(open) => {
          if (!open) onClose(false);
        }}
      />
    );
  }

  if (columnDef.editKind === 'gender' || columnDef.editKind === 'status') {
    const labels = columnDef.editKind === 'gender' ? GENDER_LABELS : STUDENT_STATUS_LABELS;
    return (
      <Select
        autoFocus
        open
        style={{ width: '100%' }}
        value={(rawValue as string) ?? undefined}
        allowClear
        options={Object.entries(labels).map(([value, label]) => ({ value, label }))}
        onChange={(v) => commit(v ?? null)}
        onDropdownVisibleChange={(open) => {
          if (!open) onClose(false);
        }}
      />
    );
  }

  if (columnDef.editKind === 'select') {
    return (
      <Select
        autoFocus
        open
        style={{ width: '100%' }}
        value={rawValue ?? undefined}
        allowClear
        options={columnDef.options ?? []}
        onChange={(v) => commit(v ?? null)}
        onDropdownVisibleChange={(open) => {
          if (!open) onClose(false);
        }}
      />
    );
  }

  if (columnDef.editKind === 'multiselect') {
    return (
      <Select
        autoFocus
        open
        mode="multiple"
        style={{ width: '100%' }}
        value={rawValues}
        options={columnDef.options ?? []}
        onChange={(v) => commit(v)}
        onDropdownVisibleChange={(open) => {
          if (!open) onClose(false);
        }}
      />
    );
  }

  if (columnDef.editKind === 'boolean') {
    return (
      <Select
        autoFocus
        open
        style={{ width: '100%' }}
        value={rawValue === true ? 'yes' : rawValue === false ? 'no' : undefined}
        allowClear
        options={[
          { value: 'yes', label: 'Có' },
          { value: 'no', label: 'Không' },
        ]}
        onChange={(v) => commit(v === 'yes' ? true : v === 'no' ? false : null)}
        onDropdownVisibleChange={(open) => {
          if (!open) onClose(false);
        }}
      />
    );
  }

  if (columnDef.editKind === 'number') {
    return (
      <InputNumber
        autoFocus
        style={{ width: '100%' }}
        defaultValue={rawValue != null && rawValue !== '' ? Number(rawValue) : undefined}
        onBlur={(e) => commit(e.target.value === '' ? null : e.target.value)}
        onPressEnter={(e) => commit((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose(false);
        }}
      />
    );
  }

  if (columnDef.editKind === 'textarea') {
    return (
      <Input.TextArea
        autoFocus
        defaultValue={(rawValue as string) ?? ''}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose(false);
        }}
      />
    );
  }

  return (
    <Input
      autoFocus
      defaultValue={(rawValue as string) ?? ''}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
        if (e.key === 'Escape') onClose(false);
      }}
    />
  );
}
