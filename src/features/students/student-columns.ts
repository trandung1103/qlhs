import dayjs from 'dayjs';
import type { Student, Gender, StudentStatus } from '../../types/student';
import { GENDER_LABELS, STUDENT_STATUS_LABELS } from '../../types/student';
import { getHealthInsuranceStatus } from '../../utils/health-insurance';

export type EditKind =
  | 'text'
  | 'textarea'
  | 'date'
  | 'gender'
  | 'status'
  | 'boolean'
  | 'number'
  | 'select'
  | 'multiselect';

export interface StudentColumnDef {
  key: string;
  label: string;
  defaultVisible: boolean;
  sortable?: boolean;
  /** Absent for derived/read-only columns (e.g. class name, computed BHYT status). */
  editKind?: EditKind;
  /** Only for editKind 'select' | 'multiselect' (dynamic SELECT/RADIO/CHECKBOX fields). */
  options?: { label: string; value: string }[];
  /** True for user-created custom fields; key is then the FieldDefinition id. */
  isDynamic?: boolean;
  getValue: (s: Student) => string;
  /** Inverse of getValue/format: turns pasted or typed text back into an API value. */
  parseValue?: (text: string) => unknown;
}

const formatDate = (value: string | null) => (value ? dayjs(value).format('DD/MM/YYYY') : '');

const parseDate = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = dayjs(trimmed, ['DD/MM/YYYY', 'YYYY-MM-DD', 'D/M/YYYY'], true);
  return parsed.isValid() ? parsed.toISOString() : trimmed; // let backend validation reject bad input
};

const GENDER_BY_LABEL: Record<string, Gender> = Object.fromEntries(
  Object.entries(GENDER_LABELS).map(([value, label]) => [label.toLowerCase(), value as Gender]),
);
const STATUS_BY_LABEL: Record<string, StudentStatus> = Object.fromEntries(
  Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => [label.toLowerCase(), value as StudentStatus]),
);

const parseGender = (text: string) => GENDER_BY_LABEL[text.trim().toLowerCase()] ?? text.trim();
const parseStatus = (text: string) => STATUS_BY_LABEL[text.trim().toLowerCase()] ?? text.trim();
const parseBoolean = (text: string) => {
  const t = text.trim().toLowerCase();
  if (t === 'có' || t === 'co' || t === 'true' || t === '1') return true;
  if (t === 'không' || t === 'khong' || t === 'false' || t === '0' || t === '') return false;
  return text.trim();
};
const parseText = (text: string) => text.trim();

export const STUDENT_COLUMNS: StudentColumnDef[] = [
  { key: 'fullName', label: 'Họ và tên', defaultVisible: true, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.fullName ?? '' },
  { key: 'className', label: 'Lớp', defaultVisible: true, sortable: true, getValue: (s) => s.class?.name ?? '' },
  { key: 'dateOfBirth', label: 'Ngày sinh', defaultVisible: true, sortable: true, editKind: 'date', parseValue: parseDate, getValue: (s) => formatDate(s.dateOfBirth) },
  { key: 'gender', label: 'Giới tính', defaultVisible: true, sortable: true, editKind: 'gender', parseValue: parseGender, getValue: (s) => (s.gender ? GENDER_LABELS[s.gender] : '') },
  { key: 'identifier', label: 'Mã định danh cá nhân', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.identifier ?? '' },
  { key: 'ethnicity', label: 'Dân tộc', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.ethnicity ?? '' },
  { key: 'nationality', label: 'Quốc tịch', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.nationality ?? '' },
  { key: 'address', label: 'Địa chỉ', defaultVisible: true, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.address ?? '' },
  { key: 'studentPhone', label: 'Số điện thoại học sinh', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.studentPhone ?? '' },
  { key: 'previousSchool', label: 'Trường cũ', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.previousSchool ?? '' },
  { key: 'status', label: 'Tình trạng học sinh', defaultVisible: false, sortable: true, editKind: 'status', parseValue: parseStatus, getValue: (s) => (s.status ? STUDENT_STATUS_LABELS[s.status] : '') },
  { key: 'fatherName', label: 'Họ tên bố', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.fatherName ?? '' },
  { key: 'fatherPhone', label: 'Số điện thoại bố', defaultVisible: true, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.fatherPhone ?? '' },
  { key: 'fatherJob', label: 'Nghề nghiệp bố', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.fatherJob ?? '' },
  { key: 'fatherWorkplace', label: 'Nơi công tác bố', defaultVisible: true, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.fatherWorkplace ?? '' },
  { key: 'motherName', label: 'Họ tên mẹ', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.motherName ?? '' },
  { key: 'motherPhone', label: 'Số điện thoại mẹ', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.motherPhone ?? '' },
  { key: 'motherJob', label: 'Nghề nghiệp mẹ', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.motherJob ?? '' },
  { key: 'motherWorkplace', label: 'Nơi công tác mẹ', defaultVisible: true, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.motherWorkplace ?? '' },
  { key: 'hasHealthInsurance', label: 'Có BHYT', defaultVisible: false, sortable: true, editKind: 'boolean', parseValue: parseBoolean, getValue: (s) => (s.hasHealthInsurance == null ? '' : s.hasHealthInsurance ? 'Có' : 'Không') },
  { key: 'healthInsuranceNumber', label: 'Số thẻ BHYT', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.healthInsuranceNumber ?? '' },
  { key: 'healthInsuranceStartDate', label: 'Ngày bắt đầu BHYT', defaultVisible: false, sortable: true, editKind: 'date', parseValue: parseDate, getValue: (s) => formatDate(s.healthInsuranceStartDate) },
  { key: 'healthInsuranceEndDate', label: 'Ngày hết hạn BHYT', defaultVisible: false, sortable: true, editKind: 'date', parseValue: parseDate, getValue: (s) => formatDate(s.healthInsuranceEndDate) },
  { key: 'healthInsuranceStatus', label: 'Tình trạng BHYT', defaultVisible: false, getValue: (s) => getHealthInsuranceStatus(s.hasHealthInsurance, s.healthInsuranceEndDate) },
  { key: 'healthInsuranceRegisteredHospital', label: 'Nơi đăng ký khám chữa bệnh', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.healthInsuranceRegisteredHospital ?? '' },
  { key: 'emergencyContactName', label: 'Họ tên người liên hệ khẩn cấp', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.emergencyContactName ?? '' },
  { key: 'emergencyContactRelationship', label: 'Quan hệ với học sinh', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.emergencyContactRelationship ?? '' },
  { key: 'emergencyContactPhone', label: 'Số điện thoại liên hệ khẩn cấp', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.emergencyContactPhone ?? '' },
  { key: 'policyCategory', label: 'Đối tượng chính sách', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.policyCategory ?? '' },
  { key: 'bloodType', label: 'Nhóm máu', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.bloodType ?? '' },
  { key: 'allergy', label: 'Dị ứng', defaultVisible: false, sortable: true, editKind: 'text', parseValue: parseText, getValue: (s) => s.allergy ?? '' },
  { key: 'healthNotes', label: 'Ghi chú sức khỏe', defaultVisible: false, sortable: true, editKind: 'textarea', parseValue: parseText, getValue: (s) => s.healthNotes ?? '' },
  { key: 'notes', label: 'Ghi chú', defaultVisible: false, sortable: true, editKind: 'textarea', parseValue: parseText, getValue: (s) => s.notes ?? '' },
];
