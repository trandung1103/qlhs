import { Modal, Descriptions, Button, Popconfirm, Empty, Tabs } from 'antd';
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

// Second tab: everything about parents, health and emergency contact.
// Anything not listed here (incl. every custom/dynamic field) lands on tab 1.
const FAMILY_HEALTH_KEYS = new Set([
  'fatherName',
  'fatherPhone',
  'fatherJob',
  'fatherWorkplace',
  'motherName',
  'motherPhone',
  'motherJob',
  'motherWorkplace',
  'hasHealthInsurance',
  'healthInsuranceNumber',
  'healthInsuranceStartDate',
  'healthInsuranceEndDate',
  'healthInsuranceStatus',
  'healthInsuranceRegisteredHospital',
  'emergencyContactName',
  'emergencyContactRelationship',
  'emergencyContactPhone',
  'policyCategory',
  'bloodType',
  'allergy',
  'healthNotes',
]);

function DescriptionsFor({ defs, student }: { defs: StudentColumnDef[]; student: Student }) {
  const items = defs.map((def) => ({ def, value: def.getValue(student) }));

  if (items.length === 0) return <Empty description="Chưa có dữ liệu" />;
  return (
    <Descriptions column={1} size="small" bordered>
      {items.map(({ def, value }) => (
        <Descriptions.Item key={def.key} label={def.label}>
          {value === '' ? <span style={{ color: '#bbb' }}>—</span> : value}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
}

export function StudentDetailModal({ student, dynamicColumns, onClose, onEdit, onDelete }: Props) {
  const basicDefs = [...STUDENT_COLUMNS.filter((d) => !FAMILY_HEALTH_KEYS.has(d.key)), ...dynamicColumns];
  const familyDefs = STUDENT_COLUMNS.filter((d) => FAMILY_HEALTH_KEYS.has(d.key));

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
      {student && (
        <Tabs
          items={[
            {
              key: 'basic',
              label: 'Thông tin cơ bản',
              children: <DescriptionsFor defs={basicDefs} student={student} />,
            },
            {
              key: 'family',
              label: 'Phụ huynh & sức khỏe',
              children: <DescriptionsFor defs={familyDefs} student={student} />,
            },
          ]}
        />
      )}
    </Modal>
  );
}
