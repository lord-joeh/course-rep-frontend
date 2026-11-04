import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { StudentDashboardPage } from '@/pages/students/student-dashboard-page';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import type { StudentProfile } from '@/types';

describe('StudentDashboardPage Component', () => {
  let queryClient: QueryClient;

  const mockStudentUser: StudentProfile = {
    id: 'std-002',
    email: 'alex.student@university.edu',
    name: 'Alex Student',
    studentId: 'STD002',
    isRep: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
    authStore.clearSession();
    authStore.setSession(mockStudentUser, { accessToken: 'token-student' });
  });

  const renderWithProviders = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <StudentDashboardPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  it('renders student welcome greeting, metrics ribbon, quick actions, and course cards', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/courses')) {
        return {
          data: {
            success: true,
            data: {
              items: [
                { id: 'cpen305', code: 'CPEN 305', name: 'Operating Systems' },
                { id: 'seng301', code: 'SENG 301', name: 'Software Architecture' },
              ],
              meta: { total: 2 },
            },
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
                  title: 'Architecture Diagram Report',
                  dueDate: '2026-11-20T23:59:59.000Z',
                  totalPoints: 15,
                },
              ],
              meta: { total: 1 },
            },
          },
        };
      }
      if (url.includes('/unread-count')) {
        return { data: { success: true, data: { unreadCount: 3 } } };
      }
      if (url.includes('/notifications')) {
        return {
          data: {
            success: true,
            data: {
              items: [
                {
                  id: 'notif-1',
                  title: 'Assignment Deadline Extended',
                  message: 'Due date moved by 48 hours.',
                  priority: 'normal',
                },
              ],
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
                title: 'Software Architecture Lecture',
                location: 'Hall C',
                startTime: '2026-11-04T16:00:00.000Z',
              },
            ],
          },
        };
      }
      if (url.includes('/attendance/my-records')) {
        return {
          data: {
            success: true,
            data: {
              items: [{ id: 'rec-1', status: 'present' }, { id: 'rec-2', status: 'present' }],
              meta: { total: 2 },
            },
          },
        };
      }
      return { data: { success: true, data: { items: [], meta: { total: 0 } } } };
    });

    renderWithProviders();

    // Welcome Header
    expect(screen.getByText(/Welcome back, Alex Student/i)).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();

    // Student Metrics Ribbon
    await waitFor(() => {
      expect(screen.getByText('My Courses')).toBeInTheDocument();
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // enrolled & attended counts
      expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 assignment
      expect(screen.getByText('Unread Notices')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 unread
      expect(screen.getByText('Attended Sessions')).toBeInTheDocument();
    });

    // Student Quick Actions
    expect(screen.getByText('Scan Attendance')).toBeInTheDocument();
    expect(screen.getByText('Voice Feedback')).toBeInTheDocument();
    expect(screen.getByText('Course Slides')).toBeInTheDocument();

    // Widget Cards
    await waitFor(() => {
      expect(screen.getByText('Software Architecture Lecture')).toBeInTheDocument();
      expect(screen.getByText('Architecture Diagram Report')).toBeInTheDocument();
      expect(screen.getByText('Assignment Deadline Extended')).toBeInTheDocument();
    });

    // Enrolled Courses Quick Card
    expect(screen.getByText('Operating Systems')).toBeInTheDocument();
    expect(screen.getByText('Software Architecture')).toBeInTheDocument();
  });

  it('triggers Voice Feedback modal on button click', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: { items: [], meta: { total: 0 } } },
    });

    renderWithProviders();

    const voiceFeedbackBtn = screen.getByText('Voice Feedback');
    fireEvent.click(voiceFeedbackBtn);

    await waitFor(() => {
      expect(screen.getByText('Submit Feedback or Suggestion')).toBeInTheDocument();
    });
  });
});

