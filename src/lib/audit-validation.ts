import { z } from 'zod';
import type { AuditSeverity } from '@/types/audit.types';

export const auditSeveritySchema = z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const auditResourceSchema = z.enum([
  'AUTH',
  'ATTENDANCE',
  'STUDENT',
  'COURSE',
  'DRIVE',
  'GROUP',
  'FEEDBACK',
  'NOTIFICATION',
  'SYSTEM',
]);

export const auditQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  action: z.string().optional(),
  severity: auditSeveritySchema.optional(),
  resource: z.string().optional(),
  actorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export interface SeverityMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
  borderClass: string;
  bgLightClass: string;
}

export function getAuditSeverityMeta(severity: AuditSeverity | string): SeverityMeta {
  const norm = (severity || 'INFO').toUpperCase();
  switch (norm) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
        dotClass: 'bg-rose-600',
        borderClass: 'border-rose-500/30',
        bgLightClass: 'bg-rose-50 dark:bg-rose-950/20',
      };
    case 'HIGH':
      return {
        label: 'High',
        badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        dotClass: 'bg-amber-600',
        borderClass: 'border-amber-500/30',
        bgLightClass: 'bg-amber-50 dark:bg-amber-950/20',
      };
    case 'MEDIUM':
      return {
        label: 'Medium',
        badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
        dotClass: 'bg-sky-600',
        borderClass: 'border-sky-500/30',
        bgLightClass: 'bg-sky-50 dark:bg-sky-950/20',
      };
    case 'LOW':
      return {
        label: 'Low',
        badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
        dotClass: 'bg-slate-500',
        borderClass: 'border-slate-500/30',
        bgLightClass: 'bg-slate-50 dark:bg-slate-900/30',
      };
    case 'INFO':
    default:
      return {
        label: 'Info',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        dotClass: 'bg-emerald-600',
        borderClass: 'border-emerald-500/30',
        bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/20',
      };
  }
}

export function formatAuditAction(action: string): string {
  if (!action) return 'Unknown Action';
  return action
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getActionCategory(action: string): string {
  const norm = action.toUpperCase();
  if (norm.startsWith('LOGIN') || norm.startsWith('LOGOUT') || norm.includes('PASSWORD')) {
    return 'Authentication';
  }
  if (norm.startsWith('ATTENDANCE')) {
    return 'Attendance';
  }
  if (norm.startsWith('STUDENT') || norm.startsWith('COURSE') || norm.startsWith('GROUP')) {
    return 'Roster & Curriculum';
  }
  if (norm.startsWith('DRIVE')) {
    return 'Cloud Storage';
  }
  if (norm.includes('RATE_LIMIT') || norm.includes('INTEGRITY') || norm.includes('ALERT')) {
    return 'Security & Defenses';
  }
  return 'System Event';
}

export function shortenHash(hash: string, head = 8, tail = 8): string {
  if (!hash || hash.length <= head + tail) return hash || '';
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function isValidSha256(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false;
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

