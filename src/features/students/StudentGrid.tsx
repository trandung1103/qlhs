import { useMemo, useRef, useState } from 'react';
import { DataGrid, type Column, type SortColumn, type ColumnWidths } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import './student-grid.css';
import { Button, Space, Popconfirm, message } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  HolderOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import type { RenderHeaderCellProps } from 'react-data-grid';
import type { Student } from '../../types/student';
import { STUDENT_COLUMNS, type StudentColumnDef } from './student-columns';
import { StudentCellEditor } from './StudentCellEditor';
import { useGridViewStore } from './grid-view.store';

interface Props {
  rows: Student[];
  loading: boolean;
  startIndex: number;
  visibleKeys: string[];
  dynamicColumns: StudentColumnDef[];
  sortColumns: SortColumn[];
  onSortColumnsChange: (columns: SortColumn[]) => void;
  canReorder: boolean;
  onCellCommit: (studentId: string, field: string, value: unknown) => Promise<void>;
  onBulkPaste: (rows: { studentId: string; values: Record<string, unknown> }[]) => Promise<void>;
  onReorder: (orderedStudentIds: string[]) => Promise<void>;
  onEditFull: (student: Student) => void;
  onDelete: (id: string) => void;
}

function SortableHeaderCell({ column, sortDirection }: RenderHeaderCellProps<Student>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
      <span>{column.name}</span>
      <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0 }}>
        <CaretUpOutlined
          style={{
            fontSize: 10,
            color: sortDirection === 'ASC' ? '#1677ff' : '#c0c4cc',
          }}
        />
        <CaretDownOutlined
          style={{
            fontSize: 10,
            marginTop: -2,
            color: sortDirection === 'DESC' ? '#1677ff' : '#c0c4cc',
          }}
        />
      </span>
    </div>
  );
}

