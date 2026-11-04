import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { RepDashboardPage } from '@/pages/reps/rep-dashboard-page';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import type { StudentProfile } from '@/types';

describe('RepDashboardPage Component', () => {
  let queryClient: QueryClient;

  const mockRepUser: StudentProfile = {
    id: 'rep-001',
    email: 'chief.rep@university.edu',
    name: 'Chief Representative',
    studentId: 'REP001',
    isRep: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
    authStore.clearSession();
    authStore.setSession(mockRepUser, { accessToken: 'token-rep' });
  });

  const renderWithProviders = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RepDashboardPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  it('renders welcome greeting, cohort metrics ribbon, quick actions, and widget cards', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/students')) {
        return { data: { success: true, data: { items: [], meta: { total: 115 } } } };
      }
      if (url.includes('/courses')) {
        return {
          data: {
            success: true,
            data: {
              items: [{ id: 'cpen305', code: 'CPEN 305', name: 'Operating Systems' }],
              meta: { total: 8 },
            },
          },
        };
      }
      if (url.includes('/feedback')) {
        return { data: { success: true, data: { items: [], meta: { total: 4 } } } };
      }
      if (url.includes('/attendance/instances')) {
        return {
          data: {
            success: true,
            data: {
              items: [
                {
                  id: 'sess-1',
                  courseId: 'cpen305',
                  isClose: false,
                  expiresAt: new Date(Date.now() + 3600000).toISOString(),
                  createdAt: '2026-01-01',
                },
              ],
              meta: { total: 1 },
            },
          },
        };
      }
      if (url.includes('/events/upcoming')) {
        return {
          data: {
            success: true,
            data: [
              {
                id: 'evt-1',
                title: 'Operating Systems Lecture',
                course: { id: 'CPEN 305', name: 'Operating Systems' },
                venue: 'Hall B',
                startDate: '2026-11-04T14:00:00.000Z',
                endDate: '2026-11-04T16:00:00.000Z',
              },
            ],
          },
        };
      }
      if (url.includes('/assignments')) {
        return {
          data: {
            success: true,
            data: {
              items: [
                {
                  id: 'asgn-1',
                  title: 'Lab 2 Submission',
                  deadline: '2026-11-15T23:59:59.000Z',
                  submissionCount: 10,
                },
              ],
            },
          },
        };
      }
      if (url.includes('/notifications')) {
        return {
          data: {
            success: true,
            data: {
              items: [
                {
                  id: 'notif-1',
                  title: 'Midterm Room Notice',
                  message: 'Hall B is reserved.',
                  priority: 'normal',
                },
              ],
            },
          },
        };
      }
      if (url.includes('/admin/queues/stats')) {
        return {
          data: {
            stats: {
              email: { completed: 45 },
              sms: { completed: 30 },
              'drive-sync': { completed: 12 },
              attendance: { completed: 88 },
            },
          },
        };
      }
      return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
    });

    renderWithProviders();

    // Welcome Header
    expect(screen.getByText(/Welcome back, Chief Representative/i)).toBeInTheDocument();
    expect(screen.getByText('Course Rep')).toBeInTheDocument();

    // Metrics Ribbon
    await waitFor(() => {
      expect(screen.getByText('Cohort Students')).toBeInTheDocument();
      expect(screen.getByText('115')).toBeInTheDocument();
      expect(screen.getByText('Active Courses')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Feedback Pending')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Active QR Sessions')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Quick Actions
    expect(screen.getByText('Start QR Session')).toBeInTheDocument();
    expect(screen.getByText('Broadcast Notice')).toBeInTheDocument();
    expect(screen.getByText('Schedule Class')).toBeInTheDocument();

    // Widget Cards
    await waitFor(() => {
      expect(screen.getByText('Operating Systems Lecture')).toBeInTheDocument();
      expect(screen.getByText('Lab 2 Submission')).toBeInTheDocument();
      expect(screen.getByText('Midterm Room Notice')).toBeInTheDocument();
    });

    // Bull-Board Console Button
    expect(screen.getAllByText('Bull-Board Console').length).toBeGreaterThanOrEqual(1);
  });

  it('triggers Start QR Session modal on button click', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: { items: [], meta: { total: 0 } } },
    });

    renderWithProviders();

    const startSessionBtn = screen.getByText('Start QR Session');
    fireEvent.click(startSessionBtn);

    await waitFor(() => {
      expect(screen.getByText('Initialize Attendance Session')).toBeInTheDocument();
    });
  });

  it('triggers Broadcast Notice modal on button click', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: { items: [], meta: { total: 0 } } },
    });

    renderWithProviders();

    const broadcastBtn = screen.getByText('Broadcast Notice');
    fireEvent.click(broadcastBtn);

    await waitFor(() => {
      expect(screen.getByText('Broadcast Announcement')).toBeInTheDocument();
    });
  });
});

