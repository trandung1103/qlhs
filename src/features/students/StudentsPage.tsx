import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Button, Space, message, Empty, Typography, Pagination, Divider, Popconfirm } from 'antd';
import type { SortColumn } from 'react-data-grid';
import { PlusOutlined, SearchOutlined, ExperimentOutlined } from '@ant-design/icons';
import { SelectionBar } from '../../components/SelectionBar';
import { useSelectionStore } from '../../stores/selection.store';
import { studentsService } from '../../services/students.service';
import { fieldsService } from '../../services/fields.service';
import { getErrorMessage } from '../../services/api';
import type { Student } from '../../types/student';
import type { FieldDefinition } from '../../types/field';
import { useVisibleColumnsStore } from './visible-columns.store';
import { ColumnSelectorButton } from './ColumnSelectorButton';
import { FilterPopover, type StudentFilters } from './FilterPopover';
import { ExportButton } from './ExportButton';
import { StudentFormDrawer } from './StudentFormDrawer';
import { StudentGrid } from './StudentGrid';
import { fieldDefinitionToColumn } from './dynamic-columns';

export function StudentsPage() {
  const { schoolYearId, classId } = useSelectionStore();
  const { visibleKeys } = useVisibleColumnsStore();

  const [data, setData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<StudentFilters>({});
  const [sortColumns, setSortColumns] = useState<SortColumn[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);

  const loadFieldDefinitions = useCallback(async () => {
    if (!schoolYearId) {
      setFieldDefinitions([]);
      return;
    }
    try {
      setFieldDefinitions(await fieldsService.list(schoolYearId));
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }, [schoolYearId]);

  useEffect(() => {
    loadFieldDefinitions();
  }, [loadFieldDefinitions]);

  const dynamicColumns = useMemo(
    () => fieldDefinitions.filter((fd) => fd.isActive).map(fieldDefinitionToColumn),
    [fieldDefinitions],
  );

  const sortBy = sortColumns[0]?.columnKey;
  const sortOrder = sortColumns[0] ? (sortColumns[0].direction === 'ASC' ? 'asc' : 'desc') : undefined;
  const hasActiveViewFilters = Boolean(search) || Object.keys(filters).length > 0;

  const load = useCallback(async () => {
    if (!schoolYearId) {
      setData([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const result = await studentsService.list({
        schoolYearId,
        classId: classId ?? undefined,
        search: search || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
        ...filters,
      });
      setData(result.data);
      setTotal(result.pagination.total);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [schoolYearId, classId, search, filters, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [schoolYearId, classId, search, filters]);

  const handleDelete = async (id: string) => {
    try {
      await studentsService.remove(id);
      message.success('Đã xóa học sinh');
      load();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleCellCommit = async (studentId: string, field: string, value: unknown) => {
    const isDynamic = fieldDefinitions.some((fd) => fd.id === field);
    if (isDynamic) {
      await studentsService.update(studentId, { customFields: { [field]: value } } as any);
      load();
    } else {
      await studentsService.update(studentId, { [field]: value } as any);
    }
    message.success('Đã lưu');
  };

  const handleBulkPaste = async (rows: { studentId: string; values: Record<string, unknown> }[]) => {
    if (!schoolYearId || !classId) return;
    const result = await studentsService.bulkUpdate({ schoolYearId, classId, rows });
    if (!result.success) {
      const summary = result.errors
        .slice(0, 3)
        .map((e) => `Dòng ${e.row} (${e.field}): ${e.message}`)
        .join('; ');
      message.error(`Dán dữ liệu thất bại: ${summary}`);
    } else {
      message.success(`Đã cập nhật ${result.updatedCount} học sinh`);
      load();
    }
  };

  const handleSeedDemo = async () => {
    if (!schoolYearId || !classId) return;
    try {
      const result = await studentsService.seedDemo({ schoolYearId, classId });
      message.success(`Đã thêm ${result.createdCount} học sinh mẫu`);
      load();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleReorder = async (orderedIds: string[]) => {
    if (!schoolYearId || !classId) return;
    await studentsService.reorder({
      schoolYearId,
      classId,
      items: orderedIds.map((studentId, idx) => ({ studentId, order: idx + 1 })),
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', padding: '24px 32px' }}>
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #eef0f2',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)',
          padding: '20px 24px 24px',
        }}
      >
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Quản lý học sinh
            </Typography.Title>
            <Typography.Text type="secondary">
              Nhập liệu, chỉnh sửa và theo dõi thông tin học sinh theo năm học và lớp.
            </Typography.Text>
          </div>
          <Space>
            <Popconfirm
              title="Thêm dữ liệu học sinh mẫu?"
              description="Sẽ thêm 15 học sinh mẫu vào lớp đang chọn để tiện test."
              okText="Thêm"
              cancelText="Hủy"
              onConfirm={handleSeedDemo}
              disabled={!classId}
            >
              <Button icon={<ExperimentOutlined />} disabled={!classId}>
                Dữ liệu test
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              disabled={!classId}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Thêm học sinh
            </Button>
          </Space>
        </Space>

        <div
          style={{
            background: '#fafbfc',
            border: '1px solid #eef0f2',
            borderRadius: 8,
            padding: '4px 16px',
            marginTop: 16,
          }}
        >
          <SelectionBar />
        </div>

      {schoolYearId && (
        <>
          <Divider style={{ margin: '20px 0 16px' }} />
          <Space wrap style={{ marginBottom: 16 }}>
            <Input
              placeholder="Tìm kiếm theo tên, mã định danh, SĐT bố/mẹ..."
              prefix={<SearchOutlined />}
              style={{ width: 320 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
            <FilterPopover filters={filters} onChange={setFilters} />
            <ColumnSelectorButton
              schoolYearId={schoolYearId}
              fieldDefinitions={fieldDefinitions}
              onFieldsChanged={loadFieldDefinitions}
            />
            <ExportButton
              schoolYearId={schoolYearId}
              classId={classId ?? undefined}
              search={search || undefined}
              filters={filters}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </Space>

          {data.length === 0 && !loading ? (
            <Empty description={classId ? 'Chưa có học sinh trong lớp này.' : 'Vui lòng chọn lớp.'} />
          ) : (
            <StudentGrid
              rows={data}
              loading={loading}
              startIndex={(page - 1) * limit}
              visibleKeys={visibleKeys}
              dynamicColumns={dynamicColumns}
              sortColumns={sortColumns}
              onSortColumnsChange={setSortColumns}
              canReorder={sortColumns.length === 0 && !hasActiveViewFilters}
              onCellCommit={handleCellCommit}
              onBulkPaste={handleBulkPaste}
              onReorder={handleReorder}
              onEditFull={(student) => {
                setEditing(student);
                setFormOpen(true);
              }}
              onDelete={handleDelete}
            />
          )}

          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Pagination
              current={page}
              pageSize={limit}
              total={total}
              showSizeChanger
              onChange={(p, l) => {
                setPage(p);
                setLimit(l);
              }}
            />
          </div>
        </>
      )}

      {schoolYearId && classId && (
        <StudentFormDrawer
          open={formOpen}
          onClose={() => setFormOpen(false)}
          schoolYearId={schoolYearId}
          classId={classId}
          editing={editing}
          onSaved={load}
          fieldDefinitions={fieldDefinitions}
          onFieldsChanged={loadFieldDefinitions}
        />
      )}
      </div>
    </div>
  );
}
