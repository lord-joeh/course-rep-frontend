import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useLecturersQuery,
  useLecturerByIdQuery,
  useCreateLecturerMutation,
  useUpdateLecturerMutation,
  useDeleteLecturerMutation,
} from '@/hooks/use-lecturers';
import { apiClient } from '@/lib/api-client';

describe('use-lecturers hooks', () => {
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

  it('useLecturersQuery fetches paginated faculty directory', async () => {
    const mockData = {
      items: [
        {
          id: 'lec-1',
          name: 'Prof. Ada Lovelace',
          email: 'ada@computing.edu',
          phone: '+1 555-0101',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
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
      () => useLecturersQuery({ page: 1, limit: 10, search: 'Ada' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/lecturers', {
      params: { page: 1, limit: 10, search: 'Ada' },
    });
    expect(result.current.data?.items[0].name).toBe('Prof. Ada Lovelace');
  });

  it('useLecturerByIdQuery retrieves single lecturer details', async () => {
    const mockLecturer = {
      id: 'lec-42',
      name: 'Dr. Grace Hopper',
      email: 'grace@navy.mil',
      phone: '+1 555-0102',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockLecturer },
    });

    const { result } = renderHook(() => useLecturerByIdQuery('lec-42'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith('/lecturers/lec-42');
    expect(result.current.data?.name).toBe('Dr. Grace Hopper');
  });

  it('useCreateLecturerMutation posts new lecturer and invalidates query cache', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 'lec-new',
          name: 'Claude Shannon',
          email: 'claude@bell.labs',
          phone: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateLecturerMutation(), { wrapper });

    result.current.mutate({
      name: 'Claude Shannon',
      email: 'claude@bell.labs',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postSpy).toHaveBeenCalledWith('/lecturers', {
      name: 'Claude Shannon',
      email: 'claude@bell.labs',
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('useUpdateLecturerMutation patches existing lecturer and invalidates cache', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 'lec-1',
          name: 'Ada King-Noel',
          email: 'ada@computing.edu',
          phone: '+1 555-9999',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateLecturerMutation(), { wrapper });

    result.current.mutate({
      id: 'lec-1',
      dto: { name: 'Ada King-Noel', phone: '+1 555-9999' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(patchSpy).toHaveBeenCalledWith('/lecturers/lec-1', {
      name: 'Ada King-Noel',
      phone: '+1 555-9999',
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('useDeleteLecturerMutation sends DELETE request and invalidates cache', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true, data: { message: 'Lecturer successfully deleted' } },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteLecturerMutation(), { wrapper });

    result.current.mutate('lec-delete');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteSpy).toHaveBeenCalledWith('/lecturers/lec-delete');
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
