import { z } from 'zod';
import type { BullJobCounts, QueueMeta } from '@/types/queue.types';

export const sendTestEmailSchema = z.object({
  to: z
    .string()
    .trim()
    .email('Please enter a valid recipient email')
    .optional()
    .or(z.literal('')),
});

export const sendTestSmsSchema = z.object({
  to: z
    .string()
    .trim()
    .min(10, 'Recipient phone number must be at least 10 digits')
    .max(15, 'Recipient phone number too long')
    .regex(/^[0-9+\s()-]+$/, 'Invalid phone number format'),
  message: z
    .string()
    .trim()
    .max(160, 'Test SMS must not exceed 160 characters')
    .optional(),
});

export const QUEUE_REGISTRY: Record<string, QueueMeta> = {
  email: {
    key: 'email',
    name: 'Student Notification Email Queue',
    description: 'Nodemailer/SMTP worker dispatching security alerts, password OTPs, and announcements.',
    iconName: 'Mail',
  },
  sms: {
    key: 'sms',
    name: 'Arkesel Carrier SMS Queue',
    description: 'Carrier-grade SMS dispatch pipeline via Arkesel V1/V2 gateway for instant student SMS alerts.',
    iconName: 'MessageSquare',
  },
  'drive-sync': {
    key: 'drive-sync',
    name: 'Google Drive Sync Queue',
    description: 'Asynchronous streaming worker for lecture slide uploads, video syncing, and Drive file deletion.',
    iconName: 'HardDrive',
  },
  attendance: {
    key: 'attendance',
    name: 'Attendance Batch Roster Queue',
    description: 'Heavy batch initialization worker preparing lecture hall attendance records for active cohorts.',
    iconName: 'QrCode',
  },
};

export type QueueHealthState = 'healthy' | 'active' | 'attention' | 'idle';

export interface QueueHealthMeta {
  state: QueueHealthState;
  label: string;
  badgeClass: string;
  dotClass: string;
}

export function calculateQueueHealth(counts?: BullJobCounts): QueueHealthState {
  if (!counts) return 'idle';
  if (counts.failed > 0) return 'attention';
  if (counts.active > 0) return 'active';
  if (counts.waiting > 0 || counts.delayed > 0) return 'active';
  if (counts.completed > 0) return 'healthy';
  return 'idle';
}

export function getQueueHealthMeta(state: QueueHealthState): QueueHealthMeta {
  switch (state) {
    case 'attention':
      return {
        state: 'attention',
        label: 'Failed Jobs',
        badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
        dotClass: 'bg-rose-600',
      };
    case 'active':
      return {
        state: 'active',
        label: 'Processing',
        badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        dotClass: 'bg-amber-500 animate-pulse',
      };
    case 'healthy':
      return {
        state: 'healthy',
        label: 'Operational',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        dotClass: 'bg-emerald-600',
      };
    case 'idle':
    default:
      return {
        state: 'idle',
        label: 'Idle / Standby',
        badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
        dotClass: 'bg-slate-400',
      };
  }
}

