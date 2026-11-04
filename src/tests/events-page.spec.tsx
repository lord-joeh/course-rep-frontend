import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventsPage } from '@/pages/events/events-page';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import type { Event, AuthenticatedUser } from '@/types';

describe('EventsPage', () => {
  let queryClient: QueryClient;

  const mockRepUser: AuthenticatedUser = {
    id: 'rep-001',
    email: 'rep@university.edu',
    name: 'Chief Course Rep',
    isRep: true,
  };

  const mockStudentUser: AuthenticatedUser = {
    id: 'std-002',
    email: 'student@university.edu',
    name: 'Regular Student',
    isRep: false,
  };

  const mockEvent: Event = {
    id: 'evt-201',
    title: 'Operating Systems Midterm',
    description: 'Covers virtual memory and processes',
    eventType: 'exam',
    courseId: 'CPEN305',
    course: { id: 'CPEN305', name: 'Operating Systems' },
    startDate: '2026-11-20T09:00:00.000Z',
    endDate: '2026-11-20T11:00:00.000Z',
    venue: 'Great Hall',
    meetingLink: null,
    isCancelled: false,
    isRecurring: false,
    recurrenceFrequency: null,
    recurrenceInterval: 1,
    recurrenceDaysOfWeek: null,
    recurrenceEndDate: null,
    recurrenceCount: null,
    recurrenceSeriesId: null,
    createdAt: '2026-11-04T08:00:00.000Z',
    updatedAt: '2026-11-04T08:00:00.000Z',
  };

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
        <EventsPage />
      </QueryClientProvider>,
    );

  it('renders page header and schedule button for Course Rep', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'tok', refreshToken: 'tok' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/events/upcoming')) {
        return { data: { success: true, statusCode: 200, data: [mockEvent] } };
      }
      if (url.includes('/events')) {
        return {
          data: {
            success: true,
            statusCode: 200,
            data: { items: [mockEvent], meta: { total: 1, page: 1, limit: 100 } },
          },
        };
      }
      return { data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } } };
    });

    renderWithProviders();

    expect(screen.getByText(/Academic Calendar & Timetable/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Schedule Event/i })).toBeInTheDocument();
    });
  });

  it('does not render Schedule Event button for regular student', async () => {
    authStore.setSession(mockStudentUser, { accessToken: 'tok', refreshToken: 'tok' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/events/upcoming')) {
        return { data: { success: true, statusCode: 200, data: [] } };
      }
      if (url.includes('/events')) {
        return {
          data: {
            success: true,
            statusCode: 200,
            data: { items: [mockEvent], meta: { total: 1, page: 1, limit: 100 } },
          },
        };
      }
      return { data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } } };
    });

    renderWithProviders();

    expect(screen.getByText(/Academic Calendar & Timetable/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Schedule Event/i })).toBeNull();
  });

  it('toggles between Calendar Grid and Agenda Timeline views', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'tok', refreshToken: 'tok' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/events/upcoming')) {
        return { data: { success: true, statusCode: 200, data: [mockEvent] } };
      }
      if (url.includes('/events')) {
        return {
          data: {
            success: true,
            statusCode: 200,
            data: { items: [mockEvent], meta: { total: 1, page: 1, limit: 100 } },
          },
        };
      }
      return { data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } } };
    });

    renderWithProviders();

    // Default is Calendar Grid
    await waitFor(() => {
      expect(screen.getByTestId('calendar-month-view')).toBeInTheDocument();
    });

    // Switch to Agenda Timeline
    const agendaBtn = screen.getByRole('button', { name: /Agenda Timeline/i });
    fireEvent.click(agendaBtn);

    await waitFor(() => {
      expect(screen.getByTestId('agenda-timeline-view')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Operating Systems Midterm').length).toBeGreaterThanOrEqual(1);
  });

  it('filters events when search input or type pills are clicked', async () => {
    authStore.setSession(mockRepUser, { accessToken: 'tok', refreshToken: 'tok' });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/events/upcoming')) {
        return { data: { success: true, statusCode: 200, data: [] } };
      }
      if (url.includes('/events')) {
        return {
          data: {
            success: true,
            statusCode: 200,
            data: { items: [mockEvent], meta: { total: 1, page: 1, limit: 100 } },
          },
        };
      }
      return { data: { success: true, statusCode: 200, data: { items: [], meta: { total: 0 } } } };
    });

    renderWithProviders();

    const searchInput = screen.getByPlaceholderText(/Search by title, course, or venue/i);
    fireEvent.change(searchInput, { target: { value: 'Nonexistent event' } });

    await waitFor(() => {
      expect(screen.getByText(/No events found/i)).toBeInTheDocument();
    });
  });
});
