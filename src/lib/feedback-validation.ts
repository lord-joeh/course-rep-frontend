import { z } from 'zod';
import type { FeedbackCategory, FeedbackPriority, FeedbackStatus } from '@/types';
import {
  GraduationCap,
  Building2,
  UserCheck,
  HeartHandshake,
  MessageSquare,
  HelpCircle,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export const feedbackCategoryEnum = z.enum([
  'academic',
  'facilities',
  'lecturer',
  'welfare',
  'general',
  'other',
]);

export const feedbackPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const feedbackStatusEnum = z.enum([
  'submitted',
  'under_review',
  'resolved',
  'dismissed',
]);

export const createFeedbackSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters long')
    .max(255, 'Title must not exceed 255 characters'),
  content: z.string().min(5, 'Feedback content must be at least 5 characters long'),
  category: feedbackCategoryEnum.default('general'),
  courseId: z.string().optional().nullable(),
  isAnonymous: z.boolean().default(false),
  priority: feedbackPriorityEnum.default('medium'),
});

export const updateFeedbackStatusSchema = z.object({
  status: feedbackStatusEnum,
  repResponse: z.string().optional().nullable(),
});

export type CreateFeedbackFormValues = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackStatusFormValues = z.infer<typeof updateFeedbackStatusSchema>;

export interface StatusMeta {
  label: string;
  badgeClass: string;
  icon: LucideIcon;
  description: string;
}

export function getFeedbackStatusMeta(status: FeedbackStatus): StatusMeta {
  switch (status) {
    case 'submitted':
      return {
        label: 'Submitted',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: Clock,
        description: 'New submission awaiting review from a Course Rep',
      };
    case 'under_review':
      return {
        label: 'Under Review',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: Search,
        description: 'Course Rep is investigating or actively addressing this issue',
      };
    case 'resolved':
      return {
        label: 'Resolved',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: CheckCircle2,
        description: 'Addressed and completed with rep feedback',
      };
    case 'dismissed':
      return {
        label: 'Dismissed',
        badgeClass: 'bg-muted text-muted-foreground border-border',
        icon: XCircle,
        description: 'Closed without further action',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-muted text-muted-foreground border-border',
        icon: Clock,
        description: '',
      };
  }
}

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
}

export function getFeedbackCategoryMeta(category: FeedbackCategory): CategoryMeta {
  switch (category) {
    case 'academic':
      return {
        label: 'Academic',
        icon: GraduationCap,
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      };
    case 'facilities':
      return {
        label: 'Facilities',
        icon: Building2,
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      };
    case 'lecturer':
      return {
        label: 'Lecturer',
        icon: UserCheck,
        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      };
    case 'welfare':
      return {
        label: 'Student Welfare',
        icon: HeartHandshake,
        badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      };
    case 'general':
      return {
        label: 'General Suggestion',
        icon: MessageSquare,
        badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
      };
    case 'other':
      return {
        label: 'Other',
        icon: HelpCircle,
        badgeClass: 'bg-muted text-muted-foreground border-border',
      };
    default:
      return {
        label: category,
        icon: HelpCircle,
        badgeClass: 'bg-muted text-muted-foreground border-border',
      };
  }
}

export interface PriorityMeta {
  label: string;
  badgeClass: string;
}

export function getFeedbackPriorityMeta(priority: FeedbackPriority): PriorityMeta {
  switch (priority) {
    case 'urgent':
      return {
        label: 'Urgent',
        badgeClass: 'bg-destructive/10 text-destructive border-destructive/20 font-semibold',
      };
    case 'high':
      return {
        label: 'High',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium',
      };
    case 'medium':
      return {
        label: 'Medium',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      };
    case 'low':
      return {
        label: 'Low',
        badgeClass: 'bg-muted text-muted-foreground border-border',
      };
    default:
      return {
        label: priority,
        badgeClass: 'bg-muted text-muted-foreground border-border',
      };
  }
}

