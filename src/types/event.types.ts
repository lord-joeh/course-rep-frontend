import type { PaginatedResult } from './api.types';

export type EventType =
  | 'lecture'
  | 'tutorial'
  | 'exam'
  | 'deadline'
  | 'meeting'
  | 'seminar'
  | 'other';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  eventType: EventType;
  courseId: string | null;
  course?: { id: string; name: string } | null;
  startDate: string;
  endDate: string;
  venue: string;
  meetingLink: string | null;
  isCancelled: boolean;
  isRecurring: boolean;
  recurrenceFrequency: RecurrenceFrequency | null;
  recurrenceInterval: number;
  recurrenceDaysOfWeek: number[] | null;
  recurrenceEndDate: string | null;
  recurrenceCount: number | null;
  recurrenceSeriesId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  eventType?: EventType;
  courseId?: string;
  startDate: string;
  endDate: string;
  venue: string;
  meetingLink?: string;
  allowOverlap?: boolean;
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency | null;
  recurrenceInterval?: number;
  recurrenceDaysOfWeek?: number[] | null;
  recurrenceEndDate?: string | null;
  recurrenceCount?: number | null;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  eventType?: EventType;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  meetingLink?: string;
  allowOverlap?: boolean;
  updateFutureInSeries?: boolean;
}

export interface EventQueryDto {
  courseId?: string;
  isGeneral?: boolean;
  eventType?: EventType;
  from?: string;
  to?: string;
  upcomingOnly?: boolean;
  recurrenceSeriesId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type PaginatedEvents = PaginatedResult<Event>;

export type CreateEventResponse =
  | Event
  | {
      totalOccurrences: number;
      recurrenceSeriesId: string;
      events: Event[];
    };
