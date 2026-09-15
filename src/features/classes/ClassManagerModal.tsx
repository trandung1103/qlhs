import { useState } from 'react';
import { Modal, Table, Button, Popconfirm, message, Space, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { SchoolClass } from '../../types/class';
import { classesService } from '../../services/classes.service';
import { getErrorMessage } from '../../services/api';
import { ClassFormModal } from './ClassFormModal';

interface Props {
  open: boolean;
  onClose: () => void;
  schoolYearId: string | null;
  classes: SchoolClass[];
  loading: boolean;
  onChanged: () => void;
}

export function ClassManagerModal({ open, onClose, schoolYearId, classes, loading, onChanged }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await classesService.remove(id);
      message.success('Đã xóa lớp');
      onChanged();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <Modal title="Quản lý lớp" open={open} onCancel={onClose} footer={null} width={640} destroyOnHidden>
        <div style={{ marginBottom: 12, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!schoolYearId}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Thêm lớp
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={classes}
          pagination={false}
          locale={{ emptyText: <Empty description="Chưa có lớp học trong năm học này." /> }}
          columns={[
            { title: 'Tên lớp', dataIndex: 'name' },
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
                    title="Xóa lớp này?"
                    description="Chỉ xóa được khi lớp không còn học sinh."
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

      <ClassFormModal
        open={formOpen}
        schoolYearId={schoolYearId}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={onChanged}
      />
    </>
  );
}
