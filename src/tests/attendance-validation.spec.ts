import { describe, it, expect } from 'vitest';
import {
  initializeAttendanceSchema,
  calculateHaversineDistance,
  isSessionActive,
} from '@/lib/attendance-validation';
import type { AttendanceInstance } from '@/types';

describe('attendance-validation', () => {
  describe('isSessionActive', () => {
    it('returns false for null or undefined session', () => {
      expect(isSessionActive(null)).toBe(false);
      expect(isSessionActive(undefined)).toBe(false);
    });

    it('returns false if session is marked as isClose = true', () => {
      const session: AttendanceInstance = {
        id: 'session-1',
        courseId: 'CPEN402',
        date: new Date().toISOString(),
        qrToken: 'token',
        qrImage: 'img',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        latitude: 5.6037,
        longitude: -0.1870,
        classType: 'in-person',
        isClose: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(isSessionActive(session)).toBe(false);
    });

    it('returns false if session expiresAt is in the past', () => {
      const session: AttendanceInstance = {
        id: 'session-1',
        courseId: 'CPEN402',
        date: new Date(Date.now() - 7200000).toISOString(),
        qrToken: 'token',
        qrImage: 'img',
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
        latitude: 5.6037,
        longitude: -0.1870,
        classType: 'in-person',
        isClose: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      };
      expect(isSessionActive(session)).toBe(false);
    });

    it('returns true if session is not closed and expiresAt is in the future', () => {
      const session: AttendanceInstance = {
        id: 'session-1',
        courseId: 'CPEN402',
        date: new Date().toISOString(),
        qrToken: 'token',
        qrImage: 'img',
        expiresAt: new Date(Date.now() + 1800000).toISOString(), // 30 mins in future
        latitude: 5.6037,
        longitude: -0.1870,
        classType: 'in-person',
        isClose: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(isSessionActive(session)).toBe(true);
    });
  });

  describe('calculateHaversineDistance', () => {
    it('calculates spherical surface distance in meters accurately', () => {
      // Coordinates on UG Campus ~ 100 meters apart
      const dist = calculateHaversineDistance(5.6505, -0.1870, 5.6514, -0.1870);
      expect(dist).toBeGreaterThan(90);
      expect(dist).toBeLessThan(110);
    });

    it('returns 0 for identical coordinates', () => {
      const dist = calculateHaversineDistance(5.6037, -0.1870, 5.6037, -0.1870);
      expect(dist).toBe(0);
    });
  });

  describe('initializeAttendanceSchema', () => {
    it('validates in-person attendance requires coordinates', () => {
      const result = initializeAttendanceSchema.safeParse({
        courseId: 'CPEN402',
        date: '2026-11-04T10:00:00Z',
        classType: 'in-person',
        durationMinutes: 60,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('latitude'))).toBe(true);
        expect(result.error.issues.some((i) => i.path.includes('longitude'))).toBe(true);
      }
    });

    it('validates online attendance without coordinates succeeds', () => {
      const result = initializeAttendanceSchema.safeParse({
        courseId: 'CPEN402',
        date: '2026-11-04T10:00:00Z',
        classType: 'online',
        durationMinutes: 45,
      });
      expect(result.success).toBe(true);
    });
  });
});

