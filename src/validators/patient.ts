import { z } from 'zod';

export const patientCreateSchema = z.object({
  dni: z.string().min(6).max(20),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.coerce.date(),
  sex: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const patientUpdateSchema = patientCreateSchema.partial().extend({
  dni: z.string().min(6).max(20).optional(),
});
