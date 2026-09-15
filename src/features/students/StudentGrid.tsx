import { useEffect, useMemo, useRef, useState } from 'react';
import { DataGrid, type Column, type SortColumn, type ColumnWidths } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import './student-grid.css';
import { Button, Space, Popconfirm, message } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  HolderOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { RenderHeaderCellProps } from 'react-data-grid';
import type { Student } from '../../types/student';
import { STUDENT_COLUMNS, type StudentColumnDef } from './student-columns';
import { StudentCellEditor } from './StudentCellEditor';
import { useGridViewStore } from './grid-view.store';
import { isPlaceholderRow } from './placeholder-row';

/** One field's before/after value, enough to reverse or replay an edit. */
export interface FieldChange {
  studentId: string;
  field: string;
  isDynamic: boolean;
  prevValue: unknown;
  nextValue: unknown;
}

interface Props {
  rows: Student[];
  loading: boolean;
  startIndex: number;
  visibleKeys: string[];
  dynamicColumns: StudentColumnDef[];
  sortColumns: SortColumn[];
  onSortColumnsChange: (columns: SortColumn[]) => void;
  canReorder: boolean;
  onCellCommit: (studentId: string, field: string, value: unknown, prevValue: unknown) => Promise<void>;
  onBulkPaste: (
    rows: { studentId: string; values: Record<string, unknown> }[],
    changes: FieldChange[],
  ) => Promise<void>;
  onCreateBlankRows: (count: number) => Promise<Student[]>;
  onRequestBlankRow: () => Student;
  /** Pasted data had more columns than exist from the paste anchor onward — create `count` new text columns. */
  onCreateColumns: (count: number) => Promise<StudentColumnDef[]>;
  onReorder: (orderedStudentIds: string[]) => Promise<void>;
  onEditFull: (student: Student) => void;
  onDelete: (id: string) => void;
}

function readFieldValue(row: Student, def: StudentColumnDef): unknown {
  if (!def.isDynamic) return (row as any)[def.key];
  return def.editKind === 'multiselect'
    ? (row.fieldValues ?? []).filter((v) => v.fieldDefinitionId === def.key).map((v) => v.value)
    : ((row.fieldValues ?? []).find((v) => v.fieldDefinitionId === def.key)?.value ?? null);
}

/** Anchor + focus corners of a rectangular cell-range selection (row/col are indexes into localRows / orderedColumnDefs). */
interface CellRange {
  anchorRow: number;
  anchorCol: number;
  focusRow: number;
  focusCol: number;
}

// `columns` is always [dragHandleColumn, sttColumn, ...dataColumns, spacerColumn, actionsColumn],
// and there's always exactly one header row — used to translate a DOM cell's
// aria-colindex/aria-rowindex (picked up during a mouse-drag selection) back
// into a data-column / localRows index.
const DATA_COLUMN_OFFSET = 2;
const HEADER_ROW_COUNT = 1;

