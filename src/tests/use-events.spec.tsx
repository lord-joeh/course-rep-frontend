import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useEventsQuery,
  useUpcomingEventsQuery,
  useEventsBySeriesQuery,
  useEventByIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useCancelEventMutation,
  useCancelSeriesMutation,
  useDeleteEventMutation,
  useDeleteSeriesMutation,
} from '@/hooks/use-events';
import { apiClient } from '@/lib/api-client';
import type { Event, CreateEventDto, UpdateEventDto } from '@/types';

describe('use-events hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockEvent: Event = {
    id: 'evt-1',
    title: 'Computer Networks Lecture',
    description: 'Chapter 5 routing protocols',
    eventType: 'lecture',
    courseId: 'CPEN301',
    course: { id: 'CPEN301', name: 'Computer Networks' },
    startDate: '2026-11-10T10:00:00.000Z',
    endDate: '2026-11-10T12:00:00.000Z',
    venue: 'Block B Room 204',
    meetingLink: 'https://meet.google.com/xyz',
    isCancelled: false,
    isRecurring: false,
    recurrenceFrequency: null,
    recurrenceInterval: 1,
    recurrenceDaysOfWeek: null,
    recurrenceEndDate: null,
    recurrenceCount: null,
    recurrenceSeriesId: null,
    createdAt: '2026-11-04T08:00:00.000Z',
    updatedAt: '2026-11-04T08:00:00.000Z',
  };

  describe('useEventsQuery', () => {
    it('fetches paginated events successfully', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: {
            items: [mockEvent],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          },
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useEventsQuery({ courseId: 'CPEN301' }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.items[0].title).toBe('Computer Networks Lecture');
    });

    it('normalizes flat array response to paginated shape', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: [mockEvent],
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useEventsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.meta?.total).toBe(1);
    });
  });

  describe('useUpcomingEventsQuery', () => {
    it('fetches upcoming events list', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: [mockEvent],
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useUpcomingEventsQuery(3), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith('/events/upcoming', { params: { limit: 3 } });
    });
  });

  describe('useEventsBySeriesQuery', () => {
    it('fetches events by recurring series id', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: [mockEvent, { ...mockEvent, id: 'evt-2' }],
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useEventsBySeriesQuery('series-123'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/events/series/series-123');
    });
  });

  describe('useEventByIdQuery', () => {
    it('fetches a single event by ID', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: mockEvent,
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useEventByIdQuery('evt-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.id).toBe('evt-1');
      expect(apiClient.get).toHaveBeenCalledWith('/events/evt-1');
    });
  });

  describe('Mutations', () => {
    it('executes useCreateEventMutation for single event', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 201,
          data: mockEvent,
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useCreateEventMutation(), { wrapper });

      const dto: CreateEventDto = {
        title: 'Computer Networks Lecture',
        venue: 'Block B Room 204',
        startDate: '2026-11-10T10:00:00.000Z',
        endDate: '2026-11-10T12:00:00.000Z',
      };

      await result.current.mutateAsync(dto);
      expect(apiClient.post).toHaveBeenCalledWith('/events', dto);
    });

    it('executes useCreateEventMutation for recurring series', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 201,
          data: {
            totalOccurrences: 4,
            recurrenceSeriesId: 'series-uuid',
            events: [mockEvent],
          },
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useCreateEventMutation(), { wrapper });

      const dto: CreateEventDto = {
        title: 'Weekly Tutorial',
        venue: 'Lab 1',
        startDate: '2026-11-10T10:00:00.000Z',
        endDate: '2026-11-10T12:00:00.000Z',
        isRecurring: true,
        recurrenceFrequency: 'weekly',
        recurrenceCount: 4,
      };

      const res = await result.current.mutateAsync(dto);
      expect('totalOccurrences' in res).toBe(true);
    });

    it('executes useUpdateEventMutation', async () => {
      vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { ...mockEvent, title: 'Updated Title' },
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useUpdateEventMutation(), { wrapper });

      const dto: UpdateEventDto = { title: 'Updated Title', updateFutureInSeries: true };
      await result.current.mutateAsync({ id: 'evt-1', dto });

      expect(apiClient.put).toHaveBeenCalledWith('/events/evt-1', dto);
    });

    it('executes useCancelEventMutation', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { ...mockEvent, isCancelled: true },
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useCancelEventMutation(), { wrapper });
      await result.current.mutateAsync('evt-1');

      expect(apiClient.patch).toHaveBeenCalledWith('/events/evt-1/cancel');
    });

    it('executes useCancelSeriesMutation', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { cancelledCount: 5 },
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useCancelSeriesMutation(), { wrapper });
      await result.current.mutateAsync('series-123');

      expect(apiClient.patch).toHaveBeenCalledWith('/events/series/series-123/cancel');
    });

    it('executes useDeleteEventMutation', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { deleted: true },
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useDeleteEventMutation(), { wrapper });
      await result.current.mutateAsync('evt-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/events/evt-1');
    });

    it('executes useDeleteSeriesMutation', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { deletedCount: 5 },
          timestamp: '2026-11-04T08:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useDeleteSeriesMutation(), { wrapper });
      await result.current.mutateAsync('series-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/events/series/series-123');
    });
  });
});
