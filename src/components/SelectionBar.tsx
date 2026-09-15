import { useEffect, useState, useCallback } from 'react';
import { Select, Button, Space, Typography } from 'antd';
import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { useSelectionStore } from '../stores/selection.store';
import { schoolYearsService } from '../services/school-years.service';
import { classesService } from '../services/classes.service';
import type { SchoolYear } from '../types/school-year';
import type { SchoolClass } from '../types/class';
import { SchoolYearManagerModal } from '../features/school-years/SchoolYearManagerModal';
import { ClassManagerModal } from '../features/classes/ClassManagerModal';
import { SchoolYearFormModal } from '../features/school-years/SchoolYearFormModal';

export function SelectionBar() {
  const { schoolYearId, classId, setSchoolYearId, setClassId } = useSelectionStore();

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [yearManagerOpen, setYearManagerOpen] = useState(false);
  const [classManagerOpen, setClassManagerOpen] = useState(false);
  const [firstYearFormOpen, setFirstYearFormOpen] = useState(false);

  const loadSchoolYears = useCallback(async () => {
    setLoadingYears(true);
    try {
      const data = await schoolYearsService.list();
      setSchoolYears(data);
      if (data.length > 0 && !data.some((y) => y.id === schoolYearId)) {
        setSchoolYearId(data[0].id);
      }
      if (data.length === 0) {
        setSchoolYearId(null);
      }
    } finally {
      setLoadingYears(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClasses = useCallback(async (yearId: string) => {
    setLoadingClasses(true);
    try {
      const data = await classesService.list(yearId);
      setClasses(data);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    loadSchoolYears();
  }, [loadSchoolYears]);

  useEffect(() => {
    if (schoolYearId) {
      loadClasses(schoolYearId);
    } else {
      setClasses([]);
    }
  }, [schoolYearId, loadClasses]);

  useEffect(() => {
    if (classes.length > 0 && !classes.some((c) => c.id === classId)) {
      setClassId(classes[0].id);
    }
    if (classes.length === 0 && classId) {
      setClassId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  if (!loadingYears && schoolYears.length === 0) {
    return (
      <div style={{ padding: '12px 0' }}>
        <Space direction="vertical">
          <Typography.Text type="secondary">Chưa có năm học.</Typography.Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFirstYearFormOpen(true)}>
            Thêm năm học
          </Button>
        </Space>
        <SchoolYearFormModal
          open={firstYearFormOpen}
          editing={null}
          onClose={() => setFirstYearFormOpen(false)}
          onSaved={loadSchoolYears}
        />
      </div>
    );
  }

  return (
    <>
      <Space wrap size="middle" style={{ padding: '12px 0' }}>
        <Space>
          <Typography.Text>Năm học</Typography.Text>
          <Select
            style={{ width: 160 }}
            loading={loadingYears}
            value={schoolYearId ?? undefined}
            options={schoolYears.map((y) => ({ label: y.name, value: y.id }))}
            onChange={setSchoolYearId}
          />
          <Button icon={<SettingOutlined />} onClick={() => setYearManagerOpen(true)} />
        </Space>

        <Space>
          <Typography.Text>Lớp</Typography.Text>
          <Select
            style={{ width: 160 }}
            loading={loadingClasses}
            value={classId ?? undefined}
            disabled={!schoolYearId}
            placeholder={classes.length === 0 ? 'Chưa có lớp' : undefined}
            options={classes.map((c) => ({ label: c.name, value: c.id }))}
            onChange={setClassId}
          />
          <Button icon={<SettingOutlined />} disabled={!schoolYearId} onClick={() => setClassManagerOpen(true)} />
        </Space>
      </Space>

      <SchoolYearManagerModal
        open={yearManagerOpen}
        onClose={() => setYearManagerOpen(false)}
        schoolYears={schoolYears}
        loading={loadingYears}
        onChanged={loadSchoolYears}
      />
      <ClassManagerModal
        open={classManagerOpen}
        onClose={() => setClassManagerOpen(false)}
        schoolYearId={schoolYearId}
        classes={classes}
        loading={loadingClasses}
        onChanged={() => schoolYearId && loadClasses(schoolYearId)}
      />
    </>
  );
}
