import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFeedbacksQuery,
  useMyFeedbacksQuery,
  useFeedbackByIdQuery,
  useCreateFeedbackMutation,
  useUpdateFeedbackStatusMutation,
  useDeleteFeedbackMutation,
} from '@/hooks/use-feedback';
import { apiClient } from '@/lib/api-client';
import type { Feedback } from '@/types';

describe('use-feedback hooks', () => {
  let queryClient: QueryClient;

  const mockFeedback: Feedback = {
    id: 'fb-001',
    studentId: 'std-101',
    student: { id: 'std-101', name: 'Kofi Annan', email: 'kofi@univ.edu' },
    courseId: 'CPEN305',
    course: { id: 'CPEN305', name: 'Operating Systems' },
    category: 'academic',
    title: 'Lab 2 Guidelines Clarification',
    content: 'The rubric for question 3 seems ambiguous regarding mutex locks.',
    isAnonymous: false,
    priority: 'medium',
    status: 'submitted',
    repResponse: null,
    respondedAt: null,
    respondedBy: null,
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('useFeedbacksQuery fetches feedback directory with filters', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: {
          items: [mockFeedback],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      },
    });

    const { result } = renderHook(() => useFeedbacksQuery({ status: 'submitted' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].title).toBe('Lab 2 Guidelines Clarification');
  });

  it('useMyFeedbacksQuery retrieves personal submissions for current student', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: {
          items: [mockFeedback],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      },
    });

    const { result } = renderHook(() => useMyFeedbacksQuery({ page: 1 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0].id).toBe('fb-001');
  });

  it('useFeedbackByIdQuery retrieves single feedback entry', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: mockFeedback,
      },
    });

    const { result } = renderHook(() => useFeedbackByIdQuery('fb-001'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Lab 2 Guidelines Clarification');
  });

  it('useCreateFeedbackMutation sends POST /feedback and returns created item', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 201,
        data: { ...mockFeedback, isAnonymous: true },
      },
    });

    const { result } = renderHook(() => useCreateFeedbackMutation(), { wrapper });

    await result.current.mutateAsync({
      title: 'Lab 2 Guidelines Clarification',
      content: 'The rubric for question 3 seems ambiguous regarding mutex locks.',
      category: 'academic',
      isAnonymous: true,
    });

    expect(postSpy).toHaveBeenCalledWith('/feedback', {
      title: 'Lab 2 Guidelines Clarification',
      content: 'The rubric for question 3 seems ambiguous regarding mutex locks.',
      category: 'academic',
      isAnonymous: true,
    });
  });

  it('useUpdateFeedbackStatusMutation sends PATCH /feedback/:id/status', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: {
          ...mockFeedback,
          status: 'resolved',
          repResponse: 'Explained in Friday tutorial.',
        },
      },
    });

    const { result } = renderHook(() => useUpdateFeedbackStatusMutation(), { wrapper });

    await result.current.mutateAsync({
      id: 'fb-001',
      dto: { status: 'resolved', repResponse: 'Explained in Friday tutorial.' },
    });

    expect(patchSpy).toHaveBeenCalledWith('/feedback/fb-001/status', {
      status: 'resolved',
      repResponse: 'Explained in Friday tutorial.',
    });
  });

  it('useDeleteFeedbackMutation sends DELETE /feedback/:id', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: { message: 'Feedback successfully deleted' },
      },
    });

    const { result } = renderHook(() => useDeleteFeedbackMutation(), { wrapper });

    await result.current.mutateAsync('fb-001');

    expect(deleteSpy).toHaveBeenCalledWith('/feedback/fb-001');
  });
});

