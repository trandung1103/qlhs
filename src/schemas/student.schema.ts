import { z } from 'zod';

const vnPhoneRegex = /^(0|\+84)[0-9]{9,10}$/;

const optionalString = z.string().optional().or(z.literal(''));

const optionalPhone = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || vnPhoneRegex.test(v), { message: 'Số điện thoại không hợp lệ' });

export const studentSchema = z.object({
  schoolYearId: z.string().min(1),
  classId: z.string().min(1, 'Vui lòng chọn lớp'),

  fullName: optionalString,
  familyAndMiddleName: optionalString,
  firstName: optionalString,

  dateOfBirth: z.string().nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
  identifier: optionalString,
  ethnicity: optionalString,
  nationality: optionalString,
  address: optionalString,
  studentPhone: optionalPhone,

  previousSchool: optionalString,
  status: z
    .enum(['STUDYING', 'TRANSFERRED', 'DROPPED_OUT', 'ON_LEAVE', 'COMPLETED'])
    .nullable()
    .optional(),

  fatherName: optionalString,
  fatherPhone: optionalPhone,
  fatherJob: optionalString,
  fatherWorkplace: optionalString,

  motherName: optionalString,
  motherPhone: optionalPhone,
  motherJob: optionalString,
  motherWorkplace: optionalString,

  hasHealthInsurance: z.boolean().nullable().optional(),
  healthInsuranceNumber: optionalString,
  healthInsuranceStartDate: z.string().nullable().optional(),
  healthInsuranceEndDate: z.string().nullable().optional(),
  healthInsuranceRegisteredHospital: optionalString,

  emergencyContactName: optionalString,
  emergencyContactRelationship: optionalString,
  emergencyContactPhone: optionalPhone,

  policyCategory: optionalString,

  bloodType: optionalString,
  allergy: optionalString,
  healthNotes: optionalString,

  notes: optionalString,
});

export type StudentSchemaValues = z.infer<typeof studentSchema>;