export function StudentGrid({
  rows,
  loading,
  startIndex,
  visibleKeys,
  dynamicColumns,
  sortColumns,
  onSortColumnsChange,
  canReorder,
  onCellCommit,
  onBulkPaste,
  onReorder,
  onEditFull,
  onDelete,
}: Props) {
  const { columnWidths, setColumnWidth, columnOrder, setColumnOrder, rowHeight } =
    useGridViewStore();
  const [localRows, setLocalRows] = useState(rows);
  const draggedIdRef = useRef<string | null>(null);

  useMemo(() => {
    setLocalRows(rows);
  }, [rows]);

  const orderedColumnDefs = useMemo(() => {
    const allDefs = [...STUDENT_COLUMNS, ...dynamicColumns];
    const visible = allDefs.filter((c) => visibleKeys.includes(c.key));
    if (columnOrder.length === 0) return visible;
    const byKey = new Map(visible.map((c) => [c.key, c]));
    const ordered: StudentColumnDef[] = [];
    for (const key of columnOrder) {
      const c = byKey.get(key);
      if (c) {
        ordered.push(c);
        byKey.delete(key);
      }
    }
    return [...ordered, ...byKey.values()];
  }, [visibleKeys, columnOrder, dynamicColumns]);

  const handleRowDrop = (targetId: string) => {
    const sourceId = draggedIdRef.current;
    draggedIdRef.current = null;
    if (!sourceId || sourceId === targetId) return;

    const current = [...localRows];
    const fromIdx = current.findIndex((r) => r.id === sourceId);
    const toIdx = current.findIndex((r) => r.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, moved);
    setLocalRows(current);
    onReorder(current.map((r) => r.id)).catch(() => {
      message.error('Không thể lưu thứ tự mới');
      setLocalRows(rows);
    });
  };

  const dragHandleColumn: Column<Student> = {
    key: '__drag',
    name: '',
    width: 36,
    resizable: false,
    sortable: false,
    frozen: 'start',
    renderCell: ({ row }) =>
      canReorder ? (
        <div
          draggable
          onDragStart={() => {
            draggedIdRef.current = row.id;
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleRowDrop(row.id)}
          style={{ cursor: 'grab', display: 'flex', justifyContent: 'center' }}
          title="Kéo để đổi thứ tự"
        >
          <HolderOutlined />
        </div>
      ) : null,
  };

  const sttColumn: Column<Student> = {
    key: '__stt',
    name: 'STT',
    width: 52,
    resizable: false,
    sortable: false,
    frozen: 'start',
    cellClass: 'sms-stt-cell',
    renderCell: ({ row }) => {
      const idx = localRows.findIndex((r) => r.id === row.id);
      return idx === -1 ? '' : startIndex + idx + 1;
    },
  };

  const defaultColumnWidth = (label: string) => Math.min(280, Math.max(120, label.length * 13 + 48));

  const dataColumns: Column<Student>[] = orderedColumnDefs.map((def) => ({
    key: def.key,
    name: def.label,
    width: columnWidths[def.key] ?? defaultColumnWidth(def.label),
    resizable: true,
    sortable: def.sortable,
    draggable: true,
    headerCellClass: 'sms-draggable-header',
    editable: Boolean(def.editKind),
    renderCell: ({ row }) => def.getValue(row),
    renderHeaderCell: def.sortable ? (props) => <SortableHeaderCell {...props} /> : undefined,
    renderEditCell: def.editKind
      ? (editProps) => <StudentCellEditor {...editProps} columnDef={def} />
      : undefined,
  }));

  // Invisible filler that absorbs leftover width so the grid always spans
  // the full container instead of leaving a gap after the last real column.
  const spacerColumn: Column<Student> = {
    key: '__spacer',
    name: '',
    width: '1fr',
    minWidth: 0,
    resizable: false,
    sortable: false,
    renderCell: () => null,
  };

  const actionsColumn: Column<Student> = {
    key: '__actions',
    name: '',
    width: 88,
    resizable: false,
    sortable: false,
    frozen: 'end',
    renderCell: ({ row }) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => onEditFull(row)} />
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa học sinh này?"
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => onDelete(row.id)}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    ),
  };

  const columns = [dragHandleColumn, sttColumn, ...dataColumns, spacerColumn, actionsColumn];

  const columnWidthsMap: ColumnWidths = new Map(
    Object.entries(columnWidths).map(([k, w]) => [k, { type: 'resized', width: w }]),
  );

  const parseClipboardGrid = (text: string) =>
    text
      .replace(/\r/g, '')
      .split('\n')
      .filter((line, idx, arr) => !(idx === arr.length - 1 && line === ''))
      .map((line) => line.split('\t'));

  return (
    <DataGrid
      className="rdg-light"
      columns={columns}
      rows={localRows}
      rowKeyGetter={(r) => r.id}
      rowHeight={rowHeight}
      sortColumns={sortColumns}
      onSortColumnsChange={onSortColumnsChange}
      columnWidths={columnWidthsMap}
      onColumnWidthsChange={(widths) => {
        widths.forEach((v, k) => setColumnWidth(k, v.width));
      }}
      onColumnsReorder={(sourceKey, targetKey) => {
        const keys = orderedColumnDefs.map((c) => c.key);
        const from = keys.indexOf(sourceKey);
        const to = keys.indexOf(targetKey);
        if (from === -1 || to === -1) return;
        const next = [...keys];
        next.splice(from, 1);
        next.splice(to, 0, sourceKey);
        setColumnOrder(next);
      }}
      onRowsChange={(changedRows, { indexes, column }) => {
        setLocalRows(changedRows);
        const idx = indexes[0];
        const row = changedRows[idx];
        const def = orderedColumnDefs.find((c) => c.key === column.key);
        const value = def?.isDynamic
          ? def.editKind === 'multiselect'
            ? (row.fieldValues ?? [])
                .filter((v) => v.fieldDefinitionId === column.key)
                .map((v) => v.value)
            : ((row.fieldValues ?? []).find((v) => v.fieldDefinitionId === column.key)?.value ?? null)
          : (row as any)[column.key];
        onCellCommit(row.id, column.key, value).catch(() => {
          message.error('Không thể lưu thay đổi');
          setLocalRows(rows);
        });
      }}
      onCellPaste={(args, event) => {
        const text = event.clipboardData?.getData('text/plain') ?? '';
        const grid = parseClipboardGrid(text);
        if (grid.length === 0) return args.row;

        const startRowIdx = localRows.findIndex((r) => r.id === (args.row as Student).id);
        const startColIdx = dataColumns.findIndex((c) => c.key === args.column.key);
        if (startRowIdx === -1 || startColIdx === -1) return args.row;

        const updates: { studentId: string; values: Record<string, unknown> }[] = [];
        grid.forEach((lineCells, rOffset) => {
          const targetRow = localRows[startRowIdx + rOffset];
          if (!targetRow) return;
          const values: Record<string, unknown> = {};
          lineCells.forEach((cellText, cOffset) => {
            const def = dataColumns[startColIdx + cOffset]
              ? orderedColumnDefs[startColIdx + cOffset]
              : undefined;
            if (!def || !def.editKind || !def.parseValue || def.isDynamic) return;
            values[def.key] = def.parseValue(cellText);
          });
          if (Object.keys(values).length > 0) {
            updates.push({ studentId: targetRow.id, values });
          }
        });

        if (updates.length > 0) {
          onBulkPaste(updates).catch(() => {
            message.error('Dán dữ liệu thất bại');
          });
        }

        return args.row;
      }}
      enableVirtualization
      style={{
        blockSize: Math.min(Math.max(localRows.length, 3) * rowHeight + 36, 640),
        opacity: loading ? 0.6 : 1,
      }}
    />
  );
}
