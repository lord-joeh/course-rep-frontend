import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionCard } from '@/components/attendance/session-card';
import { InitializeSessionDialog } from '@/components/attendance/initialize-session-dialog';
import { ProjectorModal } from '@/components/attendance/projector-modal';
import { QRScannerDialog } from '@/components/attendance/qr-scanner-dialog';
import { SessionRosterSheet } from '@/components/attendance/session-roster-sheet';
import { apiClient } from '@/lib/api-client';
import type { AttendanceInstance } from '@/types';

// Mock Socket.io
vi.mock('@/lib/socket-client', () => ({
  createNamespaceSocket: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
  }),
}));

describe('Attendance Dialogs, Projector & Components', () => {
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

  const mockSession: AttendanceInstance = {
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

  describe('SessionCard', () => {
    it('renders course information, status badges, and action triggers', () => {
      const onLaunchProjector = vi.fn();
      const onViewRoster = vi.fn();
      const onCloseSession = vi.fn();
      const onDeleteSession = vi.fn();

      render(
        <SessionCard
          session={mockSession}
          onLaunchProjector={onLaunchProjector}
          onViewRoster={onViewRoster}
          onCloseSession={onCloseSession}
          onDeleteSession={onDeleteSession}
        />,
        { wrapper },
      );

      expect(screen.getByText('CPEN402')).toBeInTheDocument();
      expect(screen.getByText('Distributed Systems')).toBeInTheDocument();
      expect(screen.getByText('Active Session')).toBeInTheDocument();
      expect(screen.getByText('In-Person')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Projector/i }));
      expect(onLaunchProjector).toHaveBeenCalledWith(mockSession);

      fireEvent.click(screen.getByRole('button', { name: /Roster/i }));
      expect(onViewRoster).toHaveBeenCalledWith(mockSession);

      fireEvent.click(screen.getByTitle('Close Attendance Session'));
      expect(onCloseSession).toHaveBeenCalledWith(mockSession);

      fireEvent.click(screen.getByTitle('Delete Session'));
      expect(onDeleteSession).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('InitializeSessionDialog', () => {
    it('renders form inputs and validates required fields on empty submit', () => {
      render(
        <InitializeSessionDialog
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByRole('heading', { name: /Initialize Attendance Session/i })).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: /Start Attendance Session/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Please select a course/i)).toBeInTheDocument();
    });

    it('toggles to Online class type and clears coordinate requirements', () => {
      render(
        <InitializeSessionDialog
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      const onlineBtn = screen.getByRole('button', { name: /Online \/ Remote/i });
      fireEvent.click(onlineBtn);

      expect(screen.queryByText(/Classroom Geofence Center Coordinates/i)).not.toBeInTheDocument();
    });
  });

  describe('ProjectorModal', () => {
    it('renders classroom projection screen with dynamic QR code and controls', () => {
      render(
        <ProjectorModal
          session={mockSession}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByRole('heading', { name: /CPEN402 — Classroom Attendance Projector/i })).toBeInTheDocument();
      expect(screen.getByAltText(/Rotating Attendance QR Code/i)).toBeInTheDocument();
      expect(screen.getByText(/Next token refresh in:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Fullscreen/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Close Session/i })).toBeInTheDocument();
    });
  });

  describe('QRScannerDialog (Strictly Camera-Driven)', () => {
    it('renders camera viewport and asserts zero manual token text inputs', () => {
      // Mock getUserMedia
      const mockMediaStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
        },
        configurable: true,
      });

      render(
        <QRScannerDialog
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByRole('heading', { name: /Scan Classroom QR Code/i })).toBeInTheDocument();

      // STRICT CHECK: Verify camera feed is present
      expect(screen.getByTestId('camera-video-feed')).toBeInTheDocument();

      // STRICT CHECK: Verify NO manual text input exists (anti-spoofing rule)
      const textInputs = screen.queryAllByRole('textbox');
      expect(textInputs).toHaveLength(0);
    });

    it('handles simulated scan detection and triggers attendance check-in', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            success: true,
            message: 'Attendance verified and marked successfully',
            attendance: { id: 'rec-10', status: 'present' },
            presentCount: 28,
          },
        },
      });

      render(
        <QRScannerDialog
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      const testScanBtn = screen.getByTestId('test-scan-button');
      fireEvent.click(testScanBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith(
          '/attendance/mark',
          expect.objectContaining({ token: 'mock-qr-jwt-token-attendance' }),
        );
      });
    });
  });

  describe('SessionRosterSheet', () => {
    it('renders enrolled students, summary stats, and allows 1-click status override', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            instance: mockSession,
            stats: {
              totalEnrolled: 2,
              presentCount: 1,
              absentCount: 1,
              excusedCount: 0,
            },
            attendees: {
              items: [
                {
                  id: 'att-1',
                  instanceId: mockSession.id,
                  courseId: 'CPEN402',
                  date: '2026-11-04T10:02:00.000Z',
                  studentId: '10928374',
                  status: 'present',
                  student: {
                    id: 'std-1',
                    name: 'Alice Turing',
                    indexNumber: '10928374',
                  },
                },
                {
                  id: 'att-2',
                  instanceId: mockSession.id,
                  courseId: 'CPEN402',
                  date: '2026-11-04T10:00:00.000Z',
                  studentId: '10928375',
                  status: 'absent',
                  student: {
                    id: 'std-2',
                    name: 'Bob Shannon',
                    indexNumber: '10928375',
                  },
                },
              ],
              meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
            },
          },
        },
      });

      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: 'att-2', status: 'present' },
        },
      });

      render(
        <SessionRosterSheet
          session={mockSession}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByRole('heading', { name: /CPEN402 — Attendance Roster/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Alice Turing')).toBeInTheDocument();
        expect(screen.getByText('Bob Shannon')).toBeInTheDocument();
      });

      // Override Bob Shannon from absent to present
      const markPresentBtns = screen.getAllByTitle('Mark student Present');
      const activePresentBtn = markPresentBtns.find((btn) => !btn.hasAttribute('disabled'));
      expect(activePresentBtn).toBeDefined();
      fireEvent.click(activePresentBtn!);

      await waitFor(() => {
        expect(putSpy).toHaveBeenCalledWith('/attendance/attendee', {
          attendanceId: 'att-2',
          status: 'present',
        });
      });
    });
  });
});
