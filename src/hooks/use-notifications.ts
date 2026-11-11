import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  DirectNotificationDto,
  RegisterFcmTokenDto,
  UnregisterFcmTokenDto,
  PushNotificationStatusResponse,
  NotificationQueryDto,
  PaginatedNotifications,
  UnreadNotificationCountResponse,
  MarkAllReadResponse,
  ApiResponse,
} from '@/types';
import { toast } from 'sonner';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: NotificationQueryDto = {}) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  pushStatus: () => [...notificationKeys.all, 'push-status'] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
};

/**
 * Fetch paginated list of announcements & notifications with personal read state.
 */
export function useNotificationsQuery(params: NotificationQueryDto = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedNotifications | Notification[]>>(
        '/notifications',
        {
          params: {
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            type: params.type || undefined,
            priority: params.priority || undefined,
            courseId: params.courseId || undefined,
            isRead: params.isRead !== undefined ? params.isRead : undefined,
            search: params.search || undefined,
          },
        },
      );

      const payload = data.data;
      if (Array.isArray(payload)) {
        return {
          items: payload,
          meta: {
            page: params.page ?? 1,
            limit: params.limit ?? payload.length,
            total: payload.length,
            totalPages: 1,
          },
        } as PaginatedNotifications;
      }
      return payload;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60,
  });
}

/**
 * Fast query for navbar/sidebar unread notification counter badge.
 */
export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<UnreadNotificationCountResponse>>(
        '/notifications/unread-count',
      );
      return data.data;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30, // Background poll every 30s as safety fallback to WebSockets
  });
}

/**
 * Retrieve single notification details with personal read state.
 */
export function useNotificationByIdQuery(id?: string | null) {
  return useQuery({
    queryKey: notificationKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get<ApiResponse<Notification>>(`/notifications/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * Broadcast a new announcement (Course Rep only).
 */
export function useCreateNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateNotificationDto) => {
      const { data } = await apiClient.post<ApiResponse<Notification>>('/notifications', dto);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(
        data.priority === 'urgent'
          ? 'Urgent announcement broadcast dispatched!'
          : 'Announcement broadcast successfully.',
      );
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to broadcast announcement.';
      toast.error(message);
    },
  });
}

/**
 * Update announcement details (Course Rep only).
 */
export function useUpdateNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateNotificationDto }) => {
      const { data } = await apiClient.put<ApiResponse<Notification>>(`/notifications/${id}`, dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('Announcement updated successfully.');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to update announcement.';
      toast.error(message);
    },
  });
}

/**
 * Permanently delete an announcement (Course Rep only).
 */
export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/notifications/${id}`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('Announcement deleted.');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to delete announcement.';
      toast.error(message);
    },
  });
}

/**
 * Mark a single notification as read.
 */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<ApiResponse<{ message: string }>>(
        `/notifications/${id}/read`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to mark as read.';
      toast.error(message);
    },
  });
}

/**
 * Bulk mark all unread notifications as read.
 */
export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch<ApiResponse<MarkAllReadResponse>>(
        '/notifications/read-all',
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(data.message || 'All notifications marked as read.');
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || err.message || 'Failed to mark notifications as read.';
      toast.error(message);
    },
  });
}

/**
 * Send direct targeted notification to a specific student (Course Rep only).
 */
export function useSendDirectNotificationMutation() {
  return useMutation({
    mutationFn: async (dto: DirectNotificationDto) => {
      const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
        '/notifications/direct',
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      toast.success('Direct message dispatched to student.');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to send direct message.';
      toast.error(message);
    },
  });
}

/**
 * Register or refresh FCM push token.
 */
export function useRegisterPushTokenMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: RegisterFcmTokenDto) => {
      const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
        '/notifications/push-token',
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.pushStatus() });
    },
  });
}

/**
 * Unregister FCM push token(s) (turn push notifications off).
 */
export function useUnregisterPushTokenMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto?: UnregisterFcmTokenDto) => {
      const { data } = await apiClient.delete<
        ApiResponse<{ message: string; enabled: boolean; unregisteredCount: number }>
      >('/notifications/push-token', {
        data: dto,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.pushStatus() });
    },
  });
}

/**
 * Query current push notification subscription status.
 */
export function usePushStatusQuery() {
  return useQuery({
    queryKey: notificationKeys.pushStatus(),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PushNotificationStatusResponse>>(
        '/notifications/push-status',
      );
      return data.data;
    },
    staleTime: 60_000,
  });
}
