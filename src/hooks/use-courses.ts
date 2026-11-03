import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  ApiResponse,
  PaginatedResult,
  Course,
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  CourseRosterStudent,
} from '@/types';
import type { AxiosError } from 'axios';

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params: CourseQueryDto) => [...courseKeys.lists(), params] as const,
  myCourses: () => [...courseKeys.all, 'my-courses'] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  rosters: () => [...courseKeys.all, 'roster'] as const,
  roster: (id: string) => [...courseKeys.rosters(), id] as const,
};

export function useCoursesQuery(params: CourseQueryDto = {}) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedResult<Course>>>('/courses', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search || undefined,
          semester: params.semester || undefined,
          day: params.day || undefined,
          lecturerId: params.lecturerId || undefined,
        },
      });
      return response.data?.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useMyCoursesQuery() {
  return useQuery({
    queryKey: courseKeys.myCourses(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Course[]>>('/courses/my-courses');
      return response.data?.data || [];
    },
    staleTime: 30 * 1000,
  });
}

export function useCourseByIdQuery(id?: string) {
  return useQuery({
    queryKey: courseKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Course code is required');
      const response = await apiClient.get<ApiResponse<Course>>(`/courses/${id}`);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCourseRosterQuery(courseId?: string) {
  return useQuery({
    queryKey: courseKeys.roster(courseId || ''),
    queryFn: async () => {
      if (!courseId) throw new Error('Course code is required');
      const response = await apiClient.get<ApiResponse<CourseRosterStudent[]>>(
        `/courses/${courseId}/roster`,
      );
      return response.data?.data || [];
    },
    enabled: !!courseId,
    staleTime: 30 * 1000,
  });
}

export function useCreateCourseMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateCourseDto) => {
      const response = await apiClient.post<ApiResponse<Course>>('/courses', dto);
      return response.data?.data;
    },
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      toast.success('Course Created', {
        description: `Course ${newCourse?.id || ''} - ${newCourse?.name || ''} has been registered.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to create course. Please verify the code and details.';
      toast.error('Creation Failed', { description: message });
    },
  });
}

export function useUpdateCourseMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateCourseDto;
    }) => {
      const response = await apiClient.patch<ApiResponse<Course>>(`/courses/${id}`, dto);
      return response.data?.data;
    },
    onSuccess: (updatedCourse, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.myCourses() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.id) });
      }
      toast.success('Course Updated', {
        description: `Successfully updated ${updatedCourse?.id || variables.id}.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to update course details. Please try again.';
      toast.error('Update Failed', { description: message });
    },
  });
}

export function useDeleteCourseMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/courses/${id}`);
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.myCourses() });
      toast.success('Course Deleted', {
        description: `Course ${deletedId} has been removed from the curriculum.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to delete course. Please check if records depend on it.';
      toast.error('Deletion Failed', { description: message });
    },
  });
}

export function useEnrollCourseMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.post<ApiResponse<{ message: string; courseId: string }>>(
        `/courses/${courseId}/enroll`,
      );
      return response.data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.myCourses() });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      toast.success('Enrolled in Course', {
        description: `You are now enrolled in ${courseId}. Materials and timetable updated.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to enroll in course. Please try again.';
      toast.error('Enrollment Failed', { description: message });
    },
  });
}

export function useUnenrollCourseMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string; courseId: string }>>(
        `/courses/${courseId}/enroll`,
      );
      return response.data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.myCourses() });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      toast.success('Unenrolled from Course', {
        description: `You have successfully unenrolled from ${courseId}.`,
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Failed to unenroll from course. Please try again.';
      toast.error('Unenrollment Failed', { description: message });
    },
  });
}
