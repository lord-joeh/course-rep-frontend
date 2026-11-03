import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCoursesQuery,
  useMyCoursesQuery,
  useCourseByIdQuery,
  useCourseRosterQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useEnrollCourseMutation,
  useUnenrollCourseMutation,
} from '@/hooks/use-courses';
import { apiClient } from '@/lib/api-client';

describe('use-courses hooks', () => {
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

  const mockCourse = {
    id: 'CPEN401',
    name: 'Advanced Software Engineering',
    lecturerId: 'lec-1',
    lecturer: {
      id: 'lec-1',
      name: 'Dr. John von Neumann',
      email: 'vonneumann@ias.edu',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    day: 'Monday',
    startTime: '09:00',
    endTime: '11:00',
    semester: 'First Semester',
    slidesFolderId: 'folder-123',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('useCoursesQuery fetches paginated courses with filters', async () => {
    const mockData = {
      items: [mockCourse],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockData },
    });

    const { result } = renderHook(
      () =>
        useCoursesQuery({
          page: 1,
          limit: 10,
          search: 'CPEN',
          semester: 'First Semester',
          day: 'Monday',
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/courses', {
      params: {
        page: 1,
        limit: 10,
        search: 'CPEN',
        semester: 'First Semester',
        day: 'Monday',
        lecturerId: undefined,
      },
    });
    expect(result.current.data?.items[0].id).toBe('CPEN401');
  });

  it('useMyCoursesQuery retrieves student enrolled courses', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: [mockCourse] },
    });

    const { result } = renderHook(() => useMyCoursesQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/courses/my-courses');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('CPEN401');
  });

  it('useCourseByIdQuery fetches single course by ID', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockCourse },
    });

    const { result } = renderHook(() => useCourseByIdQuery('CPEN401'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/courses/CPEN401');
    expect(result.current.data?.name).toBe('Advanced Software Engineering');
  });

  it('useCourseRosterQuery retrieves enrolled students roster', async () => {
    const mockRoster = [
      {
        id: '10928374',
        name: 'Grace Hopper',
        email: 'grace@navy.mil',
        isRep: true,
        status: 'active' as const,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockRoster },
    });

    const { result } = renderHook(() => useCourseRosterQuery('CPEN401'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/courses/CPEN401/roster');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Grace Hopper');
  });

  it('useCreateCourseMutation registers a new course and invalidates cache', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: mockCourse },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCourseMutation(), { wrapper });

    result.current.mutate({
      id: 'CPEN401',
      name: 'Advanced Software Engineering',
      semester: 'First Semester',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postSpy).toHaveBeenCalledWith('/courses', {
      id: 'CPEN401',
      name: 'Advanced Software Engineering',
      semester: 'First Semester',
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('useUpdateCourseMutation patches existing course and invalidates cache', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        success: true,
        data: { ...mockCourse, name: 'Software Engineering Principles' },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCourseMutation(), { wrapper });

    result.current.mutate({
      id: 'CPEN401',
      dto: { name: 'Software Engineering Principles' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(patchSpy).toHaveBeenCalledWith('/courses/CPEN401', {
      name: 'Software Engineering Principles',
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('useDeleteCourseMutation removes course and invalidates cache', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true, data: { message: 'Course deleted' } },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteCourseMutation(), { wrapper });

    result.current.mutate('CPEN401');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteSpy).toHaveBeenCalledWith('/courses/CPEN401');
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('useEnrollCourseMutation enrolls student and invalidates student courses', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: { message: 'Enrolled', courseId: 'CPEN401' } },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useEnrollCourseMutation(), { wrapper });

    result.current.mutate('CPEN401');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postSpy).toHaveBeenCalledWith('/courses/CPEN401/enroll');
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('useUnenrollCourseMutation unenrolls student and invalidates caches', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true, data: { message: 'Unenrolled', courseId: 'CPEN401' } },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnenrollCourseMutation(), { wrapper });

    result.current.mutate('CPEN401');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteSpy).toHaveBeenCalledWith('/courses/CPEN401/enroll');
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
