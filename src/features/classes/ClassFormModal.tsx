import { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { classSchema, type ClassSchemaValues } from '../../schemas/class.schema';
import { classesService } from '../../services/classes.service';
import { getErrorMessage } from '../../services/api';
import type { SchoolClass } from '../../types/class';

interface Props {
  open: boolean;
  schoolYearId: string | null;
  editing: SchoolClass | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ClassFormModal({ open, schoolYearId, editing, onClose, onSaved }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassSchemaValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ name: editing?.name ?? '' });
    }
  }, [open, editing, reset]);

  const onSubmit = async (values: ClassSchemaValues) => {
    if (!schoolYearId) return;
    try {
      if (editing) {
        await classesService.update(editing.id, values);
        message.success('Đã cập nhật lớp');
      } else {
        await classesService.create({ schoolYearId, name: values.name });
        message.success('Đã tạo lớp');
      }
      onSaved();
      onClose();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <Modal
      title={editing ? 'Sửa lớp' : 'Thêm lớp'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form layout="vertical">
        <Form.Item label="Tên lớp" required validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="VD: 5A" />}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
