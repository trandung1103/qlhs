import { Card, Popconfirm, Empty } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Student } from '../../types/student';
import { STUDENT_COLUMNS, type StudentColumnDef } from './student-columns';

interface Props {
  rows: Student[];
  loading: boolean;
  visibleKeys: string[];
  dynamicColumns: StudentColumnDef[];
  onOpenDetail: (student: Student) => void;
  onEditFull: (student: Student) => void;
  onDelete: (id: string) => void;
}

export function StudentCardList({
  rows,
  loading,
  visibleKeys,
  dynamicColumns,
  onOpenDetail,
  onEditFull,
  onDelete,
}: Props) {
  if (rows.length === 0 && !loading) {
    return <Empty description="Chưa có học sinh trong lớp này." />;
  }

  // Same columns the table currently shows (via the column picker), minus the
  // name — that's already the card's title — so the card always matches the
  // table 1:1 instead of a separately-maintained fixed field list.
  const bodyDefs = [...STUDENT_COLUMNS, ...dynamicColumns].filter(
    (def) => visibleKeys.includes(def.key) && def.key !== 'fullName',
  );

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13, color: '#666' }}>
            {bodyDefs.map((def) => {
              const value = def.getValue(student);
              if (!value) return null;
              return (
                <div key={def.key} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color: '#999' }}>{def.label}: </span>
                  {value}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
