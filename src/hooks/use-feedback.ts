import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Feedback,
  CreateFeedbackDto,
  UpdateFeedbackStatusDto,
  FeedbackQueryDto,
  PaginatedFeedbacks,
  ApiResponse,
} from '@/types';
import { toast } from 'sonner';
import { getFeedbackStatusMeta } from '@/lib/feedback-validation';

export const feedbackKeys = {
  all: ['feedback'] as const,
  lists: () => [...feedbackKeys.all, 'list'] as const,
  list: (params: FeedbackQueryDto = {}) => [...feedbackKeys.lists(), params] as const,
  myFeedbacks: () => [...feedbackKeys.all, 'my-feedback'] as const,
  myFeedback: (params: { page?: number; limit?: number } = {}) =>
    [...feedbackKeys.myFeedbacks(), params] as const,
  details: () => [...feedbackKeys.all, 'detail'] as const,
  detail: (id: string) => [...feedbackKeys.details(), id] as const,
};

/**
 * Fetch paginated cohort feedback directory (Course Rep triage board).
 */
export function useFeedbacksQuery(params: FeedbackQueryDto = {}) {
  return useQuery({
    queryKey: feedbackKeys.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedFeedbacks>>('/feedback', {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search || undefined,
          status: params.status || undefined,
          category: params.category || undefined,
          priority: params.priority || undefined,
          courseId: params.courseId || undefined,
          isAnonymous: params.isAnonymous !== undefined ? params.isAnonymous : undefined,
        },
      });
      return data.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });
}

/**
 * Fetch authenticated student's personal feedback submissions.
 */
export function useMyFeedbacksQuery(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: feedbackKeys.myFeedback(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedFeedbacks>>('/feedback/my-feedback', {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
        },
      });
      return data.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });
}

/**
 * Retrieve single feedback details with privacy masking & ownership validation.
 */
export function useFeedbackByIdQuery(id?: string | null) {
  return useQuery({
    queryKey: feedbackKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get<ApiResponse<Feedback>>(`/feedback/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * Submit feedback or suggestion (Student & Course Rep).
 */
export function useCreateFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateFeedbackDto) => {
      const { data } = await apiClient.post<ApiResponse<Feedback>>('/feedback', dto);
      return data.data;
    },
    onSuccess: (createdFeedback) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      toast.success('Feedback Submitted', {
        description: createdFeedback.isAnonymous
          ? 'Your feedback was submitted anonymously. Thank you for your suggestion!'
          : 'Your feedback was submitted. Course Reps have been notified.',
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to submit feedback. Please try again.';
      toast.error('Submission Failed', { description: msg });
    },
  });
}

/**
 * Triage feedback status & provide official Course Rep response.
 */
export function useUpdateFeedbackStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateFeedbackStatusDto }) => {
      const { data } = await apiClient.patch<ApiResponse<Feedback>>(`/feedback/${id}/status`, dto);
      return data.data;
    },
    onSuccess: (updatedFeedback) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      const statusMeta = getFeedbackStatusMeta(updatedFeedback.status);
      toast.success('Feedback Updated', {
        description: `Status changed to ${statusMeta.label}.${
          updatedFeedback.repResponse ? ' Response dispatched.' : ''
        }`,
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update feedback status.';
      toast.error('Update Failed', { description: msg });
    },
  });
}

/**
 * Permanently delete feedback (Course Reps only).
 */
export function useDeleteFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/feedback/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      toast.success('Feedback Deleted', {
        description: 'The feedback entry was permanently removed.',
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to delete feedback entry.';
      toast.error('Deletion Failed', { description: msg });
    },
  });
}

