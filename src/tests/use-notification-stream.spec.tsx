import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotificationStream } from '@/hooks/use-notification-stream';
import type { Notification, DirectMessagePayload } from '@/types';

// Mock Socket instance and listeners map
const listeners: Record<string, ((...args: any[]) => void)[]> = {};

const mockSocket = {
  id: 'mock-socket-notif',
  connected: false,
  connect: vi.fn().mockImplementation(() => {
    mockSocket.connected = true;
    (listeners['connect'] || []).forEach((cb) => cb());
  }),
  disconnect: vi.fn().mockImplementation(() => {
    mockSocket.connected = false;
    (listeners['disconnect'] || []).forEach((cb) => cb('io client disconnect'));
  }),
  emit: vi.fn(),
  on: vi.fn().mockImplementation((event: string, callback: (...args: any[]) => void) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return mockSocket;
  }),
  off: vi.fn().mockImplementation((event: string) => {
    delete listeners[event];
    return mockSocket;
  }),
};

vi.mock('@/lib/socket-client', () => ({
  createNamespaceSocket: vi.fn(() => mockSocket),
  getSocketBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));

describe('useNotificationStream', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.clearAllMocks();
    Object.keys(listeners).forEach((k) => delete listeners[k]);
    mockSocket.connected = false;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('connects to notification namespace and joins cohort, user, and course rooms', () => {
    const { result } = renderHook(
      () =>
        useNotificationStream({
          studentId: 'std-888',
          courseIds: ['CPEN404', 'CPEN402'],
        }),
      { wrapper },
    );

    expect(mockSocket.connect).toHaveBeenCalled();

    act(() => {
      (listeners['connect'] || []).forEach((cb) => cb());
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('joinCohort');
    expect(mockSocket.emit).toHaveBeenCalledWith('joinUser', { studentId: 'std-888' });
    expect(mockSocket.emit).toHaveBeenCalledWith('joinCourse', { courseId: 'CPEN404' });
    expect(mockSocket.emit).toHaveBeenCalledWith('joinCourse', { courseId: 'CPEN402' });
    expect(result.current.isConnected).toBe(true);
  });

  it('handles incoming notification:new events and fires callback', () => {
    const onNewNotification = vi.fn();

    renderHook(
      () =>
        useNotificationStream({
          studentId: 'std-888',
          onNewNotification,
        }),
      { wrapper },
    );

    act(() => {
      (listeners['connect'] || []).forEach((cb) => cb());
    });

    const mockNotif: Notification = {
      id: 'notif-100',
      title: 'New Class Material Available',
      message: 'Week 5 slides uploaded to Drive Vault.',
      type: 'announcement',
      priority: 'normal',
      senderId: 'rep-01',
      courseId: null,
      isRead: false,
      createdAt: '2026-11-04T12:00:00.000Z',
      updatedAt: '2026-11-04T12:00:00.000Z',
    };

    act(() => {
      (listeners['notification:new'] || []).forEach((cb) => cb(mockNotif));
    });

    expect(onNewNotification).toHaveBeenCalledWith(mockNotif);
  });

  it('handles incoming notification:direct messages and fires callback', () => {
    const onDirectMessage = vi.fn();

    renderHook(
      () =>
        useNotificationStream({
          studentId: 'std-888',
          onDirectMessage,
        }),
      { wrapper },
    );

    act(() => {
      (listeners['connect'] || []).forEach((cb) => cb());
    });

    const directPayload: DirectMessagePayload = {
      title: 'Attendance Warning',
      message: 'You have missed 2 lectures in CPEN402.',
      messageType: 'in_app',
      senderId: 'rep-01',
      sentAt: new Date(),
    };

    act(() => {
      (listeners['notification:direct'] || []).forEach((cb) => cb(directPayload));
    });

    expect(onDirectMessage).toHaveBeenCalledWith(directPayload);
  });

  it('cleans up event listeners and disconnects on unmount', () => {
    const { unmount } = renderHook(() => useNotificationStream(), { wrapper });

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('notification:new');
    expect(mockSocket.off).toHaveBeenCalledWith('notification:direct');
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
