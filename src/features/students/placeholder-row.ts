import type { Student } from '../../types/student';

/**
 * A placeholder row is shown in the grid but doesn't exist in the database yet.
 * It only becomes a real student the moment the user edits or pastes into it
 * (see StudentGrid's onRowsChange / onCellPaste), so an empty class doesn't get
 * polluted with blank records just from being opened.
 */
export const PLACEHOLDER_ID_PREFIX = '__placeholder-';

/** How many blank rows to show when a class has no students yet. */
export const PLACEHOLDER_ROW_COUNT = 20;

export const isPlaceholderRow = (row: Student) => row.id.startsWith(PLACEHOLDER_ID_PREFIX);

let seq = 0;

export function makePlaceholderStudent(schoolYearId: string, classId: string): Student {
  return {
    id: `${PLACEHOLDER_ID_PREFIX}${seq++}`,
    schoolYearId,
    classId,
    fullName: null,
    familyAndMiddleName: null,
    firstName: null,
    dateOfBirth: null,
    gender: null,
    identifier: null,
    ethnicity: null,
    nationality: null,
    address: null,
    studentPhone: null,
    previousSchool: null,
    status: null,
    fatherName: null,
    fatherPhone: null,
    fatherJob: null,
    fatherWorkplace: null,
    motherName: null,
    motherPhone: null,
    motherJob: null,
    motherWorkplace: null,
    hasHealthInsurance: null,
    healthInsuranceNumber: null,
    healthInsuranceStartDate: null,
    healthInsuranceEndDate: null,
    healthInsuranceRegisteredHospital: null,
    emergencyContactName: null,
    emergencyContactRelationship: null,
    emergencyContactPhone: null,
    policyCategory: null,
    bloodType: null,
    allergy: null,
    healthNotes: null,
    notes: null,
    fieldValues: [],
    createdAt: '',
    updatedAt: '',
  };
}

export function makePlaceholderStudents(count: number, schoolYearId: string, classId: string): Student[] {
  return Array.from({ length: count }, () => makePlaceholderStudent(schoolYearId, classId));
}
