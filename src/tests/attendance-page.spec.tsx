import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AttendancePage } from '@/pages/attendance/attendance-page';
import { apiClient } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';
import type { AttendanceInstance, AttendanceRecord } from '@/types';

// Mock Socket.io
vi.mock('@/lib/socket-client', () => ({
  createNamespaceSocket: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }),
}));

describe('AttendancePage', () => {
  let queryClient: QueryClient;

  const mockInstance: AttendanceInstance = {
    id: 'session-cpen402',
    courseId: 'CPEN402',
    date: '2026-11-04T10:00:00.000Z',
    qrToken: 'mock-token-xyz',
    qrImage: 'data:image/png;base64,mockqrimage',
    expiresAt: '2026-11-04T11:00:00.000Z',
    latitude: 5.6037,
    longitude: -0.1870,
    classType: 'in-person',
    isClose: false,
    createdAt: '2026-11-04T09:59:00.000Z',
    updatedAt: '2026-11-04T09:59:00.000Z',
    course: {
      id: 'CPEN402',
      name: 'Distributed Systems',
      code: 'CPEN402',
      creditHours: 3,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  };

  const mockRecord: AttendanceRecord = {
    id: 'rec-1',
    instanceId: 'session-cpen402',
    courseId: 'CPEN402',
    date: '2026-11-04T10:02:00.000Z',
    studentId: '10928374',
    status: 'present',
    createdAt: '2026-11-04T10:02:00.000Z',
    updatedAt: '2026-11-04T10:02:00.000Z',
    course: {
      id: 'CPEN402',
      name: 'Distributed Systems',
      code: 'CPEN402',
      creditHours: 3,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.startsWith('/attendance/instances')) {
        return {
          data: {
            success: true,
            data: {
              items: [mockInstance],
              meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
            },
          },
        };
      }
      if (url.startsWith('/attendance/my-records')) {
        return {
          data: {
            success: true,
            data: {
              items: [mockRecord],
              meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
            },
          },
        };
      }
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: {
              items: [mockInstance.course],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        };
      }
      return { data: { success: true, data: { items: [], meta: {} } } };
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders Course Rep view with Initialize Session button and filter pills', async () => {
    authStore.setSession(
      {
        id: 'rep-user-1',
        name: 'Alex Rep',
        email: 'rep@ug.edu.gh',
        isRep: true,
      },
      { accessToken: 'token-rep' },
    );

    render(<AttendancePage />, { wrapper });

    expect(screen.getByText('Classroom Attendance Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Initialize Session/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('CPEN402')).toBeInTheDocument();
      expect(screen.getByText('Distributed Systems')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /All \(1\)/i })).toBeInTheDocument();
    });
  });

  it('toggles between Grid and Table views for Course Rep', async () => {
    authStore.setSession(
      {
        id: 'rep-user-1',
        name: 'Alex Rep',
        email: 'rep@ug.edu.gh',
        isRep: true,
      },
      { accessToken: 'token-rep' },
    );

    render(<AttendancePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('CPEN402')).toBeInTheDocument();
    });

    // Switch to Table view
    const tableBtn = screen.getByTitle('Table View');
    fireEvent.click(tableBtn);

    expect(screen.getByRole('columnheader', { name: /Class Type/i })).toBeInTheDocument();
  });

  it('renders Student view with personal metrics, Scan QR button, and attendance history', async () => {
    authStore.setSession(
      {
        id: 'student-user-1',
        name: 'Grace Hopper',
        email: 'ghopper@ug.edu.gh',
        isRep: false,
      },
      { accessToken: 'token-student' },
    );

    render(<AttendancePage />, { wrapper });

    expect(screen.getByText('My Attendance Portal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scan Classroom QR/i })).toBeInTheDocument();

    // Summary Metric Cards
    expect(screen.getByText('Attendance Rate')).toBeInTheDocument();
    expect(screen.getByText('Classes Attended')).toBeInTheDocument();
    expect(screen.getByText('Missed Lectures')).toBeInTheDocument();
    expect(screen.getByText('Excused Absences')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Course Attendance History')).toBeInTheDocument();
      expect(screen.getByText('Total Recorded Lectures: 1')).toBeInTheDocument();
    });
  });

  it('allows Course Rep to toggle between Classroom Sessions and My Personal Attendance', async () => {
    authStore.setSession(
      {
        id: 'rep-user-1',
        name: 'Alex Rep',
        email: 'rep@ug.edu.gh',
        isRep: true,
      },
      { accessToken: 'token-rep' },
    );

    render(<AttendancePage />, { wrapper });

    // Initial Rep View
    expect(screen.getByRole('button', { name: /Classroom Sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /My Personal Attendance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Initialize Session/i })).toBeInTheDocument();

    // Toggle to Personal Attendance
    const personalTab = screen.getByRole('button', { name: /My Personal Attendance/i });
    fireEvent.click(personalTab);

    // Should switch to student portal view
    expect(screen.getByText('My Attendance Portal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scan Classroom QR/i })).toBeInTheDocument();
    expect(screen.getByText('Attendance Rate')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Course Attendance History')).toBeInTheDocument();
    });
  });
});
