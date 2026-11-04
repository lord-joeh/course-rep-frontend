import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  QueueStatsMap,
  SendTestEmailDto,
  SendTestSmsDto,
  EnqueueTestResponse,
} from '@/types/queue.types';
import { toast } from 'sonner';

export const QUEUE_ADMIN_KEYS = {
  all: ['admin', 'queues'] as const,
  stats: () => [...QUEUE_ADMIN_KEYS.all, 'stats'] as const,
};

/**
 * Query for real-time BullMQ queue operational metrics.
 * Supports configurable auto-refresh polling intervals.
 */
export function useQueueStatsQuery(refetchInterval: number | false = 10000) {
  return useQuery({
    queryKey: QUEUE_ADMIN_KEYS.stats(),
    queryFn: async () => {
      const res = await apiClient.get<any>('/admin/queues/stats');
      const data = res.data;
      if (data?.stats) {
        return data.stats as QueueStatsMap;
      }
      if (data?.data?.stats) {
        return data.data.stats as QueueStatsMap;
      }
      return (data?.data || {}) as QueueStatsMap;
    },
    refetchInterval,
    staleTime: typeof refetchInterval === 'number' ? refetchInterval / 2 : 5000,
  });
}

/**
 * Mutation to dispatch a live test email job to the Email Queue.
 */
export function useSendTestEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendTestEmailDto = {}) => {
      const res = await apiClient.post<any>('/admin/queues/email/test', payload);
      return (res.data?.data || res.data) as EnqueueTestResponse;
    },
    onSuccess: (data) => {
      toast.success('Test Email Job Enqueued', {
        description: `Job #${data.jobId || 'OK'} dispatched for ${data.recipient || 'recipient'}.`,
      });
      queryClient.invalidateQueries({ queryKey: QUEUE_ADMIN_KEYS.stats() });
    },
    onError: (err: any) => {
      toast.error('Failed to Enqueue Email Job', {
        description:
          err.response?.data?.message || err.message || 'Unable to submit test job to Email Queue.',
      });
    },
  });
}

/**
 * Mutation to dispatch a live test SMS job to the Arkesel SMS Queue.
 */
export function useSendTestSmsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendTestSmsDto) => {
      const res = await apiClient.post<any>('/admin/queues/sms/test', payload);
      return (res.data?.data || res.data) as EnqueueTestResponse;
    },
    onSuccess: (data) => {
      toast.success('Test SMS Job Enqueued', {
        description: `Job #${data.jobId || 'OK'} dispatched to ${data.recipient || 'recipient'}.`,
      });
      queryClient.invalidateQueries({ queryKey: QUEUE_ADMIN_KEYS.stats() });
    },
    onError: (err: any) => {
      toast.error('Failed to Enqueue SMS Job', {
        description:
          err.response?.data?.message || err.message || 'Unable to submit test job to SMS Queue.',
      });
    },
  });
}

