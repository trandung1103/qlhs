import { z } from 'zod';

export const classSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên lớp'),
});

export type ClassSchemaValues = z.infer<typeof classSchema>;
