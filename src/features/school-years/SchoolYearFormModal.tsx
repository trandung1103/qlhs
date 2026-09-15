import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schoolYearSchema, type SchoolYearSchemaValues } from '../../schemas/school-year.schema';
import { schoolYearsService } from '../../services/school-years.service';
import { getErrorMessage } from '../../services/api';
import type { SchoolYear } from '../../types/school-year';

interface Props {
  open: boolean;
  editing: SchoolYear | null;
  onClose: () => void;
  onSaved: () => void;
}

export function SchoolYearFormModal({ open, editing, onClose, onSaved }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SchoolYearSchemaValues>({
    resolver: zodResolver(schoolYearSchema),
    defaultValues: { name: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1 },
  });

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? { name: editing.name, startYear: editing.startYear, endYear: editing.endYear }
          : { name: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1 },
      );
    }
  }, [open, editing, reset]);

  const onSubmit = async (values: SchoolYearSchemaValues) => {
    try {
      if (editing) {
        await schoolYearsService.update(editing.id, values);
        message.success('Đã cập nhật năm học');
      } else {
        await schoolYearsService.create(values);
        message.success('Đã tạo năm học');
      }
      onSaved();
      onClose();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <Modal
      title={editing ? 'Sửa năm học' : 'Thêm năm học'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form layout="vertical">
        <Form.Item label="Tên năm học" required validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="VD: 2026-2027" />}
          />
        </Form.Item>
        <Form.Item label="Năm bắt đầu" required validateStatus={errors.startYear ? 'error' : ''} help={errors.startYear?.message}>
          <Controller
            name="startYear"
            control={control}
            render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} />}
          />
        </Form.Item>
        <Form.Item label="Năm kết thúc" required validateStatus={errors.endYear ? 'error' : ''} help={errors.endYear?.message}>
          <Controller
            name="endYear"
            control={control}
            render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} />}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
