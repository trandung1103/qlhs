import { useState } from 'react';
import { Button, DatePicker, Input, Popover, Select, Space, Typography } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { GENDER_LABELS, STUDENT_STATUS_LABELS } from '../../types/student';
import type { Gender, StudentStatus } from '../../types/student';

export interface StudentFilters {
  gender?: Gender;
  status?: StudentStatus;
  hasHealthInsurance?: boolean;
  ethnicity?: string;
  bloodType?: string;
  policyCategory?: string;
  dateOfBirthFrom?: string;
  dateOfBirthTo?: string;
}

const BLOOD_TYPES = ['A', 'B', 'AB', 'O'];

interface Props {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
}

export function FilterPopover({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;

  const dateRange: [Dayjs | null, Dayjs | null] = [
    filters.dateOfBirthFrom ? dayjs(filters.dateOfBirthFrom) : null,
    filters.dateOfBirthTo ? dayjs(filters.dateOfBirthTo) : null,
  ];

  const content = (
    <Space direction="vertical" style={{ width: 'min(260px, 82vw)' }}>
      <div>
        <Typography.Text>Giới tính</Typography.Text>
        <Select
          allowClear
          style={{ width: '100%' }}
          placeholder="Tất cả"
          value={filters.gender}
          onChange={(v) => onChange({ ...filters, gender: v })}
          options={Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <div>
        <Typography.Text>Tình trạng học sinh</Typography.Text>
        <Select
          allowClear
          style={{ width: '100%' }}
          placeholder="Tất cả"
          value={filters.status}
          onChange={(v) => onChange({ ...filters, status: v })}
          options={Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <div>
        <Typography.Text>Có BHYT</Typography.Text>
        <Select
          allowClear
          style={{ width: '100%' }}
          placeholder="Tất cả"
          value={filters.hasHealthInsurance}
          onChange={(v) => onChange({ ...filters, hasHealthInsurance: v })}
          options={[
            { value: true, label: 'Có' },
            { value: false, label: 'Không' },
          ]}
        />
      </div>
      <div>
        <Typography.Text>Ngày sinh</Typography.Text>
        <DatePicker.RangePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          value={dateRange}
          onChange={(range) =>
            onChange({
              ...filters,
              dateOfBirthFrom: range?.[0] ? range[0].startOf('day').toISOString() : undefined,
              dateOfBirthTo: range?.[1] ? range[1].endOf('day').toISOString() : undefined,
            })
          }
        />
      </div>
      <div>
        <Typography.Text>Dân tộc</Typography.Text>
        <Input
          allowClear
          placeholder="VD: Kinh"
          value={filters.ethnicity}
          onChange={(e) => onChange({ ...filters, ethnicity: e.target.value || undefined })}
        />
      </div>
      <div>
        <Typography.Text>Nhóm máu</Typography.Text>
        <Select
          allowClear
          showSearch
          style={{ width: '100%' }}
          placeholder="Tất cả"
          value={filters.bloodType}
          onChange={(v) => onChange({ ...filters, bloodType: v })}
          onSearch={(v) => onChange({ ...filters, bloodType: v || undefined })}
          options={BLOOD_TYPES.map((v) => ({ value: v, label: v }))}
        />
      </div>
      <div>
        <Typography.Text>Đối tượng chính sách</Typography.Text>
        <Input
          allowClear
          placeholder="VD: Hộ nghèo"
          value={filters.policyCategory}
          onChange={(e) => onChange({ ...filters, policyCategory: e.target.value || undefined })}
        />
      </div>
      <Button size="small" onClick={() => onChange({})}>
        Xóa bộ lọc
      </Button>
    </Space>
  );

  return (
    <Popover
      title="Bộ lọc"
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      content={content}
      placement="bottomLeft"
      overlayStyle={{ maxWidth: '90vw' }}
    >
      <Button icon={<FilterOutlined />}>Lọc{activeCount > 0 ? ` (${activeCount})` : ''}</Button>
    </Popover>
  );
}