// How long a touch must be held before it's treated as "start a range-select
// or row-drag" instead of "the user is scrolling".
const LONG_PRESS_MS = 450;
const MOVE_CANCEL_THRESHOLD = 10;

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
  onCreateBlankRows,
  onRequestBlankRow,
  onCreateColumns,
  onReorder,
  onEditFull,
  onDelete,
}: Props) {
  const { columnWidths, setColumnWidth, columnOrder, setColumnOrder, rowHeight } =
    useGridViewStore();
  const [localRows, setLocalRows] = useState(rows);
  const [selection, setSelection] = useState<CellRange | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const draggedIdRef = useRef<string | null>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const touchLongPressTimerRef = useRef<number | null>(null);
  const touchStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const touchDragModeRef = useRef<'none' | 'range' | 'row'>('none');
  const touchDraggedRowIdRef = useRef<string | null>(null);

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

  const colKeyToIdx = useMemo(
    () => new Map(orderedColumnDefs.map((d, i) => [d.key, i])),
    [orderedColumnDefs],
  );
  const rowIdToIdx = useMemo(
    () => new Map(localRows.map((r, i) => [r.id, i])),
    [localRows],
  );

  // Translates the element under a screen point back into a { rowIdx, colIdx }
  // data-grid coordinate, via the aria-colindex/aria-rowindex the grid always
  // renders on gridcells/rows. Shared by the mouse-drag and touch-drag range
  // selection below, since react-data-grid only exposes single-cell events.
  const resolveCellFromPoint = (clientX: number, clientY: number) => {
    const target = document.elementFromPoint(clientX, clientY);
    const cellEl = target?.closest('[role="gridcell"]');
    const ariaColIndex = cellEl?.getAttribute('aria-colindex');
    if (!ariaColIndex) return null;
    const colIdx = Number(ariaColIndex) - 1 - DATA_COLUMN_OFFSET;
    if (colIdx < 0 || colIdx >= orderedColumnDefs.length) return null;

    const rowEl = cellEl?.closest('[role="row"]');
    const ariaRowIndex = rowEl?.getAttribute('aria-rowindex');
    if (!ariaRowIndex) return null;
    const rowIdx = Number(ariaRowIndex) - 1 - HEADER_ROW_COUNT;
    if (rowIdx < 0 || rowIdx >= localRows.length) return null;

    return { rowIdx, colIdx };
  };

  // Excel-like click-and-drag range selection (mouse).
  useEffect(() => {
    if (!isDraggingSelection) return;

    const handleMouseMove = (event: MouseEvent) => {
      const cell = resolveCellFromPoint(event.clientX, event.clientY);
      if (!cell) return;
      setSelection((prev) => (prev ? { ...prev, focusRow: cell.rowIdx, focusCol: cell.colIdx } : prev));
    };
    const stopDragging = () => setIsDraggingSelection(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDragging);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDragging);
    };
  }, [isDraggingSelection, orderedColumnDefs.length, localRows.length]);

  const selectionBounds = selection && {
    minRow: Math.min(selection.anchorRow, selection.focusRow),
    maxRow: Math.max(selection.anchorRow, selection.focusRow),
    minCol: Math.min(selection.anchorCol, selection.focusCol),
    maxCol: Math.max(selection.anchorCol, selection.focusCol),
  };
  // A single selected cell already gets react-data-grid's own active-cell
  // border, so the custom highlight is only for genuine multi-cell ranges.
  const isMultiCellRange =
    selectionBounds !== null &&
    (selectionBounds.minRow !== selectionBounds.maxRow ||
      selectionBounds.minCol !== selectionBounds.maxCol);

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

  // Touch equivalent of the mouse-drag range selection and native HTML5 row
  // drag-and-drop above (neither fires from touch input). A quick tap/swipe
  // still scrolls normally; only a long-press (without much movement first)
  // hands the gesture over to range-select or row-reorder, mirroring how
  // mobile spreadsheet apps distinguish "scroll" from "select/drag".
  useEffect(() => {
    const wrapper = gridWrapperRef.current;
    if (!wrapper) return;

    const clearLongPressTimer = () => {
      if (touchLongPressTimerRef.current !== null) {
        window.clearTimeout(touchLongPressTimerRef.current);
        touchLongPressTimerRef.current = null;
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchStartPointRef.current = { x: touch.clientX, y: touch.clientY };
      touchDragModeRef.current = 'none';
      touchDraggedRowIdRef.current = null;

      const isDragHandle = Boolean((event.target as HTMLElement).closest('.sms-row-drag-handle'));
      const cell = resolveCellFromPoint(touch.clientX, touch.clientY);

      clearLongPressTimer();
      touchLongPressTimerRef.current = window.setTimeout(() => {
        touchLongPressTimerRef.current = null;
        if (!cell) return;
        const row = localRows[cell.rowIdx];
        if (isDragHandle && row && canReorder && !isPlaceholderRow(row)) {
          touchDragModeRef.current = 'row';
          touchDraggedRowIdRef.current = row.id;
        } else {
          touchDragModeRef.current = 'range';
          setSelection({
            anchorRow: cell.rowIdx,
            anchorCol: cell.colIdx,
            focusRow: cell.rowIdx,
            focusCol: cell.colIdx,
          });
        }
      }, LONG_PRESS_MS);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      if (touchDragModeRef.current === 'none') {
        const start = touchStartPointRef.current;
        if (start && Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > MOVE_CANCEL_THRESHOLD) {
          // Moved before the long-press fired — this is a normal scroll, not a select/drag.
          clearLongPressTimer();
        }
        return;
      }

      // A long-press drag has taken over the gesture — stop the page from
      // scrolling underneath it.
      event.preventDefault();
      const cell = resolveCellFromPoint(touch.clientX, touch.clientY);
      if (!cell) return;
      if (touchDragModeRef.current === 'range') {
        setSelection((prev) => (prev ? { ...prev, focusRow: cell.rowIdx, focusCol: cell.colIdx } : prev));
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      clearLongPressTimer();
      const touch = event.changedTouches[0];
      if (touchDragModeRef.current === 'row' && touch && touchDraggedRowIdRef.current) {
        const cell = resolveCellFromPoint(touch.clientX, touch.clientY);
        const targetRow = cell ? localRows[cell.rowIdx] : undefined;
        if (targetRow) {
          draggedIdRef.current = touchDraggedRowIdRef.current;
          handleRowDrop(targetRow.id);
        }
      }
      touchDragModeRef.current = 'none';
      touchDraggedRowIdRef.current = null;
      touchStartPointRef.current = null;
    };

    wrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
    wrapper.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    return () => {
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchmove', handleTouchMove);
      wrapper.removeEventListener('touchend', handleTouchEnd);
      wrapper.removeEventListener('touchcancel', handleTouchEnd);
      clearLongPressTimer();
    };
  }, [localRows, orderedColumnDefs, canReorder]);

  const dragHandleColumn: Column<Student> = {
    key: '__drag',
    name: '',
    width: 36,
    resizable: false,
    sortable: false,
    frozen: 'start',
    renderCell: ({ row }) =>
      canReorder && !isPlaceholderRow(row) ? (
        <div
          className="sms-row-drag-handle"
          draggable
          onDragStart={() => {
            draggedIdRef.current = row.id;
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleRowDrop(row.id)}
          style={{ cursor: 'grab', display: 'flex', justifyContent: 'center' }}
          title="Kéo để đổi thứ tự (trên điện thoại: nhấn giữ rồi kéo)"
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

  const dataColumns: Column<Student>[] = orderedColumnDefs.map((def, colIdx) => ({
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
    cellClass: (row) => {
      if (!isMultiCellRange || !selectionBounds) return undefined;
      const rowIdx = rowIdToIdx.get(row.id);
      if (rowIdx === undefined) return undefined;
      const inRange =
        rowIdx >= selectionBounds.minRow &&
        rowIdx <= selectionBounds.maxRow &&
        colIdx >= selectionBounds.minCol &&
        colIdx <= selectionBounds.maxCol;
      return inRange ? 'sms-range-selected' : undefined;
    },
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
    renderCell: ({ row }) =>
      isPlaceholderRow(row) ? (
        <Button
          size="small"
          type="text"
          icon={<CloseOutlined />}
          title="Bỏ dòng trống này"
          onClick={() => setLocalRows((prev) => prev.filter((r) => r.id !== row.id))}
        />
      ) : (
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
    <div ref={gridWrapperRef}>
    <DataGrid
      className={isDraggingSelection ? 'rdg-light sms-dragging-selection' : 'rdg-light'}
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
        if (!def) return;
        const value = readFieldValue(row, def);

        if (isPlaceholderRow(row)) {
          // Not a real student yet — create it now, then commit the edited field to it.
          onCreateBlankRows(1)
            .then(([created]) => {
              if (!created) throw new Error('No row created');
              const merged: Student = {
                ...row,
                id: created.id,
                schoolYearId: created.schoolYearId,
                classId: created.classId,
                createdAt: created.createdAt,
                updatedAt: created.updatedAt,
              };
              setLocalRows((prev) => {
                const i = prev.findIndex((r) => r.id === row.id);
                if (i === -1) return prev;
                const next = [...prev];
                next[i] = merged;
                return next;
              });
              return onCellCommit(created.id, column.key, value, readFieldValue(created, def));
            })
            .catch(() => {
              message.error('Không thể tạo học sinh mới');
            });
          return;
        }

        const original = rows.find((r) => r.id === row.id);
        const prevValue = original ? readFieldValue(original, def) : value;
        onCellCommit(row.id, column.key, value, prevValue).catch(() => {
          message.error('Không thể lưu thay đổi');
          setLocalRows(rows);
        });
      }}
      onCellMouseDown={(args, event) => {
        // A tap on touch devices synthesizes a mousedown too — let the
        // dedicated touch handlers (long-press to drag-select) own that
        // gesture instead of double-handling it here.
        if ((event.nativeEvent as any).sourceCapabilities?.firesTouchEvents) return;
        const colIdx = colKeyToIdx.get(args.column.key);
        if (colIdx === undefined) return;
        if (event.shiftKey && selection) {
          // Extend the existing range to this cell; no drag-tracking needed.
          args.setActivePosition();
          setSelection({ ...selection, focusRow: args.rowIdx, focusCol: colIdx });
          return;
        }
        // Prevent the browser's own text-selection drag so our custom
        // range-drag is the only thing that reacts to the mouse move.
        event.preventDefault();
        args.setActivePosition();
        setSelection({ anchorRow: args.rowIdx, anchorCol: colIdx, focusRow: args.rowIdx, focusCol: colIdx });
        setIsDraggingSelection(true);
      }}
      onCellKeyDown={(args, event) => {
        if (args.mode !== 'ACTIVE' || !args.column) return;
        const isArrow =
          event.key === 'ArrowUp' ||
          event.key === 'ArrowDown' ||
          event.key === 'ArrowLeft' ||
          event.key === 'ArrowRight';
        if (!event.shiftKey || !isArrow) {
          if (selection) setSelection(null);
          return;
        }
        const colIdx = colKeyToIdx.get(args.column.key);
        if (colIdx === undefined) return;
        event.preventGridDefault();
        setSelection((prev) => {
          const anchorRow = prev ? prev.anchorRow : args.rowIdx;
          const anchorCol = prev ? prev.anchorCol : colIdx;
          let focusRow = prev ? prev.focusRow : args.rowIdx;
          let focusCol = prev ? prev.focusCol : colIdx;
          if (event.key === 'ArrowUp') focusRow = Math.max(0, focusRow - 1);
          if (event.key === 'ArrowDown') focusRow = Math.min(localRows.length - 1, focusRow + 1);
          if (event.key === 'ArrowLeft') focusCol = Math.max(0, focusCol - 1);
          if (event.key === 'ArrowRight')
            focusCol = Math.min(orderedColumnDefs.length - 1, focusCol + 1);
          return { anchorRow, anchorCol, focusRow, focusCol };
        });
      }}
      onCellCopy={(_args, event) => {
        if (!isMultiCellRange || !selectionBounds) return; // fall back to default single-cell copy
        const lines: string[] = [];
        for (let r = selectionBounds.minRow; r <= selectionBounds.maxRow; r++) {
          const row = localRows[r];
          if (!row) continue;
          const cells: string[] = [];
          for (let c = selectionBounds.minCol; c <= selectionBounds.maxCol; c++) {
            const def = orderedColumnDefs[c];
            cells.push(def ? def.getValue(row) : '');
          }
          lines.push(cells.join('\t'));
        }
        event.preventDefault();
        event.clipboardData?.setData('text/plain', lines.join('\n'));
      }}
      onCellPaste={(args, event) => {
        const text = event.clipboardData?.getData('text/plain') ?? '';
        const grid = parseClipboardGrid(text);
        if (grid.length === 0) return args.row;

        let anchorRowIdx: number | undefined;
        let anchorColIdx: number | undefined;
        if (selectionBounds) {
          anchorRowIdx = selectionBounds.minRow;
          anchorColIdx = selectionBounds.minCol;
        } else {
          anchorRowIdx = rowIdToIdx.get((args.row as Student).id);
          anchorColIdx = colKeyToIdx.get(args.column.key);
        }
        if (anchorRowIdx === undefined || anchorColIdx === undefined) return args.row;
        const startRowIdx = anchorRowIdx;
        const startColIdx = anchorColIdx;

        const applyPaste = async () => {
          let targetRows = [...localRows];

          // Placeholder rows inside the pasted range need to become real
          // students too, not just the ones added past the end of the list.
          const placeholderIdxs: number[] = [];
          for (let r = 0; r < grid.length; r++) {
            const idx = startRowIdx + r;
            if (idx < targetRows.length && isPlaceholderRow(targetRows[idx])) {
              placeholderIdxs.push(idx);
            }
          }
          const rowsNeeded = Math.max(0, startRowIdx + grid.length - targetRows.length);
          const totalToCreate = placeholderIdxs.length + rowsNeeded;

          if (totalToCreate > 0) {
            const created = await onCreateBlankRows(totalToCreate);
            let ci = 0;
            for (const idx of placeholderIdxs) {
              targetRows[idx] = created[ci++];
            }
            if (rowsNeeded > 0) {
              targetRows = [...targetRows, ...created.slice(ci)];
            }
            setLocalRows(targetRows);
          }

          // Pasted range is wider than the columns from the anchor onward —
          // add plain-text columns to hold the overflow, the way Excel would
          // extend the sheet instead of silently dropping the extra cells.
          const maxLineLen = grid.reduce((max, line) => Math.max(max, line.length), 0);
          const colsNeeded = Math.max(0, startColIdx + maxLineLen - orderedColumnDefs.length);
          const effectiveColumnDefs =
            colsNeeded > 0 ? [...orderedColumnDefs, ...(await onCreateColumns(colsNeeded))] : orderedColumnDefs;

          const updates: { studentId: string; values: Record<string, unknown> }[] = [];
          const changes: FieldChange[] = [];
          grid.forEach((lineCells, rOffset) => {
            const targetRow = targetRows[startRowIdx + rOffset];
            if (!targetRow) return;
            const values: Record<string, unknown> = {};
            let customFields: Record<string, unknown> | undefined;
            lineCells.forEach((cellText, cOffset) => {
              const def = effectiveColumnDefs[startColIdx + cOffset];
              if (!def || !def.editKind || !def.parseValue) return;
              const parsed = def.parseValue(cellText);
              changes.push({
                studentId: targetRow.id,
                field: def.key,
                isDynamic: Boolean(def.isDynamic),
                prevValue: readFieldValue(targetRow, def),
                nextValue: parsed,
              });
              if (def.isDynamic) {
                customFields ??= {};
                customFields[def.key] = parsed as string | string[];
              } else {
                values[def.key] = parsed;
              }
            });
            if (customFields) values.customFields = customFields;
            if (Object.keys(values).length > 0) {
              updates.push({ studentId: targetRow.id, values });
            }
          });

          if (updates.length > 0) {
            await onBulkPaste(updates, changes);
          }
        };

        applyPaste().catch(() => {
          message.error('Dán dữ liệu thất bại');
        });

        return args.row;
      }}
      enableVirtualization
      style={{
        blockSize: Math.min(Math.max(localRows.length, 3) * rowHeight + 36, 640),
        opacity: loading ? 0.6 : 1,
      }}
    />
    <Button
      type="dashed"
      size="small"
      icon={<PlusOutlined />}
      style={{ marginTop: 8 }}
      onClick={() => setLocalRows((prev) => [...prev, onRequestBlankRow()])}
    >
      Thêm dòng trống
    </Button>
    </div>
  );
}
