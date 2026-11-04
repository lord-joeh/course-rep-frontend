import type { Course } from './course.types';
import type { Student } from './student.types';
import type { PaginatedResult } from './api.types';

export type ClassType = 'in-person' | 'online';

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface AttendanceInstance {
  id: string;
  courseId: string;
  date: string;
  qrToken: string | null;
  qrImage: string | null;
  expiresAt: string;
  latitude: number | null;
  longitude: number | null;
  classType: ClassType;
  isClose: boolean;
  createdAt: string;
  updatedAt: string;
  course?: Course;
}

export interface AttendanceRecord {
  id: string;
  instanceId: string;
  courseId: string;
  date: string;
  studentId: string;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  course?: Course;
  instance?: AttendanceInstance;
}

export interface AttendanceStats {
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
}

export interface AttendanceDetailResponse {
  instance: AttendanceInstance;
  stats: AttendanceStats;
  attendees: PaginatedResult<AttendanceRecord>;
}

export interface InitializeAttendanceDto {
  courseId: string;
  date: string;
  classType: ClassType;
  latitude?: number;
  longitude?: number;
  durationMinutes?: number;
}

export interface MarkAttendanceDto {
  token: string;
  latitude?: number;
  longitude?: number;
}

export interface MarkAttendanceResponse {
  success: boolean;
  message: string;
  attendance: AttendanceRecord;
  presentCount: number;
}

export interface ManualMarkAttendeeDto {
  attendanceId: string;
  status: AttendanceStatus;
}

export interface QRRotatePayload {
  instanceId: string;
  qrImage: string;
  token: string;
  expiresInSeconds: number;
  rotatedAt: string;
}

export interface AttendeeMarkedPayload {
  instanceId: string;
  studentId: string;
  studentName?: string;
  markedAt: string;
  presentCount: number;
}

export interface SessionClosedPayload {
  instanceId: string;
  message: string;
}

export interface AttendanceInstanceFilterParams {
  courseId?: string;
  date?: string;
  classType?: ClassType;
  page?: number;
  limit?: number;
}

export interface AttendanceRecordFilterParams {
  studentId?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

