import { describe, it, expect } from 'vitest';
import {
  createNotificationSchema,
  updateNotificationSchema,
  directNotificationSchema,
  getNotificationPriorityMeta,
  getNotificationTypeMeta,
} from '@/lib/notification-validation';

describe('notification-validation schemas & helpers', () => {
  describe('createNotificationSchema', () => {
    it('validates a complete valid announcement payload', () => {
      const valid = {
        title: 'Midterm Room Shift',
        message: 'The Linear Algebra exam has been moved to Great Hall.',
        type: 'event',
        priority: 'urgent',
        courseId: 'MATH201',
      };

      const result = createNotificationSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Midterm Room Shift');
        expect(result.data.type).toBe('event');
        expect(result.data.priority).toBe('urgent');
      }
    });

    it('sets default type to announcement and priority to normal', () => {
      const minimal = {
        title: 'Welcome to Semester',
        message: 'Lectures commence tomorrow morning at 8:00 AM.',
      };

      const result = createNotificationSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('announcement');
        expect(result.data.priority).toBe('normal');
      }
    });

    it('rejects titles shorter than 3 characters', () => {
      const invalid = {
        title: 'Hi',
        message: 'Valid message body here.',
      };

      const result = createNotificationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('rejects messages shorter than 5 characters', () => {
      const invalid = {
        title: 'Valid Title',
        message: 'Fail',
      };

      const result = createNotificationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 5 characters');
      }
    });
  });

  describe('directNotificationSchema', () => {
    it('validates direct message to a student', () => {
      const valid = {
        studentId: '10982736',
        title: 'Missing Lab Submission',
        message: 'Please submit your Lab 3 report before 5 PM today.',
        messageType: 'in_app',
      };

      const result = directNotificationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects empty target studentId', () => {
      const invalid = {
        studentId: '',
        message: 'Reminder note here.',
      };

      const result = directNotificationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Target student is required');
      }
    });
  });

  describe('Metadata Helpers', () => {
    it('returns correct meta for urgent priority', () => {
      const meta = getNotificationPriorityMeta('urgent');
      expect(meta.label).toBe('Urgent');
      expect(meta.isUrgent).toBe(true);
      expect(meta.badgeClass).toContain('animate-pulse');
    });

    it('returns correct meta for assignment and attendance types', () => {
      const assignmentMeta = getNotificationTypeMeta('assignment');
      expect(assignmentMeta.label).toBe('Assignment');

      const attendanceMeta = getNotificationTypeMeta('attendance');
      expect(attendanceMeta.label).toBe('Attendance');
    });
  });
});
