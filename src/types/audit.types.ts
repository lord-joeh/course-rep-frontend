import type { PaginatedResult } from './api.types';

export type AuditSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AuditResource =
  | 'AUTH'
  | 'ATTENDANCE'
  | 'STUDENT'
  | 'COURSE'
  | 'DRIVE'
  | 'GROUP'
  | 'FEEDBACK'
  | 'NOTIFICATION'
  | 'SYSTEM';

export type AuditActionType =
  // Authentication & Session
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'PASSWORD_CHANGE'
  // Attendance
  | 'ATTENDANCE_INITIALIZED'
  | 'ATTENDANCE_MARKED'
  | 'ATTENDANCE_GEOFENCE_BREACH'
  | 'ATTENDANCE_MANUAL_OVERRIDE'
  | 'ATTENDANCE_SESSION_CLOSED'
  // Course & Roster Management
  | 'STUDENT_CREATED'
  | 'STUDENT_UPDATED'
  | 'STUDENT_DELETED'
  | 'COURSE_CREATED'
  | 'COURSE_DELETED'
  | 'GROUP_DIVIDED'
  // Drive & File Sync
  | 'DRIVE_FILE_UPLOADED'
  | 'DRIVE_FILE_DELETED'
  // Security & Defenses
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTEGRITY_VERIFICATION'
  | 'SYSTEM_ALERT';

export interface SecurityAuditLog {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  actorId: string | null;
  actorRole: string;
  actorEmail: string | null;
  action: string;
  severity: AuditSeverity;
  resource: string;
  resourceId: string | null;
  ipAddress: string;
  userAgent: string | null;
  details: Record<string, any>;
  previousHash: string;
  currentHash: string;
}

export interface AuditDashboardStats {
  totalLogs: number;
  severityCounts: Record<AuditSeverity, number>;
  failedLoginsLast24h: number;
  geofenceBreachesLast24h: number;
  recentHighSeverityCount: number;
}

export interface AuditIntegrityReport {
  isIntact: boolean;
  totalVerified: number;
  unbrokenChainLength: number;
  genesisHashValid: boolean;
  verifiedAt: string;
  errors: string[];
}

export interface AuditLogsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  severity?: AuditSeverity;
  resource?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

export type PaginatedAuditLogs = PaginatedResult<SecurityAuditLog>;

