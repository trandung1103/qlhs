import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Button, Space, message, Empty, Typography, Pagination, Divider, Popconfirm, Tooltip } from 'antd';
import './students-page.css';
import type { SortColumn } from 'react-data-grid';
import {
  PlusOutlined,
  PlusSquareOutlined,
  SearchOutlined,
  ExperimentOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { SelectionBar } from '../../components/SelectionBar';
import { useSelectionStore } from '../../stores/selection.store';
import { studentsService } from '../../services/students.service';
import { fieldsService } from '../../services/fields.service';
import { getErrorMessage } from '../../services/api';
import type { Student } from '../../types/student';
import type { FieldDefinition } from '../../types/field';
import { useVisibleColumnsStore } from './visible-columns.store';
import { ColumnSelectorButton } from './ColumnSelectorButton';
import { CreateFieldModal } from './CreateFieldModal';
import { FilterPopover, type StudentFilters } from './FilterPopover';
import { ExportButton } from './ExportButton';
import { StudentFormDrawer } from './StudentFormDrawer';
import { StudentGrid, type FieldChange } from './StudentGrid';
import { fieldDefinitionToColumn } from './dynamic-columns';
import type { StudentColumnDef } from './student-columns';
import { makePlaceholderStudent, makePlaceholderStudents, PLACEHOLDER_ROW_COUNT } from './placeholder-row';

/** A single grid edit (one cell, or one paste covering several cells), for undo/redo. */
type GridOperation = { changes: FieldChange[] };
const MAX_HISTORY = 50;

export function StudentsPage() {
  const { schoolYearId, classId } = useSelectionStore();
  const { visibleKeys, setVisibleKeys } = useVisibleColumnsStore();
  const [quickAddFieldOpen, setQuickAddFieldOpen] = useState(false);

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

  const [undoStack, setUndoStack] = useState<GridOperation[]>([]);
  const [redoStack, setRedoStack] = useState<GridOperation[]>([]);
  // Guards against a fast double Ctrl+Z firing two undos before the first
  // one's API calls + reload finish, which could otherwise pop two steps
  // for one keypress or race the two reloads.
  const [isUndoRedoBusy, setIsUndoRedoBusy] = useState(false);

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

  // A different class's edits shouldn't be undoable after switching away from it.
  useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, [schoolYearId, classId]);

  const applyChanges = async (changes: FieldChange[], direction: 'prev' | 'next') => {
    const plain = new Map<string, Record<string, unknown>>();
    const dynamic = new Map<string, Record<string, unknown>>();
    for (const change of changes) {
      const value = direction === 'prev' ? change.prevValue : change.nextValue;
      const bucket = change.isDynamic ? dynamic : plain;
      const entry = bucket.get(change.studentId) ?? {};
      entry[change.field] = value;
      bucket.set(change.studentId, entry);
    }
    const studentIds = new Set([...plain.keys(), ...dynamic.keys()]);
    await Promise.all(
      [...studentIds].map((studentId) => {
        const payload: Record<string, unknown> = { ...(plain.get(studentId) ?? {}) };
        const customFields = dynamic.get(studentId);
        if (customFields) payload.customFields = customFields;
        return studentsService.update(studentId, payload as any);
      }),
    );
  };

  const pushUndo = (changes: FieldChange[]) => {
    if (changes.length === 0) return;
    setUndoStack((stack) => [...stack.slice(-(MAX_HISTORY - 1)), { changes }]);
    setRedoStack([]);
  };

  const handleUndo = useCallback(async () => {
    if (isUndoRedoBusy) return;
    const op = undoStack[undoStack.length - 1];
    if (!op) return;
    setIsUndoRedoBusy(true);
    setUndoStack((stack) => stack.slice(0, -1));
    try {
      await applyChanges(op.changes, 'prev');
      setRedoStack((stack) => [...stack, op]);
      await load();
      message.success('Đã hoàn tác');
    } catch {
      message.error('Không thể hoàn tác');
      setUndoStack((stack) => [...stack, op]);
    } finally {
      setIsUndoRedoBusy(false);
    }
  }, [isUndoRedoBusy, undoStack, load]);

  const handleRedo = useCallback(async () => {
    if (isUndoRedoBusy) return;
    const op = redoStack[redoStack.length - 1];
    if (!op) return;
    setIsUndoRedoBusy(true);
    setRedoStack((stack) => stack.slice(0, -1));
    try {
      await applyChanges(op.changes, 'next');
      setUndoStack((stack) => [...stack, op]);
      await load();
      message.success('Đã làm lại');
    } catch {
      message.error('Không thể làm lại');
      setRedoStack((stack) => [...stack, op]);
    } finally {
      setIsUndoRedoBusy(false);
    }
  }, [isUndoRedoBusy, redoStack, load]);

  // Ctrl/Cmd+Z and Ctrl/Cmd+Y (or Shift+Z) trigger undo/redo, like a spreadsheet —
  // but only when not typing inside an input, so native text-undo still works there.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isEditable || !(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  const handleDelete = async (id: string) => {
    try {
      await studentsService.remove(id);
      message.success('Đã xóa học sinh');
      load();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleCellCommit = async (studentId: string, field: string, value: unknown, prevValue: unknown) => {
    const isDynamic = fieldDefinitions.some((fd) => fd.id === field);
    if (isDynamic) {
      await studentsService.update(studentId, { customFields: { [field]: value } } as any);
      load();
    } else {
      await studentsService.update(studentId, { [field]: value } as any);
    }
    pushUndo([{ studentId, field, isDynamic, prevValue, nextValue: value }]);
    message.success('Đã lưu');
  };

  const handleBulkPaste = async (
    rows: { studentId: string; values: Record<string, unknown> }[],
    changes: FieldChange[],
  ) => {
    if (!schoolYearId || !classId) return;
    const result = await studentsService.bulkUpdate({ schoolYearId, classId, rows });
    if (!result.success) {
      const summary = result.errors
        .slice(0, 3)
        .map((e) => `Dòng ${e.row} (${e.field}): ${e.message}`)
        .join('; ');
      message.error(`Dán dữ liệu thất bại: ${summary}`);
    } else {
      pushUndo(changes);
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

  const handleCreateBlankRows = async (count: number): Promise<Student[]> => {
    if (!schoolYearId || !classId) return [];
    const created: Student[] = [];
    for (let i = 0; i < count; i++) {
      created.push(await studentsService.create({ schoolYearId, classId }));
    }
    return created;
  };

  const handleRequestBlankRow = (): Student => makePlaceholderStudent(schoolYearId!, classId!);

  // Pasting a table wider than the current columns adds plain-text columns
  // for the overflow, like Excel extending the sheet instead of dropping data.
  const handleCreateColumns = async (count: number): Promise<StudentColumnDef[]> => {
    if (!schoolYearId) return [];
    const existingNames = new Set(fieldDefinitions.map((fd) => fd.name));
    const created: FieldDefinition[] = [];
    let n = fieldDefinitions.length + 1;
    for (let i = 0; i < count; i++) {
      while (existingNames.has(`Cột ${n}`)) n++;
      const name = `Cột ${n}`;
      existingNames.add(name);
      created.push(await fieldsService.create({ schoolYearId, name, type: 'TEXT' }));
      n++;
    }
    setFieldDefinitions((prev) => [...prev, ...created]);
    setVisibleKeys([...visibleKeys, ...created.map((fd) => fd.id)]);
    message.info(`Đã tự động thêm ${count} cột mới để chứa dữ liệu dán vào`);
    return created.map(fieldDefinitionToColumn);
  };

  // Nothing saved in this class yet: show an empty spreadsheet-like grid
  // instead of a real fetch — rows only become real students once edited or
  // pasted into (see StudentGrid). The placeholder set is only regenerated
  // when the class changes, so repeated empty reloads don't reshuffle ids
  // and wipe in-progress edits.
  const placeholderRows = useMemo(
    () =>
      schoolYearId && classId
        ? makePlaceholderStudents(PLACEHOLDER_ROW_COUNT, schoolYearId, classId)
        : [],
    [schoolYearId, classId],
  );
  const displayRows = data.length > 0 ? data : placeholderRows;

  const handleReorder = async (orderedIds: string[]) => {
    if (!schoolYearId || !classId) return;
    await studentsService.reorder({
      schoolYearId,
      classId,
      items: orderedIds.map((studentId, idx) => ({ studentId, order: idx + 1 })),
    });
  };

  // Sorting is normally just a view — drag-to-reorder is disabled while a sort
  // is active because dragging would fight the sort on the next reload. So
  // when a sort is applied, commit it as the new displayOrder for the whole
  // class right away (fetching every matching row, not just the current
  // page) and drop back to the (now up to date) unsorted view — from there
  // dragging works immediately to fine-tune further.
  const handleSortColumnsChange = async (columns: SortColumn[]) => {
    if (!schoolYearId || !classId || columns.length === 0 || hasActiveViewFilters) {
      setSortColumns(columns);
      return;
    }

    const sortKey = columns[0].columnKey;
    const sortDir = columns[0].direction === 'ASC' ? 'asc' : 'desc';

    setLoading(true);
    try {
      const all: Student[] = [];
      const fetchLimit = 200;
      let fetchPage = 1;
      for (;;) {
        const result = await studentsService.list({
          schoolYearId,
          classId,
          sortBy: sortKey,
          sortOrder: sortDir,
          page: fetchPage,
          limit: fetchLimit,
        });
        all.push(...result.data);
        if (all.length >= result.pagination.total || result.data.length === 0) break;
        fetchPage++;
      }

      if (all.length > 0) {
        await studentsService.reorder({
          schoolYearId,
          classId,
          items: all.map((s, idx) => ({ studentId: s.id, order: idx + 1 })),
        });
        message.success('Đã lưu thứ tự theo sắp xếp — giờ có thể kéo-thả để chỉnh tiếp');
      }
      setSortColumns([]);
      setPage(1);
      await load();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sms-page-shell">
      <div className="sms-page-card">
        <Space align="center" wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Quản lý học sinh
            </Typography.Title>
            <Typography.Text type="secondary">
              Nhập liệu, chỉnh sửa và theo dõi thông tin học sinh theo năm học và lớp.
            </Typography.Text>
          </div>
          <Space>
            <Tooltip title="Hoàn tác (Ctrl+Z)">
              <Button
                icon={<UndoOutlined />}
                disabled={undoStack.length === 0 || isUndoRedoBusy}
                onClick={handleUndo}
              />
            </Tooltip>
            <Tooltip title="Làm lại (Ctrl+Y)">
              <Button
                icon={<RedoOutlined />}
                disabled={redoStack.length === 0 || isUndoRedoBusy}
                onClick={handleRedo}
              />
            </Tooltip>
            <Popconfirm
              title="Thêm dữ liệu học sinh mẫu?"
              description="Sẽ thêm 15 học sinh mẫu vào lớp đang chọn để tiện dùng thử."
              okText="Thêm"
              cancelText="Hủy"
              onConfirm={handleSeedDemo}
              disabled={!classId}
            >
              <Button icon={<ExperimentOutlined />} disabled={!classId}>
                Dữ liệu mẫu
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
            <Button
              icon={<PlusSquareOutlined />}
              disabled={!schoolYearId}
              onClick={() => setQuickAddFieldOpen(true)}
            >
              Thêm cột
            </Button>
            <ExportButton
              schoolYearId={schoolYearId}
              classId={classId ?? undefined}
              search={search || undefined}
              filters={filters}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </Space>

          {!classId ? (
            <Empty description="Vui lòng chọn lớp." />
          ) : (
            <>
              {data.length === 0 && !loading && (
                <Typography.Text
                  type="secondary"
                  style={{ display: 'block', marginBottom: 8 }}
                >
                  Chưa có học sinh trong lớp này — gõ hoặc dán dữ liệu trực tiếp vào bảng bên
                  dưới để bắt đầu.
                </Typography.Text>
              )}
              <StudentGrid
                rows={displayRows}
                loading={loading}
                startIndex={(page - 1) * limit}
                visibleKeys={visibleKeys}
                dynamicColumns={dynamicColumns}
                sortColumns={sortColumns}
                onSortColumnsChange={handleSortColumnsChange}
                canReorder={sortColumns.length === 0 && !hasActiveViewFilters}
                onCellCommit={handleCellCommit}
                onBulkPaste={handleBulkPaste}
                onCreateBlankRows={handleCreateBlankRows}
                onRequestBlankRow={handleRequestBlankRow}
                onCreateColumns={handleCreateColumns}
                onReorder={handleReorder}
                onEditFull={(student) => {
                  setEditing(student);
                  setFormOpen(true);
                }}
                onDelete={handleDelete}
              />

              {data.length > 0 && (
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
              )}
            </>
          )}
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

      {schoolYearId && (
        <CreateFieldModal
          open={quickAddFieldOpen}
          schoolYearId={schoolYearId}
          onClose={() => setQuickAddFieldOpen(false)}
          onCreated={(fieldId) => {
            setVisibleKeys([...visibleKeys, fieldId]);
            loadFieldDefinitions();
          }}
        />
      )}
      </div>
    </div>
  );
}
