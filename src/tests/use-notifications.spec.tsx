import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
  useNotificationByIdQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useSendDirectNotificationMutation,
  useRegisterPushTokenMutation,
} from '@/hooks/use-notifications';
import { apiClient } from '@/lib/api-client';
import type { Notification, CreateNotificationDto, DirectNotificationDto } from '@/types';

describe('use-notifications hooks', () => {
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

  const mockNotification: Notification = {
    id: 'notif-1',
    title: 'Final Exam Schedule Published',
    message: 'The final examination timetable has been uploaded.',
    type: 'announcement',
    priority: 'high',
    senderId: 'rep-01',
    sender: { id: 'rep-01', name: 'Lead Rep', email: 'rep@univ.edu' },
    courseId: 'CPEN404',
    course: { id: 'CPEN404', name: 'Distributed Systems' },
    isRead: false,
    createdAt: '2026-11-04T12:00:00.000Z',
    updatedAt: '2026-11-04T12:00:00.000Z',
  };

  describe('Queries', () => {
    it('fetches paginated notifications list', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: {
            items: [mockNotification],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          },
        },
      });

      const { result } = renderHook(() => useNotificationsQuery({ priority: 'high' }), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.items[0].title).toBe('Final Exam Schedule Published');
    });

    it('normalizes flat array response to paginated structure', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: [mockNotification],
        },
      });

      const { result } = renderHook(() => useNotificationsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.meta?.total).toBe(1);
    });

    it('fetches unread notification count', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { unreadCount: 5 },
        },
      });

      const { result } = renderHook(() => useUnreadNotificationCountQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.unreadCount).toBe(5);
      expect(apiClient.get).toHaveBeenCalledWith('/notifications/unread-count');
    });

    it('fetches single notification by ID', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: mockNotification,
        },
      });

      const { result } = renderHook(() => useNotificationByIdQuery('notif-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.id).toBe('notif-1');
      expect(apiClient.get).toHaveBeenCalledWith('/notifications/notif-1');
    });
  });

  describe('Mutations', () => {
    it('executes useCreateNotificationMutation', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 201,
          data: mockNotification,
        },
      });

      const { result } = renderHook(() => useCreateNotificationMutation(), { wrapper });

      const dto: CreateNotificationDto = {
        title: 'New Announcement',
        message: 'Classroom moved to LT2.',
        type: 'announcement',
        priority: 'normal',
      };

      await result.current.mutateAsync(dto);
      expect(apiClient.post).toHaveBeenCalledWith('/notifications', dto);
    });

    it('executes useUpdateNotificationMutation', async () => {
      vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { ...mockNotification, title: 'Updated Title' },
        },
      });

      const { result } = renderHook(() => useUpdateNotificationMutation(), { wrapper });
      await result.current.mutateAsync({
        id: 'notif-1',
        dto: { title: 'Updated Title' },
      });

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/notif-1', {
        title: 'Updated Title',
      });
    });

    it('executes useDeleteNotificationMutation', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { message: 'Notification deleted successfully' },
        },
      });

      const { result } = renderHook(() => useDeleteNotificationMutation(), { wrapper });
      await result.current.mutateAsync('notif-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/notif-1');
    });

    it('executes useMarkNotificationReadMutation', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { message: 'Notification marked as read' },
        },
      });

      const { result } = renderHook(() => useMarkNotificationReadMutation(), { wrapper });
      await result.current.mutateAsync('notif-1');

      expect(apiClient.patch).toHaveBeenCalledWith('/notifications/notif-1/read');
    });

    it('executes useMarkAllNotificationsReadMutation', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { message: 'All marked as read', markedCount: 4 },
        },
      });

      const { result } = renderHook(() => useMarkAllNotificationsReadMutation(), { wrapper });
      await result.current.mutateAsync();

      expect(apiClient.patch).toHaveBeenCalledWith('/notifications/read-all');
    });

    it('executes useSendDirectNotificationMutation', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 201,
          data: { message: 'Direct message sent' },
        },
      });

      const { result } = renderHook(() => useSendDirectNotificationMutation(), { wrapper });
      const dto: DirectNotificationDto = {
        studentId: '10928374',
        title: 'Report Reminder',
        message: 'Please hand in your report.',
      };

      await result.current.mutateAsync(dto);
      expect(apiClient.post).toHaveBeenCalledWith('/notifications/direct', dto);
    });

    it('executes useRegisterPushTokenMutation', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          statusCode: 200,
          data: { message: 'FCM registered' },
        },
      });

      const { result } = renderHook(() => useRegisterPushTokenMutation(), { wrapper });
      await result.current.mutateAsync({ token: 'mock-fcm-token', deviceType: 'web' });

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/push-token', {
        token: 'mock-fcm-token',
        deviceType: 'web',
      });
    });
  });
});
