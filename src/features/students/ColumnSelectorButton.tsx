import { useState } from 'react';
import { Button, Popover, Checkbox, Space, Divider, Tag } from 'antd';
import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { STUDENT_COLUMNS } from './student-columns';
import { useVisibleColumnsStore } from './visible-columns.store';
import type { FieldDefinition } from '../../types/field';
import { fieldDefinitionToColumn } from './dynamic-columns';
import { CreateFieldModal } from './CreateFieldModal';

interface Props {
  schoolYearId: string | null;
  fieldDefinitions: FieldDefinition[];
  onFieldsChanged: () => Promise<void> | void;
}

export function ColumnSelectorButton({ schoolYearId, fieldDefinitions, onFieldsChanged }: Props) {
  const { visibleKeys, setVisibleKeys } = useVisibleColumnsStore();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const dynamicColumns = fieldDefinitions.filter((fd) => fd.isActive).map(fieldDefinitionToColumn);
  const allColumns = [...STUDENT_COLUMNS, ...dynamicColumns];

  const toggle = (key: string, checked: boolean) => {
    setVisibleKeys(checked ? [...visibleKeys, key] : visibleKeys.filter((k) => k !== key));
  };

  const content = (
    <div style={{ maxHeight: 360, overflowY: 'auto', width: 280 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {STUDENT_COLUMNS.map((col) => (
          <Checkbox
            key={col.key}
            checked={visibleKeys.includes(col.key)}
            onChange={(e) => toggle(col.key, e.target.checked)}
          >
            {col.label}
          </Checkbox>
        ))}
        {dynamicColumns.length > 0 && (
          <>
            <Divider style={{ margin: '4px 0' }} orientation="left" plain>
              Mục tùy chỉnh
            </Divider>
            {dynamicColumns.map((col) => (
              <Checkbox
                key={col.key}
                checked={visibleKeys.includes(col.key)}
                onChange={(e) => toggle(col.key, e.target.checked)}
              >
                {col.label} <Tag color="blue">tùy chỉnh</Tag>
              </Checkbox>
            ))}
          </>
        )}
      </Space>
      <Divider style={{ margin: '8px 0' }} />
      <Space wrap>
        <Button size="small" onClick={() => setVisibleKeys(allColumns.map((c) => c.key))}>
          Chọn tất cả
        </Button>
        <Button size="small" onClick={() => setVisibleKeys([])}>
          Bỏ chọn hết
        </Button>
        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          disabled={!schoolYearId}
          onClick={() => setCreateOpen(true)}
        >
          Thêm mục
        </Button>
      </Space>
    </div>
  );

  return (
    <>
      <Popover
        title="Chọn cột hiển thị"
        trigger="click"
        open={open}
        onOpenChange={setOpen}
        content={content}
        placement="bottomRight"
      >
        <Button icon={<SettingOutlined />}>Chọn cột</Button>
      </Popover>

      {schoolYearId && (
        <CreateFieldModal
          open={createOpen}
          schoolYearId={schoolYearId}
          onClose={() => setCreateOpen(false)}
          onCreated={(fieldId) => {
            setVisibleKeys([...visibleKeys, fieldId]);
            onFieldsChanged();
          }}
        />
      )}
    </>
  );
}
