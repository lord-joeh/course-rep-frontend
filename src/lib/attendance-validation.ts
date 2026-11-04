import { z } from 'zod';
import type { AttendanceInstance } from '@/types';

export function isSessionActive(session: AttendanceInstance | null | undefined): boolean {
  if (!session || session.isClose) return false;
  if (session.expiresAt && new Date() > new Date(session.expiresAt)) return false;
  return true;
}

export const initializeAttendanceSchema = z
  .object({
    courseId: z
      .string()
      .min(1, 'Please select a course')
      .trim(),
    date: z
      .string()
      .min(1, 'Session date and time is required'),
    classType: z.enum(['in-person', 'online']),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    durationMinutes: z
      .number()
      .int('Duration must be an integer')
      .min(5, 'Minimum duration is 5 minutes')
      .max(240, 'Maximum duration is 240 minutes')
      .default(60),
  })
  .superRefine((data, ctx) => {
    if (data.classType === 'in-person') {
      if (data.latitude === undefined || data.latitude === null || isNaN(data.latitude)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location coordinates (latitude) are required for in-person attendance',
          path: ['latitude'],
        });
      } else if (data.latitude < -90 || data.latitude > 90) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Latitude must be between -90 and 90 degrees',
          path: ['latitude'],
        });
      }

      if (data.longitude === undefined || data.longitude === null || isNaN(data.longitude)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location coordinates (longitude) are required for in-person attendance',
          path: ['longitude'],
        });
      } else if (data.longitude < -180 || data.longitude > 180) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Longitude must be between -180 and 180 degrees',
          path: ['longitude'],
        });
      }
    }
  });

export type InitializeAttendanceFormValues = z.infer<typeof initializeAttendanceSchema>;

/**
 * Promise-based HTML5 Geolocation API wrapper with timeout and high accuracy.
 */
export async function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your current browser environment.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access denied. Please grant location permissions in browser settings.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Please verify GPS or network location is turned on.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please retry.'));
            break;
          default:
            reject(new Error(`Location error: ${error.message || 'Unknown error'}`));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      },
    );
  });
}

/**
 * Spherical surface distance in meters using Haversine formula.
 * Matches Backend V2's calculation logic.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's mean radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
