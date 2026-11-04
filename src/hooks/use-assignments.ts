import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  ApiResponse,
  PaginatedResult,
  Assignment,
  AssignmentDetailResponse,
  AssignmentQueryDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from '@/types';
import type { AxiosError, AxiosResponse } from 'axios';

export const assignmentKeys = {
  all: ['assignments'] as const,
  courseAssignments: (courseId: string, params?: Partial<AssignmentQueryDto>) =>
    [...assignmentKeys.all, 'course', courseId, params] as const,
  detail: (id: string, page = 1) =>
    [...assignmentKeys.all, 'detail', id, page] as const,
  studentSubmissions: (studentId: string) =>
    [...assignmentKeys.all, 'student', studentId] as const,
};

export function useAssignmentsQuery(query: AssignmentQueryDto) {
  return useQuery({
    queryKey: assignmentKeys.courseAssignments(query.courseId, query),
    queryFn: async () => {
      if (!query.courseId) {
        return {
          items: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        };
      }
      const response = await apiClient.get<ApiResponse<PaginatedResult<Assignment>>>('/assignments', {
        params: {
          courseId: query.courseId,
          page: query.page || 1,
          limit: query.limit || 20,
          search: query.search || undefined,
        },
      });
      return response.data?.data;
    },
    enabled: Boolean(query.courseId && query.courseId.trim()),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useAssignmentDetailQuery(id: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: assignmentKeys.detail(id, page),
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<ApiResponse<AssignmentDetailResponse>>(`/assignments/${id}`, {
        params: { page, limit },
      });
      return response.data?.data;
    },
    enabled: Boolean(id && id.trim()),
    staleTime: 20 * 1000,
  });
}

export function useCreateAssignmentMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAssignmentDto) => {
      const formData = new FormData();
      formData.append('title', payload.title.trim());
      formData.append('description', payload.description.trim());
      formData.append('courseId', payload.courseId.trim().toUpperCase());
      formData.append('deadline', payload.deadline);
      if (payload.file) {
        formData.append('file', payload.file);
      }

      const response = await apiClient.post<ApiResponse<Assignment>>('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success('Assignment Published', {
        description: `"${variables.title}" has been published and Google Drive submission folder provisioned.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to create assignment. Please try again.';
      toast.error('Publish Failed', { description: message });
    },
  });
}

export function useUpdateAssignmentMutation(assignmentId: string, onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateAssignmentDto) => {
      const response = await apiClient.put<ApiResponse<Assignment>>(
        `/assignments/${assignmentId}`,
        payload,
      );
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success('Assignment Updated', {
        description: 'Assignment details and deadline updated successfully.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to update assignment. Please try again.';
      toast.error('Update Failed', { description: message });
    },
  });
}

export function useDeleteAssignmentMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/assignments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success('Assignment Deleted', {
        description: 'Assignment, student submissions, and Google Drive folder removed.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to delete assignment.';
      toast.error('Deletion Failed', { description: message });
    },
  });
}

export function useSubmitAssignmentMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, file }: { assignmentId: string; file: File }) => {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<any>>('/assignments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success('Assignment Submitted', {
        description: 'Your solution file has been uploaded to cloud storage.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to submit assignment. Check file size and deadline.';
      toast.error('Submission Failed', { description: message });
    },
  });
}

export function useDeleteSubmissionMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/assignments/submissions/${submissionId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success('Submission Withdrawn', {
        description: 'Your solution has been deleted. You can re-submit before the deadline.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to delete submission.';
      toast.error('Action Failed', { description: message });
    },
  });
}

export function useDownloadAssignmentSpec() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadSpec = async (assignmentId: string, fallbackName = 'specification') => {
    try {
      setIsDownloading(true);
      const response: AxiosResponse<Blob> = await apiClient.get(
        `/assignments/${assignmentId}/download`,
        { responseType: 'blob' },
      );

      const disposition = String(response.headers['content-disposition'] || '');
      let filename = fallbackName;
      const match = disposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }

      const blob = new Blob([response.data], {
        type: String(response.headers['content-type'] || 'application/octet-stream'),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download Complete', { description: `Downloaded ${filename}` });
    } catch {
      toast.error('Download Failed', {
        description: 'Unable to download assignment specification file.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadSpec, isDownloading };
}

export function useDownloadSubmission() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadSubmission = async (submissionId: string, fallbackName = 'submission') => {
    try {
      setDownloadingId(submissionId);
      const response: AxiosResponse<Blob> = await apiClient.get(
        `/assignments/submissions/${submissionId}/download`,
        { responseType: 'blob' },
      );

      const disposition = String(response.headers['content-disposition'] || '');
      let filename = fallbackName;
      const match = disposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }

      const blob = new Blob([response.data], {
        type: String(response.headers['content-type'] || 'application/octet-stream'),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download Complete', { description: `Downloaded ${filename}` });
    } catch {
      toast.error('Download Failed', {
        description: 'Unable to stream submission file from cloud storage.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return {
    downloadSubmission,
    isDownloading: downloadingId !== null,
    downloadingId,
  };
}
