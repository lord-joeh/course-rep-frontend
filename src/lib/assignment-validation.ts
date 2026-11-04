import { z } from 'zod';

export const createAssignmentSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Assignment title is required' })
    .max(255, { message: 'Title must not exceed 255 characters' })
    .transform((val) => val.trim()),
  description: z
    .string()
    .min(1, { message: 'Assignment description is required' })
    .transform((val) => val.trim()),
  courseId: z
    .string()
    .min(1, { message: 'Course selection is required' })
    .transform((val) => val.trim().toUpperCase()),
  deadline: z
    .string()
    .min(1, { message: 'Deadline is required' })
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date.getTime() > Date.now();
    }, { message: 'Deadline must be a valid future date and time' }),
});

export type CreateAssignmentFormValues = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title must not be empty' })
    .max(255, { message: 'Title must not exceed 255 characters' })
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  description: z
    .string()
    .min(1, { message: 'Description must not be empty' })
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  deadline: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && date.getTime() > Date.now();
    }, { message: 'Deadline must be a valid future date and time' })
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export type UpdateAssignmentFormValues = z.infer<typeof updateAssignmentSchema>;

export function isPastDeadline(deadline: string | Date): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  return !isNaN(d.getTime()) && d.getTime() <= Date.now();
}

export function formatDeadlineRemaining(deadline: string | Date): string {
  if (!deadline) return 'No deadline';
  const target = new Date(deadline).getTime();
  if (isNaN(target)) return 'Invalid date';

  const diffMs = target - Date.now();
  if (diffMs <= 0) {
    return 'Deadline Passed';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    return `Due in ${diffDays} days`;
  }
  if (diffDays === 1) {
    return 'Due tomorrow';
  }
  if (diffHours >= 1) {
    return `Due in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  }
  return `Due in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
}

export interface DeadlineStatusMeta {
  label: string;
  isPast: boolean;
  colorClass: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function getDeadlineStatusMeta(
  deadline: string | Date,
  hasSubmitted = false,
): DeadlineStatusMeta {
  const isPast = isPastDeadline(deadline);

  if (hasSubmitted) {
    return {
      label: 'Submitted',
      isPast,
      colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeVariant: 'outline',
    };
  }

  if (isPast) {
    return {
      label: 'Closed / Past Due',
      isPast: true,
      colorClass: 'bg-destructive/10 text-destructive border-destructive/20',
      badgeVariant: 'destructive',
    };
  }

  const diffMs = new Date(deadline).getTime() - Date.now();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 24) {
    return {
      label: 'Due Soon',
      isPast: false,
      colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badgeVariant: 'outline',
    };
  }

  return {
    label: 'Open',
    isPast: false,
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    badgeVariant: 'outline',
  };
}

