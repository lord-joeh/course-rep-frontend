import { z } from 'zod';
import type { NotificationType, NotificationPriority } from '@/types';
import {
  Megaphone,
  ClipboardList,
  QrCode,
  Calendar,
  MessageSquare,
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Flame,
} from 'lucide-react';

export const notificationTypeEnum = z.enum([
  'announcement',
  'assignment',
  'attendance',
  'event',
  'feedback',
  'system',
]);

export const notificationPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

export const createNotificationSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title cannot exceed 255 characters')
    .trim(),
  message: z
    .string()
    .min(5, 'Announcement message must be at least 5 characters')
    .trim(),
  type: notificationTypeEnum.default('announcement'),
  priority: notificationPriorityEnum.default('normal'),
  courseId: z.string().optional().or(z.literal('')),
});

export const updateNotificationSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title cannot exceed 255 characters')
    .trim()
    .optional(),
  message: z
    .string()
    .min(5, 'Announcement message must be at least 5 characters')
    .trim()
    .optional(),
  type: notificationTypeEnum.optional(),
  priority: notificationPriorityEnum.optional(),
  courseId: z.string().optional().or(z.literal('')),
});

export const directNotificationSchema = z.object({
  studentId: z.string().min(1, 'Target student is required').trim(),
  title: z
    .string()
    .max(255, 'Title cannot exceed 255 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  message: z.string().min(3, 'Message must be at least 3 characters').trim(),
  messageType: z.enum(['in_app', 'email', 'sms']).default('in_app'),
});

export interface NotificationPriorityMeta {
  label: string;
  badgeClass: string;
  icon: any;
  isUrgent?: boolean;
}

export function getNotificationPriorityMeta(
  priority: NotificationPriority = 'normal',
): NotificationPriorityMeta {
  switch (priority) {
    case 'urgent':
      return {
        label: 'Urgent',
        badgeClass: 'bg-destructive/15 text-destructive border-destructive/30 font-bold animate-pulse',
        icon: Flame,
        isUrgent: true,
      };
    case 'high':
      return {
        label: 'High Priority',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold',
        icon: AlertTriangle,
      };
    case 'low':
      return {
        label: 'Low',
        badgeClass: 'bg-muted text-muted-foreground border-border',
        icon: Info,
      };
    case 'normal':
    default:
      return {
        label: 'Normal',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: AlertCircle,
      };
  }
}

export interface NotificationTypeMeta {
  label: string;
  badgeClass: string;
  icon: any;
}

export function getNotificationTypeMeta(
  type: NotificationType = 'announcement',
): NotificationTypeMeta {
  switch (type) {
    case 'assignment':
      return {
        label: 'Assignment',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: ClipboardList,
      };
    case 'attendance':
      return {
        label: 'Attendance',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: QrCode,
      };
    case 'event':
      return {
        label: 'Event',
        badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        icon: Calendar,
      };
    case 'feedback':
      return {
        label: 'Feedback',
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        icon: MessageSquare,
      };
    case 'system':
      return {
        label: 'System',
        badgeClass: 'bg-muted text-muted-foreground border-border',
        icon: Bell,
      };
    case 'announcement':
    default:
      return {
        label: 'Announcement',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: Megaphone,
      };
  }
}

