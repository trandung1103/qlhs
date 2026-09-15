export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type StudentStatus =
  | 'STUDYING'
  | 'TRANSFERRED'
  | 'DROPPED_OUT'
  | 'ON_LEAVE'
  | 'COMPLETED';

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  STUDYING: 'Đang học',
  TRANSFERRED: 'Chuyển trường',
  DROPPED_OUT: 'Nghỉ học',
  ON_LEAVE: 'Bảo lưu',
  COMPLETED: 'Hoàn thành năm học',
};

export interface Student {
  id: string;
  schoolYearId: string;
  classId: string;
  class?: { id: string; name: string };
  fieldValues?: { fieldDefinitionId: string; value: string | null }[];

  fullName: string | null;
  familyAndMiddleName: string | null;
  firstName: string | null;

  dateOfBirth: string | null;
  gender: Gender | null;
  identifier: string | null;
  ethnicity: string | null;
  nationality: string | null;
  address: string | null;
  studentPhone: string | null;

  previousSchool: string | null;
  status: StudentStatus | null;

  fatherName: string | null;
  fatherPhone: string | null;
  fatherJob: string | null;
  fatherWorkplace: string | null;

  motherName: string | null;
  motherPhone: string | null;
  motherJob: string | null;
  motherWorkplace: string | null;

  hasHealthInsurance: boolean | null;
  healthInsuranceNumber: string | null;
  healthInsuranceStartDate: string | null;
  healthInsuranceEndDate: string | null;
  healthInsuranceRegisteredHospital: string | null;

  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;

  policyCategory: string | null;

  bloodType: string | null;
  allergy: string | null;
  healthNotes: string | null;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export type StudentFormValues = Omit<
  Student,
  'id' | 'class' | 'createdAt' | 'updatedAt'
>;

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StudentQueryParams {
  schoolYearId: string;
  classId?: string;
  search?: string;
  gender?: Gender;
  status?: StudentStatus;
  hasHealthInsurance?: boolean;
  ethnicity?: string;
  bloodType?: string;
  policyCategory?: string;
  dateOfBirthFrom?: string;
  dateOfBirthTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
