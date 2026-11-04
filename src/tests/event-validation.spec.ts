import { describe, it, expect } from 'vitest';
import { createEventSchema, updateEventSchema } from '@/lib/event-validation';
import { generateEventIcs } from '@/lib/ics-export';
import type { Event } from '@/types';

describe('event-validation & ics-export', () => {
  describe('createEventSchema', () => {
    it('validates required fields and rejects title shorter than 3 characters', () => {
      const res = createEventSchema.safeParse({
        title: 'AB',
        venue: 'Room 101',
        startDate: '2026-11-10T10:00:00Z',
        endDate: '2026-11-10T11:00:00Z',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('title'))).toBe(true);
      }
    });

    it('rejects event if endDate is earlier than startDate', () => {
      const res = createEventSchema.safeParse({
        title: 'Mid-Semester Exam',
        venue: 'Great Hall',
        startDate: '2026-11-10T12:00:00Z',
        endDate: '2026-11-10T10:00:00Z', // 2 hours before start
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('endDate'))).toBe(true);
      }
    });

    it('requires recurrenceFrequency when isRecurring is true', () => {
      const res = createEventSchema.safeParse({
        title: 'Weekly Lecture',
        venue: 'Engineering Auditorium',
        startDate: '2026-11-10T08:00:00Z',
        endDate: '2026-11-10T10:00:00Z',
        isRecurring: true,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('recurrenceFrequency'))).toBe(true);
      }
    });

    it('accepts valid recurring event configuration', () => {
      const res = createEventSchema.safeParse({
        title: 'Weekly Embedded Systems Lecture',
        venue: 'LT-1',
        courseId: 'CPEN402',
        eventType: 'lecture',
        startDate: '2026-11-10T08:00:00Z',
        endDate: '2026-11-10T10:00:00Z',
        isRecurring: true,
        recurrenceFrequency: 'weekly',
        recurrenceInterval: 1,
        recurrenceDaysOfWeek: [2], // Tuesday
        recurrenceCount: 12,
      });
      expect(res.success).toBe(true);
    });

    it('validates meeting link is a valid URL', () => {
      const invalidRes = createEventSchema.safeParse({
        title: 'Online Cohort Sync',
        venue: 'Google Meet',
        startDate: '2026-11-10T08:00:00Z',
        endDate: '2026-11-10T09:00:00Z',
        meetingLink: 'not-a-valid-url',
      });
      expect(invalidRes.success).toBe(false);

      const validRes = createEventSchema.safeParse({
        title: 'Online Cohort Sync',
        venue: 'Google Meet',
        startDate: '2026-11-10T08:00:00Z',
        endDate: '2026-11-10T09:00:00Z',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
      });
      expect(validRes.success).toBe(true);
    });
  });

  describe('updateEventSchema', () => {
    it('validates date boundaries on update', () => {
      const invalid = updateEventSchema.safeParse({
        startDate: '2026-11-12T15:00:00Z',
        endDate: '2026-11-12T14:00:00Z',
      });
      expect(invalid.success).toBe(false);

      const valid = updateEventSchema.safeParse({
        title: 'Updated Lecture Hall',
        venue: 'Engineering Annex Room 4',
      });
      expect(valid.success).toBe(true);
    });
  });

  describe('generateEventIcs', () => {
    const mockEvent: Event = {
      id: 'event-uuid-1',
      title: 'CPEN402 Final Exam',
      description: 'Comprehensive exam covering embedded architectures',
      eventType: 'exam',
      courseId: 'CPEN402',
      course: { id: 'CPEN402', name: 'Embedded Systems' },
      startDate: '2026-12-15T09:00:00.000Z',
      endDate: '2026-12-15T12:00:00.000Z',
      venue: 'Great Hall Examination Center',
      meetingLink: 'https://exam.university.edu',
      isCancelled: false,
      isRecurring: false,
      recurrenceFrequency: null,
      recurrenceInterval: 1,
      recurrenceDaysOfWeek: null,
      recurrenceEndDate: null,
      recurrenceCount: null,
      recurrenceSeriesId: null,
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    };

    it('generates compliant RFC 5545 iCalendar content', () => {
      const ics = generateEventIcs(mockEvent);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:[CPEN402] CPEN402 Final Exam');
      expect(ics).toContain('LOCATION:Great Hall Examination Center');
      expect(ics).toContain('DTSTART:20261215T090000Z');
      expect(ics).toContain('DTEND:20261215T120000Z');
      expect(ics).toContain('URL:https://exam.university.edu');
      expect(ics).toContain('STATUS:CONFIRMED');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('marks status as CANCELLED when event is cancelled', () => {
      const cancelled = { ...mockEvent, isCancelled: true };
      const ics = generateEventIcs(cancelled);
      expect(ics).toContain('STATUS:CANCELLED');
    });
  });
});

