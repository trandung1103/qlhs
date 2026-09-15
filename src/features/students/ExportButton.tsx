import { useState } from 'react';
import { Button, Modal, Checkbox, Space, message } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import { STUDENT_COLUMNS } from './student-columns';
import { useVisibleColumnsStore } from './visible-columns.store';
import { exportsService } from '../../services/exports.service';
import { getErrorMessage } from '../../services/api';
import type { StudentFilters } from './FilterPopover';

interface Props {
  schoolYearId: string;
  classId?: string;
  search?: string;
  filters: StudentFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function ExportButton({ schoolYearId, classId, search, filters, sortBy, sortOrder }: Props) {
  const { visibleKeys } = useVisibleColumnsStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(visibleKeys);
  const [exporting, setExporting] = useState(false);

  const openModal = () => {
    setSelected(visibleKeys.length > 0 ? visibleKeys : STUDENT_COLUMNS.map((c) => c.key));
    setOpen(true);
  };

  const toggle = (key: string, checked: boolean) => {
    setSelected(checked ? [...selected, key] : selected.filter((k) => k !== key));
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      message.warning('Vui lòng chọn ít nhất một cột để xuất');
      return;
    }
    setExporting(true);
    try {
      // Preserve the user's chosen display order.
      const orderedFields = STUDENT_COLUMNS.filter((c) => selected.includes(c.key)).map((c) => c.key);
      await exportsService.exportStudents({
        schoolYearId,
        classId,
        fields: orderedFields,
        search,
        filters,
        sort: sortBy ? { field: sortBy, order: sortOrder ?? 'asc' } : undefined,
      });
      setOpen(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button icon={<FileExcelOutlined />} onClick={openModal}>
        Xuất Excel
      </Button>
      <Modal
        title="Xuất Excel"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleExport}
        confirmLoading={exporting}
        okText="Xuất file"
        cancelText="Hủy"
      >
        <p>Chọn các cột muốn xuất (áp dụng tìm kiếm/lọc/sắp xếp hiện tại):</p>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          <Space direction="vertical">
            {STUDENT_COLUMNS.map((col) => (
              <Checkbox key={col.key} checked={selected.includes(col.key)} onChange={(e) => toggle(col.key, e.target.checked)}>
                {col.label}
              </Checkbox>
            ))}
          </Space>
        </div>
      </Modal>
    </>
  );
}
