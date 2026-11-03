import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useStudentsQuery,
  useStudentByIdQuery,
  useMyProfileQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from '@/hooks/use-students';
import { apiClient } from '@/lib/api-client';

describe('use-students hooks', () => {
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

  it('useStudentsQuery fetches paginated student roster', async () => {
    const mockRoster = {
      items: [
        { id: 'STU-1', name: 'John Doe', email: 'john@univ.edu', isRep: false, status: 'active', createdAt: '', updatedAt: '' },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockRoster },
    });

    const { result } = renderHook(() => useStudentsQuery({ page: 1, limit: 10, search: 'John' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/students', {
      params: { page: 1, limit: 10, search: 'John', status: undefined, isRep: undefined },
    });
    expect(result.current.data?.items[0].name).toBe('John Doe');
  });

  it('useStudentByIdQuery retrieves single student by ID', async () => {
    const mockStudent = {
      id: 'STU-42',
      name: 'Alan Turing',
      email: 'alan@cambridge.edu',
      isRep: true,
      status: 'active',
      createdAt: '',
      updatedAt: '',
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockStudent },
    });

    const { result } = renderHook(() => useStudentByIdQuery('STU-42'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/students/STU-42');
    expect(result.current.data?.name).toBe('Alan Turing');
  });

  it('useMyProfileQuery retrieves current authenticated student profile', async () => {
    const mockSelf = {
      id: 'ME-1',
      name: 'Myself',
      email: 'me@univ.edu',
      isRep: false,
      status: 'active',
      createdAt: '',
      updatedAt: '',
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockSelf },
    });

    const { result } = renderHook(() => useMyProfileQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/students/me');
    expect(result.current.data?.id).toBe('ME-1');
  });

  it('useUpdateStudentMutation patches student details and invalidates cache', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 'STU-1', name: 'Updated Name', isRep: true, status: 'active' },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateStudentMutation(), { wrapper });

    result.current.mutate({
      id: 'STU-1',
      dto: { name: 'Updated Name', isRep: true },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(patchSpy).toHaveBeenCalledWith('/students/STU-1', {
      name: 'Updated Name',
      isRep: true,
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('useDeleteStudentMutation deletes student record', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true, message: 'Deleted' },
    });

    const { result } = renderHook(() => useDeleteStudentMutation(), { wrapper });

    result.current.mutate('STU-DELETE');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteSpy).toHaveBeenCalledWith('/students/STU-DELETE');
  });
});

