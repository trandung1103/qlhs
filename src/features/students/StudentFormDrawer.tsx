import { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  DatePicker,
  Select,
  Radio,
  Divider,
  Button,
  Space,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { studentSchema, type StudentSchemaValues } from '../../schemas/student.schema';
import { splitFullName } from '../../utils/name-splitter';
import { studentsService } from '../../services/students.service';
import { getErrorMessage } from '../../services/api';
import type { Student } from '../../types/student';
import { GENDER_LABELS, STUDENT_STATUS_LABELS } from '../../types/student';
import type { FieldDefinition } from '../../types/field';
import { DynamicFieldInput } from './DynamicFieldInput';
import { CreateFieldModal } from './CreateFieldModal';

interface Props {
  open: boolean;
  onClose: () => void;
  schoolYearId: string;
  classId: string;
  editing: Student | null;
  onSaved: () => void;
  fieldDefinitions: FieldDefinition[];
  onFieldsChanged: () => void;
}

const emptyValues = (schoolYearId: string, classId: string): StudentSchemaValues => ({
  schoolYearId,
  classId,
  fullName: '',
  familyAndMiddleName: '',
  firstName: '',
  dateOfBirth: null,
  gender: null,
  identifier: '',
  ethnicity: '',
  nationality: '',
  address: '',
  studentPhone: '',
  previousSchool: '',
  status: null,
  fatherName: '',
  fatherPhone: '',
  fatherJob: '',
  fatherWorkplace: '',
  motherName: '',
  motherPhone: '',
  motherJob: '',
  motherWorkplace: '',
  hasHealthInsurance: null,
  healthInsuranceNumber: '',
  healthInsuranceStartDate: null,
  healthInsuranceEndDate: null,
  healthInsuranceRegisteredHospital: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  policyCategory: '',
  bloodType: '',
  allergy: '',
  healthNotes: '',
  notes: '',
});

export function StudentFormDrawer({
  open,
  onClose,
  schoolYearId,
  classId,
  editing,
  onSaved,
  fieldDefinitions,
  onFieldsChanged,
}: Props) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentSchemaValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: emptyValues(schoolYearId, classId),
  });

  const [customValues, setCustomValues] = useState<Record<string, string | string[]>>({});
  const [addFieldOpen, setAddFieldOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string | string[]> = {};
    for (const fv of editing?.fieldValues ?? []) {
      const fd = fieldDefinitions.find((f) => f.id === fv.fieldDefinitionId);
      if (!fd) continue;
      if (fd.type === 'CHECKBOX') {
        initial[fd.id] = [...((initial[fd.id] as string[]) ?? []), fv.value ?? ''];
      } else {
        initial[fd.id] = fv.value ?? '';
      }
    }
    setCustomValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const base = emptyValues(schoolYearId, classId);
      const merged = { ...base } as StudentSchemaValues;
      for (const key of Object.keys(base) as Array<keyof StudentSchemaValues>) {
        const value = editing[key as keyof Student] as unknown;
        if (value !== null && value !== undefined) {
          (merged as any)[key] = value;
        }
      }
      reset(merged);
    } else {
      reset(emptyValues(schoolYearId, classId));
    }
  }, [open, editing, schoolYearId, classId, reset]);

  const hasHealthInsurance = watch('hasHealthInsurance');

  const handleFullNameBlur = (value: string) => {
    const { fullName, familyAndMiddleName, firstName } = splitFullName(value);
    setValue('fullName', fullName);
    setValue('familyAndMiddleName', familyAndMiddleName);
    setValue('firstName', firstName);
  };

  const onSubmit = async (values: StudentSchemaValues) => {
    try {
      const payload = { ...values, customFields: customValues };
      if (editing) {
        await studentsService.update(editing.id, payload);
        message.success('Đã cập nhật học sinh');
      } else {
        await studentsService.create(payload);
        message.success('Đã thêm học sinh');
      }
      onSaved();
      onClose();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <Drawer
      title={editing ? 'Sửa học sinh' : 'Thêm học sinh'}
      open={open}
      onClose={onClose}
      width={640}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Lưu
          </Button>
        </Space>
      }
    >
      <Form layout="vertical">
        <Divider orientation="left">Thông tin học sinh</Divider>

        <Form.Item label="Họ và tên">
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ''}
                onBlur={(e) => {
                  field.onBlur();
                  handleFullNameBlur(e.target.value);
                }}
                placeholder="Nhập họ và tên đầy đủ, hệ thống sẽ tự tách"
              />
            )}
          />
        </Form.Item>
        <Space.Compact block>
          <Form.Item label="Họ và đệm" style={{ width: '50%' }}>
            <Controller
              name="familyAndMiddleName"
              control={control}
              render={({ field }) => <Input {...field} value={field.value ?? ''} />}
            />
          </Form.Item>
          <Form.Item label="Tên" style={{ width: '50%' }}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => <Input {...field} value={field.value ?? ''} />}
            />
          </Form.Item>
        </Space.Compact>

        <Form.Item label="Ngày sinh">
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                value={field.value ? dayjs(field.value) : null}
                onChange={(d) => field.onChange(d ? d.toISOString() : null)}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Giới tính">
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Radio.Group
                {...field}
                value={field.value ?? undefined}
                options={Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Mã định danh cá nhân">
          <Controller
            name="identifier"
            control={control}
            render={({ field }) => <Input {...field} value={field.value ?? ''} />}
          />
        </Form.Item>
        <Form.Item label="Dân tộc">
          <Controller
            name="ethnicity"
            control={control}
            render={({ field }) => <Input {...field} value={field.value ?? ''} />}
          />
        </Form.Item>
        <Form.Item label="Quốc tịch">
          <Controller
            name="nationality"
            control={control}
            render={({ field }) => <Input {...field} value={field.value ?? ''} />}
          />
        </Form.Item>
        <Form.Item label="Địa chỉ">
          <Controller
            name="address"
            control={control}
            render={({ field }) => <Input {...field} value={field.value ?? ''} />}
          />
        </Form.Item>
        <Form.Item
          label="Số điện thoại học sinh"
          validateStatus={errors.studentPhone ? 'error' : ''}
          help={errors.studentPhone?.message}
        >
          <Controller
            name="studentPhone"
            control={control}
            render={({ field }) => <Input {...field} value={field.value ?? ''} />}
          />
        </Form.Item>

        <Divider orientation="left">Học tập</Divider>
        <Form.Item label="Trường cũ">
          <Controller
            name="previousSchool"
            control={control}
            render={({ field }) => <Input {...field} value={field.value ?? ''} />}
          />
        </Form.Item>
        <Form.Item label="Tình trạng học sinh">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                value={field.value ?? undefined}
                allowClear
                options={Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              />
            )}
          />
        </Form.Item>

        <Divider orientation="left">Thông tin bố</Divider>
        <Form.Item label="Họ tên bố">
          <Controller name="fatherName" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>
        <Form.Item label="Số điện thoại bố" validateStatus={errors.fatherPhone ? 'error' : ''} help={errors.fatherPhone?.message}>
          <Controller name="fatherPhone" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>
        <Form.Item label="Nghề nghiệp bố">
          <Controller name="fatherJob" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>
        <Form.Item label="Nơi công tác bố">
          <Controller name="fatherWorkplace" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>

        <Divider orientation="left">Thông tin mẹ</Divider>
        <Form.Item label="Họ tên mẹ">
          <Controller name="motherName" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>
        <Form.Item label="Số điện thoại mẹ" validateStatus={errors.motherPhone ? 'error' : ''} help={errors.motherPhone?.message}>
          <Controller name="motherPhone" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>
        <Form.Item label="Nghề nghiệp mẹ">
          <Controller name="motherJob" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>
        <Form.Item label="Nơi công tác mẹ">
          <Controller name="motherWorkplace" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>

        <Divider orientation="left">Bảo hiểm y tế</Divider>
        <Form.Item label="Có BHYT">
          <Controller
            name="hasHealthInsurance"
            control={control}
            render={({ field }) => (
              <Radio.Group
                value={field.value === true ? 'yes' : field.value === false ? 'no' : undefined}
                onChange={(e) => field.onChange(e.target.value === 'yes')}
              >
                <Radio value="yes">Có</Radio>
                <Radio value="no">Không</Radio>
              </Radio.Group>
            )}
          />
        </Form.Item>
        {hasHealthInsurance && (
          <>
            <Form.Item label="Số thẻ BHYT">
              <Controller name="healthInsuranceNumber" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
            </Form.Item>
            <Space.Compact block>
              <Form.Item label="Ngày bắt đầu" style={{ width: '50%' }}>
                <Controller
                  name="healthInsuranceStartDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(d) => field.onChange(d ? d.toISOString() : null)}
                    />
                  )}
                />
              </Form.Item>
              <Form.Item label="Ngày hết hạn" style={{ width: '50%' }}>
                <Controller
                  name="healthInsuranceEndDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(d) => field.onChange(d ? d.toISOString() : null)}
                    />
                  )}
                />
              </Form.Item>
            </Space.Compact>
            <Form.Item label="Nơi đăng ký khám chữa bệnh">
              <Controller
                name="healthInsuranceRegisteredHospital"
                control={control}
                render={({ field }) => <Input {...field} value={field.value ?? ''} />}
              />
            </Form.Item>
          </>
        )}

        <Divider orientation="left">Liên hệ khẩn cấp</Divider>
        <Form.Item label="Họ tên">
          <Controller name="emergencyContactName" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>
        <Form.Item label="Quan hệ với học sinh">
          <Controller name="emergencyContactRelationship" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>
        <Form.Item label="Số điện thoại" validateStatus={errors.emergencyContactPhone ? 'error' : ''} help={errors.emergencyContactPhone?.message}>
          <Controller name="emergencyContactPhone" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>

        <Divider orientation="left">Chính sách</Divider>
        <Form.Item label="Đối tượng chính sách">
          <Controller name="policyCategory" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>

        <Divider orientation="left">Sức khỏe</Divider>
        <Form.Item label="Nhóm máu">
          <Controller name="bloodType" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} style={{ width: 120 }} />} />
        </Form.Item>
        <Form.Item label="Dị ứng">
          <Controller name="allergy" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} />} />
        </Form.Item>
        <Form.Item label="Ghi chú sức khỏe">
          <Controller name="healthNotes" control={control} render={({ field }) => <Input.TextArea {...field} value={field.value ?? ''} rows={2} />} />
        </Form.Item>

        <Divider orientation="left">Khác</Divider>
        <Form.Item label="Ghi chú">
          <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} value={field.value ?? ''} rows={2} />} />
        </Form.Item>

        <Divider orientation="left">Mục tùy chỉnh</Divider>
        {fieldDefinitions
          .filter((fd) => fd.isActive)
          .map((fd) => (
            <Form.Item key={fd.id} label={fd.name}>
              <DynamicFieldInput
                fieldDefinition={fd}
                value={customValues[fd.id]}
                onChange={(v) => setCustomValues((prev) => ({ ...prev, [fd.id]: v ?? '' }))}
              />
            </Form.Item>
          ))}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          block
          onClick={() => setAddFieldOpen(true)}
        >
          Thêm mục
        </Button>
      </Form>

      <CreateFieldModal
        open={addFieldOpen}
        schoolYearId={schoolYearId}
        onClose={() => setAddFieldOpen(false)}
        onCreated={() => {
          onFieldsChanged();
        }}
      />
    </Drawer>
  );
}
