import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationsPage } from '@/pages/notifications/notifications-page';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import type { Notification, StudentProfile } from '@/types';

// Mock the real-time stream hook to prevent actual WebSocket connections in tests
vi.mock('@/hooks/use-notification-stream', () => ({
  useNotificationStream: () => ({
    isConnected: true,
    lastEvent: null,
  }),
}));

describe('NotificationsPage', () => {
  let queryClient: QueryClient;

  const mockRepUser: StudentProfile = {
    id: 'rep-001',
    email: 'rep@university.edu',
    name: 'Chief Course Rep',
    studentId: 'REP001',
    isRep: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const mockStudentUser: StudentProfile = {
    id: 'std-002',
    email: 'student@university.edu',
    name: 'Regular Student',
    studentId: 'STD002',
    isRep: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const mockNotifications: Notification[] = [
    {
      id: 'notif-101',
      title: 'Urgent: Room Change for CPEN 305',
      message: 'The lecture will now take place in Hall B.',
      type: 'academic',
      priority: 'urgent',
      courseId: 'CPEN305',
      course: { id: 'CPEN305', name: 'Operating Systems' },
      targetType: 'cohort',
      targetId: 'all',
      isRead: false,
      createdAt: '2026-11-04T12:00:00.000Z',
      sender: { id: 'rep-001', name: 'Chief Rep' },
    },
    {
      id: 'notif-102',
      title: 'Assignment 2 Reminder',
      message: 'Please submit your lab report before midnight.',
      type: 'deadline',
      priority: 'high',
      courseId: null,
      course: null,
      targetType: 'individual',
      targetId: 'std-002',
      isRead: true,
      createdAt: '2026-11-04T10:00:00.000Z',
      sender: { id: 'rep-001', name: 'Chief Rep' },
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
    authStore.clearSession();
  });

  const renderWithProviders = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>,
    );

  it('renders page title, unread count badge, and Live WebSocket indicator', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'token-123' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/unread-count')) {
        return { data: { success: true, data: { unreadCount: 1 } } };
      }
      if (url.includes('/courses')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      if (url.includes('/students')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockNotifications,
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    expect(screen.getByText('Announcements & Notifications')).toBeInTheDocument();
    expect(screen.getByText(/Live Socket Connection/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Urgent: Room Change for CPEN 305')).toBeInTheDocument();
      expect(screen.getByText('Assignment 2 Reminder')).toBeInTheDocument();
    });
  });

  it('renders "Broadcast Announcement" and "Direct Alert" action buttons for Course Reps', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'token-123' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/unread-count')) {
        return { data: { success: true, data: { unreadCount: 1 } } };
      }
      if (url.includes('/courses')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      if (url.includes('/students')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockNotifications,
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    expect(screen.getByRole('button', { name: /broadcast announcement/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /direct alert/i })).toBeInTheDocument();
  });

  it('does NOT render "Broadcast Announcement" or "Direct Alert" action buttons for students', async () => {
    authStore.setSession(mockStudentUser, { accessToken: 'token-123' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/unread-count')) {
        return { data: { success: true, data: { unreadCount: 1 } } };
      }
      if (url.includes('/courses')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      if (url.includes('/students')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockNotifications,
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    expect(screen.queryByRole('button', { name: /broadcast announcement/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /direct alert/i })).not.toBeInTheDocument();
  });

  it('filters notifications when typing in the search input', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'token-123' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/unread-count')) {
        return { data: { success: true, data: { unreadCount: 1 } } };
      }
      if (url.includes('/courses')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      if (url.includes('/students')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockNotifications,
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Urgent: Room Change for CPEN 305')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by title/i);
    fireEvent.change(searchInput, { target: { value: 'Reminder' } });

    await waitFor(() => {
      expect(screen.queryByText('Urgent: Room Change for CPEN 305')).not.toBeInTheDocument();
      expect(screen.getByText('Assignment 2 Reminder')).toBeInTheDocument();
    });
  });

  it('filters notifications by read status', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'token-123' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/unread-count')) {
        return { data: { success: true, data: { unreadCount: 1 } } };
      }
      if (url.includes('/courses')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      if (url.includes('/students')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockNotifications,
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Urgent: Room Change for CPEN 305')).toBeInTheDocument();
    });

    // Click "Unread" filter
    const unreadTab = screen.getByRole('button', { name: /^unread/i });
    fireEvent.click(unreadTab);

    await waitFor(() => {
      expect(screen.getByText('Urgent: Room Change for CPEN 305')).toBeInTheDocument();
      expect(screen.queryByText('Assignment 2 Reminder')).not.toBeInTheDocument();
    });
  });

  it('calls PATCH /notifications/read-all when "Mark all as read" is clicked', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'token-123' });

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { message: 'All marked read' } });
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/unread-count')) {
        return { data: { success: true, data: { unreadCount: 1 } } };
      }
      if (url.includes('/courses')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      if (url.includes('/students')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockNotifications,
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Urgent: Room Change for CPEN 305')).toBeInTheDocument();
    });

    const markAllBtn = await screen.findByRole('button', { name: /mark all as read/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith('/notifications/read-all');
    });
  });

  it('displays empty state when no notifications match filter criteria', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'token-123' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/unread-count')) {
        return { data: { success: true, data: { unreadCount: 0 } } };
      }
      if (url.includes('/courses')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      if (url.includes('/students')) {
        return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      }
      return {
        data: {
          success: true,
          data: {
            items: [],
            meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
          },
        },
      };
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('No announcements found')).toBeInTheDocument();
    });
  });
});
