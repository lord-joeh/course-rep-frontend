import { z } from 'zod';

export const createGroupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Group name must be at least 2 characters')
      .max(255, 'Group name cannot exceed 255 characters')
      .trim(),
    description: z
      .string()
      .max(255, 'Description cannot exceed 255 characters')
      .optional()
      .or(z.literal('')),
    isGeneral: z.boolean().default(false),
    courseId: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (!data.isGeneral && (!data.courseId || data.courseId.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a course for course-specific study group',
        path: ['courseId'],
      });
    }
  });

export type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(255, 'Group name cannot exceed 255 characters')
    .trim(),
  description: z
    .string()
    .max(255, 'Description cannot exceed 255 characters')
    .optional()
    .or(z.literal('')),
  courseId: z.string().optional().or(z.literal('')),
});

export type UpdateGroupFormValues = z.infer<typeof updateGroupSchema>;

export const autoDivideGroupsSchema = z
  .object({
    isGeneral: z.boolean().default(false),
    courseId: z.string().optional().or(z.literal('')),
    partitionMode: z.enum(['bySize', 'byCount']).default('bySize'),
    studentsPerGroup: z
      .number()
      .int('Must be an integer')
      .min(2, 'Minimum 2 students per group')
      .max(100, 'Maximum 100 students per group')
      .optional()
      .nullable(),
    numberOfGroups: z
      .number()
      .int('Must be an integer')
      .min(2, 'Minimum 2 groups')
      .max(100, 'Maximum 100 groups')
      .optional()
      .nullable(),
    namingPrefix: z
      .string()
      .max(50, 'Prefix cannot exceed 50 characters')
      .default('Group')
      .optional(),
    autoAssignLeader: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (!data.isGeneral && (!data.courseId || data.courseId.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a course to partition enrolled students',
        path: ['courseId'],
      });
    }

    if (data.partitionMode === 'bySize') {
      if (!data.studentsPerGroup || data.studentsPerGroup < 2 || data.studentsPerGroup > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Students per group must be between 2 and 100',
          path: ['studentsPerGroup'],
        });
      }
    } else if (data.partitionMode === 'byCount') {
      if (!data.numberOfGroups || data.numberOfGroups < 2 || data.numberOfGroups > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Total number of groups must be between 2 and 100',
          path: ['numberOfGroups'],
        });
      }
    }
  });

export type AutoDivideGroupsFormValues = z.infer<typeof autoDivideGroupsSchema>;

export const addGroupMemberSchema = z.object({
  studentId: z.string().min(1, 'Please select or enter student ID').trim(),
  isLeader: z.boolean().default(false),
});

export type AddGroupMemberFormValues = z.infer<typeof addGroupMemberSchema>;

