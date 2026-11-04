import { describe, it, expect } from 'vitest';
import {
  auditSeveritySchema,
  auditResourceSchema,
  auditQuerySchema,
  getAuditSeverityMeta,
  formatAuditAction,
  getActionCategory,
  shortenHash,
  isValidSha256,
} from '@/lib/audit-validation';

describe('Audit Validation & Metadata Helpers', () => {
  it('validates audit severities correctly', () => {
    expect(auditSeveritySchema.safeParse('CRITICAL').success).toBe(true);
    expect(auditSeveritySchema.safeParse('INFO').success).toBe(true);
    expect(auditSeveritySchema.safeParse('INVALID').success).toBe(false);
  });

  it('validates audit resources correctly', () => {
    expect(auditResourceSchema.safeParse('ATTENDANCE').success).toBe(true);
    expect(auditResourceSchema.safeParse('AUTH').success).toBe(true);
    expect(auditResourceSchema.safeParse('UNKNOWN').success).toBe(false);
  });

  it('validates and applies defaults for auditQuerySchema', () => {
    const parsed = auditQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);

    const custom = auditQuerySchema.parse({
      page: 2,
      limit: 50,
      severity: 'HIGH',
      resource: 'ATTENDANCE',
      search: 'breach',
    });
    expect(custom.page).toBe(2);
    expect(custom.limit).toBe(50);
    expect(custom.severity).toBe('HIGH');
  });

  it('provides consistent design system color tokens for all severities', () => {
    const critical = getAuditSeverityMeta('CRITICAL');
    expect(critical.label).toBe('Critical');
    expect(critical.badgeClass).toContain('rose');

    const high = getAuditSeverityMeta('HIGH');
    expect(high.label).toBe('High');
    expect(high.badgeClass).toContain('amber');

    const medium = getAuditSeverityMeta('MEDIUM');
    expect(medium.label).toBe('Medium');
    expect(medium.badgeClass).toContain('sky');

    const low = getAuditSeverityMeta('LOW');
    expect(low.label).toBe('Low');
    expect(low.badgeClass).toContain('slate');

    const info = getAuditSeverityMeta('INFO');
    expect(info.label).toBe('Info');
    expect(info.badgeClass).toContain('emerald');
  });

  it('formats raw snake_case audit actions to human-readable labels', () => {
    expect(formatAuditAction('ATTENDANCE_GEOFENCE_BREACH')).toBe('Attendance Geofence Breach');
    expect(formatAuditAction('LOGIN_SUCCESS')).toBe('Login Success');
    expect(formatAuditAction('RATE_LIMIT_EXCEEDED')).toBe('Rate Limit Exceeded');
  });

  it('categorizes audit actions into security domains', () => {
    expect(getActionCategory('LOGIN_FAILURE')).toBe('Authentication');
    expect(getActionCategory('ATTENDANCE_MARKED')).toBe('Attendance');
    expect(getActionCategory('STUDENT_UPDATED')).toBe('Roster & Curriculum');
    expect(getActionCategory('DRIVE_FILE_UPLOADED')).toBe('Cloud Storage');
    expect(getActionCategory('INTEGRITY_VERIFICATION')).toBe('Security & Defenses');
    expect(getActionCategory('CUSTOM_OTHER')).toBe('System Event');
  });

  it('shortens 64-char hashes with custom head and tail characters', () => {
    const sha = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const shortened = shortenHash(sha, 8, 8);
    expect(shortened).toBe('e3b0c442…7852b855');
  });

  it('validates 64-character SHA-256 hex strings correctly', () => {
    const validSha = '0'.repeat(64);
    expect(isValidSha256(validSha)).toBe(true);
    expect(isValidSha256('invalid-hash')).toBe(false);
    expect(isValidSha256('0'.repeat(63))).toBe(false);
    expect(isValidSha256('g'.repeat(64))).toBe(false); // non-hex
  });
});

