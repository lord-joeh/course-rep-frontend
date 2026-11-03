import { z } from 'zod';

export const createLecturerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Lecturer name must be at least 2 characters' })
    .max(100, { message: 'Lecturer name must be at most 100 characters' }),
  email: z
    .string()
    .email({ message: 'A valid email address is required' })
    .transform((val) => val.trim().toLowerCase()),
  phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export type CreateLecturerFormValues = z.infer<typeof createLecturerSchema>;

export const updateLecturerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Lecturer name must be at least 2 characters' })
    .max(100, { message: 'Lecturer name must be at most 100 characters' })
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email({ message: 'A valid email address is required' })
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim().toLowerCase() : undefined)),
  phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export type UpdateLecturerFormValues = z.infer<typeof updateLecturerSchema>;

