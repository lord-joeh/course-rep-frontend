import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  PaginatedEvents,
  CreateEventResponse,
  ApiResponse,
} from '@/types';
import { toast } from 'sonner';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: EventQueryDto = {}) => [...eventKeys.lists(), params] as const,
  upcoming: (limit?: number) => [...eventKeys.all, 'upcoming', limit ?? 5] as const,
  series: (seriesId: string) => [...eventKeys.all, 'series', seriesId] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

/**
 * Fetch paginated list of academic events with filters.
 */
export function useEventsQuery(params: EventQueryDto = {}) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedEvents | Event[]>>('/events', {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          courseId: params.courseId || undefined,
          isGeneral: params.isGeneral !== undefined ? params.isGeneral : undefined,
          eventType: params.eventType || undefined,
          from: params.from || undefined,
          to: params.to || undefined,
          upcomingOnly: params.upcomingOnly !== undefined ? params.upcomingOnly : undefined,
          recurrenceSeriesId: params.recurrenceSeriesId || undefined,
          search: params.search || undefined,
        },
      });

      // Defensively normalize if API returns array directly or paginated object
      const payload = data.data;
      if (Array.isArray(payload)) {
        return {
          items: payload,
          meta: {
            page: params.page ?? 1,
            limit: params.limit ?? payload.length,
            total: payload.length,
            totalPages: 1,
          },
        } as PaginatedEvents;
      }
      return payload;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch non-cancelled upcoming events.
 */
export function useUpcomingEventsQuery(limit: number = 5) {
  return useQuery({
    queryKey: eventKeys.upcoming(limit),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Event[]>>('/events/upcoming', {
        params: { limit },
      });
      return data.data || [];
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Fetch all occurrences belonging to a recurring series.
 */
export function useEventsBySeriesQuery(seriesId?: string | null) {
  return useQuery({
    queryKey: eventKeys.series(seriesId || ''),
    queryFn: async () => {
      if (!seriesId) return [];
      const { data } = await apiClient.get<ApiResponse<Event[]>>(`/events/series/${seriesId}`);
      return data.data || [];
    },
    enabled: !!seriesId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch a single event by ID.
 */
export function useEventByIdQuery(id?: string | null) {
  return useQuery({
    queryKey: eventKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get<ApiResponse<Event>>(`/events/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * Create a single or recurring event series.
 */
export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateEventDto) => {
      const { data } = await apiClient.post<ApiResponse<CreateEventResponse>>('/events', dto);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      if ('totalOccurrences' in data) {
        toast.success(`Recurring series created with ${data.totalOccurrences} occurrences.`);
      } else {
        toast.success('Event scheduled successfully.');
      }
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to schedule event.';
      toast.error(message);
    },
  });
}

/**
 * Update an event (with optional recurring series propagation).
 */
export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateEventDto }) => {
      const { data } = await apiClient.put<ApiResponse<Event | Event[]>>(`/events/${id}`, dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event updated successfully.');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to update event.';
      toast.error(message);
    },
  });
}

/**
 * Cancel a single event occurrence.
 */
export function useCancelEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<ApiResponse<Event>>(`/events/${id}/cancel`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event occurrence cancelled.');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to cancel event.';
      toast.error(message);
    },
  });
}

/**
 * Cancel all future occurrences in a recurring series.
 */
export function useCancelSeriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seriesId: string) => {
      const { data } = await apiClient.patch<ApiResponse<{ cancelledCount: number }>>(
        `/events/series/${seriesId}/cancel`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('All future events in series cancelled.');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to cancel series.';
      toast.error(message);
    },
  });
}

/**
 * Delete a single event occurrence.
 */
export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/events/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event deleted successfully.');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to delete event.';
      toast.error(message);
    },
  });
}

/**
 * Delete an entire recurring series.
 */
export function useDeleteSeriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seriesId: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ deletedCount: number }>>(
        `/events/series/${seriesId}`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Entire recurring series deleted.');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to delete series.';
      toast.error(message);
    },
  });
}
