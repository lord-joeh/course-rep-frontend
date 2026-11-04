import { z } from 'zod';

export const eventTypeEnum = z.enum([
  'lecture',
  'tutorial',
  'exam',
  'deadline',
  'meeting',
  'seminar',
  'other',
]);

export const recurrenceFrequencyEnum = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
]);

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Event title must be at least 3 characters')
      .max(255, 'Title cannot exceed 255 characters')
      .trim(),
    description: z.string().optional().or(z.literal('')),
    eventType: eventTypeEnum.default('lecture'),
    courseId: z.string().optional().or(z.literal('')),
    startDate: z.string().min(1, 'Start date and time is required'),
    endDate: z.string().min(1, 'End date and time is required'),
    venue: z
      .string()
      .min(1, 'Venue or room is required (e.g. "Lecture Hall 2" or "Online")')
      .max(255, 'Venue cannot exceed 255 characters')
      .trim(),
    meetingLink: z
      .string()
      .url('Please enter a valid URL (e.g. https://meet.google.com/...)')
      .optional()
      .or(z.literal('')),
    allowOverlap: z.boolean().default(false),

    // Recurring Series Parameters
    isRecurring: z.boolean().default(false),
    recurrenceFrequency: recurrenceFrequencyEnum.optional().nullable(),
    recurrenceInterval: z
      .number()
      .int()
      .min(1, 'Interval must be at least 1')
      .default(1)
      .optional(),
    recurrenceDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    recurrenceEndDate: z.string().optional().or(z.literal('')),
    recurrenceCount: z
      .number()
      .int()
      .min(1, 'Minimum 1 occurrence')
      .max(52, 'Maximum 52 occurrences')
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid start date format',
        path: ['startDate'],
      });
    }

    if (isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid end date format',
        path: ['endDate'],
      });
    }

    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date and time must be after start date and time',
        path: ['endDate'],
      });
    }

    if (data.isRecurring) {
      if (!data.recurrenceFrequency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select recurrence frequency for recurring series',
          path: ['recurrenceFrequency'],
        });
      }

      if (data.recurrenceEndDate && data.recurrenceEndDate.trim() !== '') {
        const recEnd = new Date(data.recurrenceEndDate);
        if (!isNaN(recEnd.getTime()) && !isNaN(start.getTime()) && recEnd <= start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Series end date must be after first occurrence start date',
            path: ['recurrenceEndDate'],
          });
        }
      }
    }
  });

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Event title must be at least 3 characters')
      .max(255, 'Title cannot exceed 255 characters')
      .trim()
      .optional(),
    description: z.string().optional().or(z.literal('')),
    eventType: eventTypeEnum.optional(),
    courseId: z.string().optional().or(z.literal('')),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    venue: z
      .string()
      .min(1, 'Venue cannot be empty')
      .max(255, 'Venue cannot exceed 255 characters')
      .trim()
      .optional(),
    meetingLink: z
      .string()
      .url('Please enter a valid URL')
      .optional()
      .or(z.literal('')),
    allowOverlap: z.boolean().optional(),
    updateFutureInSeries: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date and time must be after start date and time',
          path: ['endDate'],
        });
      }
    }
  });

export type UpdateEventFormValues = z.infer<typeof updateEventSchema>;
