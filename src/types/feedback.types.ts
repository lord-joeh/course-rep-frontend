import type { PaginatedResult } from './api.types';

export type FeedbackCategory =
  | 'academic'
  | 'facilities'
  | 'lecturer'
  | 'welfare'
  | 'general'
  | 'other';

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'urgent';

export type FeedbackStatus = 'submitted' | 'under_review' | 'resolved' | 'dismissed';

export interface FeedbackAuthor {
  id?: string;
  name: string;
  email?: string;
}

export interface FeedbackCourse {
  id: string;
  name: string;
}

export interface Feedback {
  id: string;
  studentId: string | null;
  student: FeedbackAuthor | null;
  courseId: string | null;
  course: FeedbackCourse | null;
  category: FeedbackCategory;
  title: string;
  content: string;
  isAnonymous: boolean;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  repResponse: string | null;
  respondedAt: string | null;
  respondedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackDto {
  title: string;
  content: string;
  category?: FeedbackCategory;
  courseId?: string | null;
  isAnonymous?: boolean;
  priority?: FeedbackPriority;
}

export interface UpdateFeedbackStatusDto {
  status: FeedbackStatus;
  repResponse?: string;
}

export interface FeedbackQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  priority?: FeedbackPriority;
  courseId?: string;
  isAnonymous?: boolean;
}

export type PaginatedFeedbacks = PaginatedResult<Feedback>;

