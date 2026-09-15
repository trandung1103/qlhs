import { useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { fieldsService } from '../../services/fields.service';
import { getErrorMessage } from '../../services/api';
import {
  FIELD_TYPE_LABELS,
  FIELD_TYPES_WITH_OPTIONS,
  type FieldType,
} from '../../types/field';

interface Props {
  open: boolean;
  schoolYearId: string;
  onClose: () => void;
  onCreated: (fieldId: string) => void;
}

export function CreateFieldModal({ open, schoolYearId, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>('TEXT');
  const [options, setOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setType('TEXT');
    setOptions([]);
  };

  const handleOk = async () => {
    if (!name.trim()) {
      message.warning('Vui lòng nhập tên cột');
      return;
    }
    setSubmitting(true);
    try {
      const field = await fieldsService.create({ schoolYearId, name: name.trim(), type });
      if (FIELD_TYPES_WITH_OPTIONS.includes(type) && options.length > 0) {
        for (let i = 0; i < options.length; i++) {
          await fieldsService.createOption(field.id, {
            label: options[i],
            value: options[i],
            displayOrder: i + 1,
          });
        }
      }
      message.success('Đã thêm cột mới');
      reset();
      onCreated(field.id);
      onClose();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Thêm mục"
      open={open}
      onCancel={() => {
        reset();
        onClose();
      }}
      onOk={handleOk}
      confirmLoading={submitting}
      okText="Tạo cột"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form layout="vertical">
        <Form.Item label="Tên mục" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Hoàn cảnh gia đình"
          autoFocus
          />
        </Form.Item>
        <Form.Item label="Kiểu dữ liệu" required>
          <Select
            value={type}
            onChange={setType}
            options={Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </Form.Item>
        {FIELD_TYPES_WITH_OPTIONS.includes(type) && (
          <Form.Item
            label="Các lựa chọn"
            help="Gõ từng lựa chọn rồi nhấn Enter để thêm"
          >
            <Select
              mode="tags"
              value={options}
              onChange={setOptions}
              placeholder="VD: Kinh, Tày, Thái..."
              tokenSeparators={[',']}
              open={false}
              suffixIcon={null}
              notFoundContent={null}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
