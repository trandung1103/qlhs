import { useState } from 'react';
import { Button, Popover, Select, Space, Typography } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { GENDER_LABELS, STUDENT_STATUS_LABELS } from '../../types/student';
import type { Gender, StudentStatus } from '../../types/student';

export interface StudentFilters {
  gender?: Gender;
  status?: StudentStatus;
  hasHealthInsurance?: boolean;
}

interface Props {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
}

export function FilterPopover({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(filters).filter((v) => v !== undefined).length;

  const content = (
    <Space direction="vertical" style={{ width: 240 }}>
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
      <Button size="small" onClick={() => onChange({})}>
        Xóa bộ lọc
      </Button>
    </Space>
  );

  return (
    <Popover title="Bộ lọc" trigger="click" open={open} onOpenChange={setOpen} content={content} placement="bottomLeft">
      <Button icon={<FilterOutlined />}>Lọc{activeCount > 0 ? ` (${activeCount})` : ''}</Button>
    </Popover>
  );
}
