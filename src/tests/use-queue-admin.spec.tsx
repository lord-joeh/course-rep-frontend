import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useQueueStatsQuery,
  useSendTestEmailMutation,
  useSendTestSmsMutation,
} from '@/hooks/use-queue-admin';
import { apiClient } from '@/lib/api-client';
import type { QueueStatsMap } from '@/types/queue.types';

describe('use-queue-admin hooks', () => {
  let queryClient: QueryClient;

  const mockStats: QueueStatsMap = {
    email: { active: 1, completed: 50, failed: 0, delayed: 0, waiting: 0, paused: 0 },
    sms: { active: 0, completed: 25, failed: 1, delayed: 0, waiting: 0, paused: 0 },
    'drive-sync': { active: 0, completed: 10, failed: 0, delayed: 0, waiting: 0, paused: 0 },
    attendance: { active: 0, completed: 100, failed: 0, delayed: 0, waiting: 0, paused: 0 },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches real-time queue operational metrics', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        message: 'Queue operational metrics retrieved successfully',
        stats: mockStats,
      },
    });

    const { result } = renderHook(() => useQueueStatsQuery(false), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.email?.completed).toBe(50);
    expect(result.current.data?.sms?.failed).toBe(1);
    expect(result.current.data?.attendance?.completed).toBe(100);
  });

  it('submits a test email dispatch job', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        message: 'Test email job successfully enqueued',
        jobId: 'email-job-42',
        recipient: 'rep@university.edu',
      },
    });

    const { result } = renderHook(() => useSendTestEmailMutation(), { wrapper });

    const response = await result.current.mutateAsync({ to: 'rep@university.edu' });
    expect(response.jobId).toBe('email-job-42');
    expect(response.recipient).toBe('rep@university.edu');
  });

  it('submits a test SMS dispatch job', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        message: 'Test SMS job successfully enqueued',
        jobId: 'sms-job-99',
        recipient: '0256269405',
      },
    });

    const { result } = renderHook(() => useSendTestSmsMutation(), { wrapper });

    const response = await result.current.mutateAsync({
      to: '0256269405',
      message: 'Test alert',
    });
    expect(response.jobId).toBe('sms-job-99');
    expect(response.recipient).toBe('0256269405');
  });
});

