import { useState } from 'react';
import { Modal, Table, Button, Popconfirm, message, Space, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { SchoolYear } from '../../types/school-year';
import { schoolYearsService } from '../../services/school-years.service';
import { getErrorMessage } from '../../services/api';
import { SchoolYearFormModal } from './SchoolYearFormModal';

interface Props {
  open: boolean;
  onClose: () => void;
  schoolYears: SchoolYear[];
  loading: boolean;
  onChanged: () => void;
}

export function SchoolYearManagerModal({ open, onClose, schoolYears, loading, onChanged }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolYear | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await schoolYearsService.remove(id);
      message.success('Đã xóa năm học');
      onChanged();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <Modal
        title="Quản lý năm học"
        open={open}
        onCancel={onClose}
        footer={null}
        width={640}
        destroyOnHidden
      >
        <div style={{ marginBottom: 12, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Thêm năm học
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={schoolYears}
          pagination={false}
          locale={{ emptyText: <Empty description="Chưa có năm học." /> }}
          columns={[
            { title: 'Năm học', dataIndex: 'name' },
            { title: 'Bắt đầu', dataIndex: 'startYear', width: 100 },
            { title: 'Kết thúc', dataIndex: 'endYear', width: 100 },
            {
              title: '',
              width: 100,
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditing(record);
                      setFormOpen(true);
                    }}
                  />
                  <Popconfirm
                    title="Xóa năm học này?"
                    description="Chỉ xóa được khi năm học không còn lớp/học sinh."
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Modal>

      <SchoolYearFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={onChanged}
      />
    </>
  );
}
