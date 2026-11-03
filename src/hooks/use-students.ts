import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  ApiResponse,
  PaginatedResult,
  Student,
  StudentQueryDto,
  RepUpdateStudentDto,
} from '@/types';
import type { AxiosError } from 'axios';

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (params: StudentQueryDto) => [...studentKeys.lists(), params] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  myProfile: () => [...studentKeys.all, 'me'] as const,
};

export function useStudentsQuery(params: StudentQueryDto = {}) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedResult<Student>>>('/students', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search || undefined,
          status: params.status || undefined,
          isRep: params.isRep !== undefined ? params.isRep : undefined,
        },
      });
      return response.data?.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useStudentByIdQuery(id?: string) {
  return useQuery({
    queryKey: studentKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Student ID is required');
      const response = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useMyProfileQuery() {
  return useQuery({
    queryKey: studentKeys.myProfile(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Student>>('/students/me');
      return response.data?.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateStudentMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: RepUpdateStudentDto;
    }) => {
      const response = await apiClient.patch<ApiResponse<Student>>(`/students/${id}`, dto);
      return response.data?.data;
    },
    onSuccess: (updatedStudent, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
      }
      toast.success('Student Record Updated', {
        description: `Successfully updated profile for ${updatedStudent?.name || variables.id}.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to update student. Please check the values.';
      toast.error('Update Failed', { description: message });
    },
  });
}

export function useDeleteStudentMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/students/${id}`);
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      toast.success('Student Deleted', {
        description: `Student ${deletedId} has been removed from the directory.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to delete student record. Please try again.';
      toast.error('Deletion Failed', { description: message });
    },
  });
}

