import { z } from 'zod';

export const createCourseSchema = z.object({
  id: z
    .string()
    .min(2, { message: 'Course ID/code must be at least 2 characters (e.g., CPEN401)' })
    .max(50, { message: 'Course ID/code must be at most 50 characters' })
    .transform((val) => val.trim().toUpperCase()),
  name: z
    .string()
    .min(2, { message: 'Course name must be at least 2 characters' })
    .max(200, { message: 'Course name must be at most 200 characters' })
    .transform((val) => val.trim()),
  semester: z
    .string()
    .min(1, { message: 'Semester is required (e.g., First Semester)' })
    .transform((val) => val.trim()),
  lecturerId: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  day: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  startTime: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  endTime: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  slidesFolderId: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export type CreateCourseFormValues = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Course name must be at least 2 characters' })
    .max(200, { message: 'Course name must be at most 200 characters' })
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  semester: z
    .string()
    .min(1, { message: 'Semester cannot be empty' })
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  lecturerId: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  day: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  startTime: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  endTime: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  slidesFolderId: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export type UpdateCourseFormValues = z.infer<typeof updateCourseSchema>;

