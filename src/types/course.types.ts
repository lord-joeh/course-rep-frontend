import type { Lecturer } from './lecturer.types';
import type { Student } from './student.types';

export interface Course {
  id: string; // e.g., "CPEN401"
  name: string;
  lecturerId?: string | null;
  lecturer?: Lecturer | null;
  day?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  semester: string;
  slidesFolderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  id: string;
  name: string;
  lecturerId?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  semester: string;
  slidesFolderId?: string;
}

export interface UpdateCourseDto {
  name?: string;
  lecturerId?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  semester?: string;
  slidesFolderId?: string;
}

export interface CourseQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  semester?: string;
  day?: string;
  lecturerId?: string;
}

export type CourseRosterStudent = Student;

