import { z } from 'zod';

export const schoolYearSchema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập tên năm học'),
    startYear: z.number().int().min(2000).max(2100),
    endYear: z.number().int().min(2000).max(2100),
  })
  .refine((v) => v.endYear === v.startYear + 1, {
    message: 'Năm kết thúc phải liền sau năm bắt đầu',
    path: ['endYear'],
  });

export type SchoolYearSchemaValues = z.infer<typeof schoolYearSchema>;
