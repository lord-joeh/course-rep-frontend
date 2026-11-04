import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAttendanceInstancesQuery,
  useAttendanceInstanceDetailQuery,
  useMyAttendanceRecordsQuery,
  useInitializeAttendanceMutation,
  useCloseAttendanceMutation,
  useMarkAttendanceMutation,
  useManualMarkAttendeeMutation,
  useDeleteAttendanceInstanceMutation,
  useDeleteAttendanceRecordMutation,
} from '@/hooks/use-attendance';
import { apiClient } from '@/lib/api-client';
import type {
  AttendanceInstance,
  AttendanceRecord,
  AttendanceDetailResponse,
  MarkAttendanceResponse,
} from '@/types';

describe('use-attendance hooks', () => {
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

  const mockInstance: AttendanceInstance = {
    id: 'att-session-1',
    courseId: 'CPEN402',
    date: '2026-11-04T10:00:00.000Z',
    qrToken: 'jwt-rotating-token-1',
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
    instanceId: 'att-session-1',
    courseId: 'CPEN402',
    date: '2026-11-04T10:05:00.000Z',
    studentId: '10928374',
    status: 'present',
    createdAt: '2026-11-04T10:05:00.000Z',
    updatedAt: '2026-11-04T10:05:00.000Z',
    student: {
      id: 'student-uuid-1',
      indexNumber: '10928374',
      name: 'Grace Hopper',
      email: 'ghopper@ug.edu.gh',
      isRep: false,
    },
  };

  it('useAttendanceInstancesQuery fetches paginated sessions for Course Rep', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [mockInstance],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    });

    const { result } = renderHook(() => useAttendanceInstancesQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].courseId).toBe('CPEN402');
  });

  it('useAttendanceInstanceDetailQuery fetches session stats and attendee roster', async () => {
    const detailResponse: AttendanceDetailResponse = {
      instance: mockInstance,
      stats: {
        totalEnrolled: 40,
        presentCount: 25,
        absentCount: 12,
        excusedCount: 3,
      },
      attendees: {
        items: [mockRecord],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    };

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: detailResponse },
    });

    const { result } = renderHook(
      () => useAttendanceInstanceDetailQuery('att-session-1'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.stats.presentCount).toBe(25);
    expect(result.current.data?.attendees.items[0].studentId).toBe('10928374');
  });

  it('useMyAttendanceRecordsQuery fetches student personal attendance history', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [mockRecord],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    });

    const { result } = renderHook(() => useMyAttendanceRecordsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0].status).toBe('present');
  });

  it('useInitializeAttendanceMutation initializes session and starts dynamic rotation', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: mockInstance },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useInitializeAttendanceMutation(onSuccess), { wrapper });

    result.current.mutate({
      courseId: 'CPEN402',
      date: '2026-11-04T10:00:00.000Z',
      classType: 'in-person',
      latitude: 5.6037,
      longitude: -0.1870,
      durationMinutes: 60,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postSpy).toHaveBeenCalledWith(
      '/attendance/initialize',
      expect.objectContaining({ courseId: 'CPEN402', classType: 'in-person' }),
    );
    expect(onSuccess).toHaveBeenCalledWith(mockInstance);
  });

  it('useCloseAttendanceMutation terminates attendance session', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: { message: 'Attendance session successfully closed' } },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCloseAttendanceMutation(onSuccess), { wrapper });

    result.current.mutate('att-session-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postSpy).toHaveBeenCalledWith('/attendance/close/att-session-1');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useMarkAttendanceMutation verifies QR code token with coordinates', async () => {
    const markResponse: MarkAttendanceResponse = {
      success: true,
      message: 'Attendance verified and marked successfully',
      attendance: mockRecord,
      presentCount: 26,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: markResponse },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useMarkAttendanceMutation(onSuccess), { wrapper });

    result.current.mutate({
      token: 'jwt-rotating-token-1',
      latitude: 5.6037,
      longitude: -0.1870,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postSpy).toHaveBeenCalledWith(
      '/attendance/mark',
      expect.objectContaining({ token: 'jwt-rotating-token-1' }),
    );
    expect(onSuccess).toHaveBeenCalledWith(markResponse);
  });

  it('useManualMarkAttendeeMutation updates student attendance status', async () => {
    const updatedRecord = { ...mockRecord, status: 'excused' as const };
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: { success: true, data: updatedRecord },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useManualMarkAttendeeMutation(onSuccess), { wrapper });

    result.current.mutate({
      attendanceId: 'rec-1',
      status: 'excused',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(putSpy).toHaveBeenCalledWith(
      '/attendance/attendee',
      expect.objectContaining({ attendanceId: 'rec-1', status: 'excused' }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useDeleteAttendanceInstanceMutation deletes session and attendee logs', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true, data: { message: 'Attendance instance deleted' } },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDeleteAttendanceInstanceMutation(onSuccess), { wrapper });

    result.current.mutate('att-session-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteSpy).toHaveBeenCalledWith('/attendance/instances/att-session-1');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('useDeleteAttendanceRecordMutation deletes single attendance entry', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true, data: { message: 'Attendance record deleted' } },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDeleteAttendanceRecordMutation(onSuccess), { wrapper });

    result.current.mutate('rec-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteSpy).toHaveBeenCalledWith('/attendance/records/rec-1');
    expect(onSuccess).toHaveBeenCalled();
  });
});

