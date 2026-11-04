import { useState, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { createNamespaceSocket } from '@/lib/socket-client';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from './use-notifications';
import type { Notification, DirectMessagePayload } from '@/types';
import { toast } from 'sonner';

interface UseNotificationStreamOptions {
  studentId?: string | null;
  courseIds?: string[];
  enabled?: boolean;
  onNewNotification?: (notification: Notification) => void;
  onDirectMessage?: (payload: DirectMessagePayload) => void;
}

export function useNotificationStream({
  studentId,
  courseIds = [],
  enabled = true,
  onNewNotification,
  onDirectMessage,
}: UseNotificationStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const socket = createNamespaceSocket('/notifications');
    socketRef.current = socket;

    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);

      // 1. Join general cohort broadcast room
      socket.emit('joinCohort');

      // 2. Join personal user room if studentId is provided
      if (studentId) {
        socket.emit('joinUser', { studentId });
      }

      // 3. Join course-specific notification rooms
      if (courseIds && courseIds.length > 0) {
        courseIds.forEach((courseId) => {
          socket.emit('joinCourse', { courseId });
        });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setConnectionError(err.message || 'Failed to connect to notification service');
      setIsConnected(false);
    });

    // Handle new broadcast notification
    socket.on('notification:new', (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      if (notification.priority === 'urgent') {
        toast.error(`[URGENT] ${notification.title}`, {
          description: notification.message,
          duration: 10000,
        });
      } else {
        toast.info(notification.title, {
          description: notification.message,
        });
      }

      onNewNotification?.(notification);
    });

    // Handle updated announcement
    socket.on('notification:update', () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    // Handle deleted announcement
    socket.on('notification:delete', () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    // Handle targeted direct message to current student
    socket.on('notification:direct', (payload: DirectMessagePayload) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      toast.warning(`Direct Message: ${payload.title || 'Course Rep Alert'}`, {
        description: payload.message,
        duration: 8000,
      });

      onDirectMessage?.(payload);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('notification:new');
      socket.off('notification:update');
      socket.off('notification:delete');
      socket.off('notification:direct');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [studentId, JSON.stringify(courseIds), enabled, queryClient]);

  return {
    isConnected,
    connectionError,
    socket: socketRef.current,
  };
}
