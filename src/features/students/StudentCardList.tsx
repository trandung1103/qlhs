import { Card, Space, Popconfirm, Empty, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Student } from '../../types/student';
import { GENDER_LABELS, STUDENT_STATUS_LABELS } from '../../types/student';

interface Props {
  rows: Student[];
  loading: boolean;
  onOpenDetail: (student: Student) => void;
  onEditFull: (student: Student) => void;
  onDelete: (id: string) => void;
}

export function StudentCardList({ rows, loading, onOpenDetail, onEditFull, onDelete }: Props) {
  if (rows.length === 0 && !loading) {
    return <Empty description="Chưa có học sinh trong lớp này." />;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {rows.map((student) => (
        <Card
          key={student.id}
          size="small"
          hoverable
          onClick={() => onOpenDetail(student)}
          actions={[
            <EditOutlined
              key="edit"
              onClick={(e) => {
                e.stopPropagation();
                onEditFull(student);
              }}
            />,
            <Popconfirm
              key="delete"
              title="Bạn có chắc chắn muốn xóa học sinh này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete(student.id);
              }}
            >
              <DeleteOutlined onClick={(e) => e.stopPropagation()} />
            </Popconfirm>,
          ]}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
            {student.fullName || <span style={{ color: '#999' }}>(Chưa có tên)</span>}
          </div>
          <Space direction="vertical" size={2} style={{ fontSize: 13, color: '#666', width: '100%' }}>
            {student.class?.name && <div>Lớp: {student.class.name}</div>}
            {student.gender && <div>{GENDER_LABELS[student.gender]}</div>}
            {student.fatherPhone && <div>SĐT bố: {student.fatherPhone}</div>}
            {student.motherPhone && <div>SĐT mẹ: {student.motherPhone}</div>}
            {student.status && <Tag style={{ marginTop: 2 }}>{STUDENT_STATUS_LABELS[student.status]}</Tag>}
          </Space>
        </Card>
      ))}
    </div>
  );
}
