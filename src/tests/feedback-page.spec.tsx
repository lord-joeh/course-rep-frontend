import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedbackPage } from '@/pages/feedback/feedback-page';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import type { Feedback, StudentProfile } from '@/types';

describe('FeedbackPage Component', () => {
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

  const mockFeedbacks: Feedback[] = [
    {
      id: 'fb-101',
      title: 'Lab projector flickering constantly',
      description: 'The projector in Lab 3 keeps flickering during lectures, making code unreadable.',
      category: 'facility',
      priority: 'high',
      status: 'submitted',
      isAnonymous: false,
      studentId: 'std-002',
      courseId: 'CPEN305',
      repResponse: null,
      resolvedAt: null,
      createdAt: '2026-11-04T12:00:00.000Z',
      updatedAt: '2026-11-04T12:00:00.000Z',
      student: { id: 'std-002', name: 'Regular Student', email: 'student@university.edu' },
      course: { id: 'CPEN305', code: 'CPEN305', name: 'Operating Systems' },
    },
    {
      id: 'fb-102',
      title: 'Midterm schedule conflict',
      description: 'Two core exams are scheduled on the same morning at 9:00 AM.',
      category: 'schedule',
      priority: 'critical',
      status: 'under_review',
      isAnonymous: true,
      studentId: null,
      courseId: null,
      repResponse: 'We have contacted the exam coordinator to reschedule.',
      resolvedAt: null,
      createdAt: '2026-11-04T10:00:00.000Z',
      updatedAt: '2026-11-04T11:00:00.000Z',
      student: { name: 'Anonymous Student' },
      course: null,
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
        <FeedbackPage />
      </QueryClientProvider>,
    );

  it('renders Rep view with triage KPI cards, filter controls, and feedback cards', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'token-rep' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/courses')) {
        return { data: { success: true, data: { items: [{ id: 'CPEN305', code: 'CPEN 305', name: 'Operating Systems' }] } } };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockFeedbacks,
            meta: { page: 1, limit: 12, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    // Rep Page Title
    expect(screen.getByText('Cohort Feedback Box')).toBeInTheDocument();
    expect(screen.getByText(/Triage student feedback/i)).toBeInTheDocument();

    // Rep KPI Metrics Cards
    await waitFor(() => {
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
      expect(screen.getByText('Pending Triage')).toBeInTheDocument();
      expect(screen.getByText('Under Investigation')).toBeInTheDocument();
      expect(screen.getAllByText('Resolved').length).toBeGreaterThanOrEqual(1);
    });

    // Feedback items rendered once query settles
    await waitFor(() => {
      expect(screen.getByText('Lab projector flickering constantly')).toBeInTheDocument();
      expect(screen.getByText('Midterm schedule conflict')).toBeInTheDocument();
      expect(screen.getByText('Anonymous Student')).toBeInTheDocument();
    });
  });

  it('renders regular student view with submission tabs and Submit Feedback CTA', async () => {
    authStore.setSession(mockStudentUser, { accessToken: 'token-student' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/courses')) {
        return { data: { success: true, data: { items: [] } } };
      }
      if (url.includes('/my-feedback')) {
        return {
          data: {
            success: true,
            data: {
              items: [mockFeedbacks[0]],
              meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
            },
          },
        };
      }
      return {
        data: {
          success: true,
          data: {
            items: mockFeedbacks,
            meta: { page: 1, limit: 12, total: 2, totalPages: 1 },
          },
        },
      };
    });

    renderWithProviders();

    // Student Page Title
    expect(screen.getByText('Student Feedback & Suggestions')).toBeInTheDocument();
    expect(screen.getByText(/Voice questions, complaints, and constructive ideas/i)).toBeInTheDocument();

    // Student Tabs
    expect(screen.getByRole('button', { name: /My Submissions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cohort Suggestions Board/i })).toBeInTheDocument();

    // Only personal submission shown in My Submissions tab
    await waitFor(() => {
      expect(screen.getByText('Lab projector flickering constantly')).toBeInTheDocument();
      expect(screen.queryByText('Midterm schedule conflict')).not.toBeInTheDocument();
    });

    // Switch to Cohort Suggestions Board tab
    fireEvent.click(screen.getByRole('button', { name: /Cohort Suggestions Board/i }));

    await waitFor(() => {
      expect(screen.getByText('Midterm schedule conflict')).toBeInTheDocument();
    });
  });

  it('toggles table view mode cleanly', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'token-rep' });

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          items: mockFeedbacks,
          meta: { page: 1, limit: 12, total: 2, totalPages: 1 },
        },
      },
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Lab projector flickering constantly')).toBeInTheDocument();
    });

    // Toggle Table View
    const tableToggleBtn = screen.getByRole('button', { name: /Table view/i });
    fireEvent.click(tableToggleBtn);

    // Table header should be rendered
    await waitFor(() => {
      expect(screen.getByText('Subject & Content')).toBeInTheDocument();
      expect(screen.getByText('Author')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('opens submit feedback dialog when clicking button', async () => {
    authStore.setSession(mockStudentUser, { accessToken: 'token-student' });

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [],
          meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
        },
      },
    });

    renderWithProviders();

    const submitBtns = screen.getAllByRole('button', { name: /Submit Feedback/i });
    fireEvent.click(submitBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Submit Feedback or Suggestion')).toBeInTheDocument();
      expect(screen.getByText(/Voice questions, complaints, or constructive suggestions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subject \/ Title/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no feedbacks are returned', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'token-rep' });

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [],
          meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
        },
      },
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('No feedback found')).toBeInTheDocument();
    });
  });
});

