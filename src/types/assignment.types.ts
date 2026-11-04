import type { Course } from './course.types';
import type { PaginatedResult } from './api.types';

export interface Assignment {
  id: string; // UUID
  title: string;
  description: string;
  courseId: string;
  deadline: string; // ISO 8601 string
  submissionFolderId: string | null;
  fileId: string | null;
  fileName: string | null;
  createdAt: string;
  updatedAt: string;
  course?: Course;

  // Decorated metadata from GET /assignments
  submissionCount?: number;
  hasSubmitted?: boolean;
  studentSubmission?: {
    id: string;
    submittedAt: string;
    fileName: string | null;
  } | null;
}

export interface AssignmentSubmission {
  id: string; // UUID
  assignmentId: string;
  studentId: string;
  fileId: string | null;
  fileName: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  assignment?: Assignment;
}

export interface SubmissionItemDetail {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  fileId: string | null;
  fileName: string | null;
  submittedAt: string;
}

export interface AssignmentDetailResponse {
  assignment: Assignment;
  submissions?: PaginatedResult<SubmissionItemDetail>; // Present for Reps
  submission?: AssignmentSubmission | null; // Present for Students
}

export interface CreateAssignmentDto {
  title: string;
  description: string;
  courseId: string;
  deadline: string;
  file?: File;
}

export interface UpdateAssignmentDto {
  title?: string;
  description?: string;
  deadline?: string;
}

export interface SubmitAssignmentDto {
  assignmentId: string;
  file: File;
}

export interface AssignmentQueryDto {
  courseId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export type AssignmentFilterStatus = 'all' | 'active' | 'submitted' | 'past';

