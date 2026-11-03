import type { PaginationQuery } from './api.types';
import type { StudentStatus } from './auth.types';

export interface Student {
  id: string; // e.g. "10928374"
  name: string;
  email: string;
  phone?: string;
  isRep: boolean;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentQueryDto extends PaginationQuery {
  status?: StudentStatus;
  isRep?: boolean;
}

export interface RepUpdateStudentDto {
  name?: string;
  email?: string;
  phone?: string;
  status?: StudentStatus;
  isRep?: boolean;
}

