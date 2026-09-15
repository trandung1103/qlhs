import { Modal, Descriptions, Button, Popconfirm, Empty } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Student } from '../../types/student';
import { STUDENT_COLUMNS, type StudentColumnDef } from './student-columns';

interface Props {
  student: Student | null;
  dynamicColumns: StudentColumnDef[];
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export function StudentDetailModal({ student, dynamicColumns, onClose, onEdit, onDelete }: Props) {
  const items = student
    ? [...STUDENT_COLUMNS, ...dynamicColumns]
        .map((def) => ({ def, value: def.getValue(student) }))
        .filter(({ value }) => value !== '')
    : [];

  return (
    <Modal
      open={student !== null}
      onCancel={onClose}
      title={student?.fullName || 'Thông tin học sinh'}
      footer={
        student && [
          <Popconfirm
            key="delete"
            title="Bạn có chắc chắn muốn xóa học sinh này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => {
              onDelete(student.id);
              onClose();
            }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              onEdit(student);
              onClose();
            }}
          >
            Sửa
          </Button>,
        ]
      }
    >
      {items.length === 0 ? (
        <Empty description="Chưa có dữ liệu" />
      ) : (
        <Descriptions column={1} size="small" bordered>
          {items.map(({ def, value }) => (
            <Descriptions.Item key={def.key} label={def.label}>
              {value}
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}
    </Modal>
  );
}
