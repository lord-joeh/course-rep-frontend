import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  ApiResponse,
  PaginatedResult,
  Lecturer,
  CreateLecturerDto,
  UpdateLecturerDto,
  LecturerQueryDto,
} from '@/types';
import type { AxiosError } from 'axios';

export const lecturerKeys = {
  all: ['lecturers'] as const,
  lists: () => [...lecturerKeys.all, 'list'] as const,
  list: (params: LecturerQueryDto) => [...lecturerKeys.lists(), params] as const,
  details: () => [...lecturerKeys.all, 'detail'] as const,
  detail: (id: string) => [...lecturerKeys.details(), id] as const,
};

export function useLecturersQuery(params: LecturerQueryDto = {}) {
  return useQuery({
    queryKey: lecturerKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedResult<Lecturer>>>('/lecturers', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search || undefined,
        },
      });
      return response.data?.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useLecturerByIdQuery(id?: string) {
  return useQuery({
    queryKey: lecturerKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Lecturer ID is required');
      const response = await apiClient.get<ApiResponse<Lecturer>>(`/lecturers/${id}`);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateLecturerMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateLecturerDto) => {
      const response = await apiClient.post<ApiResponse<Lecturer>>('/lecturers', dto);
      return response.data?.data;
    },
    onSuccess: (newLecturer) => {
      queryClient.invalidateQueries({ queryKey: lecturerKeys.lists() });
      toast.success('Faculty Member Added', {
        description: `Successfully added ${newLecturer?.name || 'lecturer'} to the directory.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to add faculty member. Please check the values.';
      toast.error('Creation Failed', { description: message });
    },
  });
}

export function useUpdateLecturerMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateLecturerDto;
    }) => {
      const response = await apiClient.patch<ApiResponse<Lecturer>>(`/lecturers/${id}`, dto);
      return response.data?.data;
    },
    onSuccess: (updatedLecturer, variables) => {
      queryClient.invalidateQueries({ queryKey: lecturerKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: lecturerKeys.detail(variables.id) });
      }
      toast.success('Faculty Member Updated', {
        description: `Successfully updated ${updatedLecturer?.name || 'lecturer'}.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to update faculty member. Please check the values.';
      toast.error('Update Failed', { description: message });
    },
  });
}

export function useDeleteLecturerMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/lecturers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lecturerKeys.lists() });
      toast.success('Faculty Member Deleted', {
        description: 'The faculty member has been removed from the directory.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to delete faculty member. Please try again.';
      toast.error('Deletion Failed', { description: message });
    },
  });
}
