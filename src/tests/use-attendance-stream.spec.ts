import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAttendanceStream } from '@/hooks/use-attendance-stream';
import type { AttendeeMarkedPayload, QRRotatePayload, SessionClosedPayload } from '@/types';

// Mock Socket instance and listeners map
const listeners: Record<string, ((...args: any[]) => void)[]> = {};

const mockSocket = {
  id: 'mock-socket-123',
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

describe('useAttendanceStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(listeners).forEach((k) => delete listeners[k]);
    mockSocket.connected = false;
  });

  it('connects to websocket and joins session room', () => {
    const { result } = renderHook(() =>
      useAttendanceStream({
        instanceId: 'inst-999',
        initialPresentCount: 5,
      }),
    );

    expect(mockSocket.connect).toHaveBeenCalled();

    // Trigger connect callback
    act(() => {
      (listeners['connect'] || []).forEach((cb) => cb());
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('joinSession', { instanceId: 'inst-999' });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.livePresentCount).toBe(5);
  });

  it('filters duplicate attendees so a student scanning more than once appears only once', () => {
    const { result } = renderHook(() =>
      useAttendanceStream({
        instanceId: 'inst-999',
        initialPresentCount: 0,
      }),
    );

    // First scan by Student 1 (Kwame)
    const scan1: AttendeeMarkedPayload = {
      instanceId: 'inst-999',
      studentId: 'std-1',
      studentName: 'Kwame Mensah',
      markedAt: '2026-11-04T08:30:00Z',
      presentCount: 1,
    };

    act(() => {
      (listeners['attendeeMarked'] || []).forEach((cb) => cb(scan1));
    });

    expect(result.current.recentAttendees).toHaveLength(1);
    expect(result.current.recentAttendees[0].studentId).toBe('std-1');
    expect(result.current.livePresentCount).toBe(1);

    // Second scan by Student 2 (Ama)
    const scan2: AttendeeMarkedPayload = {
      instanceId: 'inst-999',
      studentId: 'std-2',
      studentName: 'Ama Serwaa',
      markedAt: '2026-11-04T08:30:10Z',
      presentCount: 2,
    };

    act(() => {
      (listeners['attendeeMarked'] || []).forEach((cb) => cb(scan2));
    });

    expect(result.current.recentAttendees).toHaveLength(2);
    expect(result.current.recentAttendees.map((a) => a.studentId)).toEqual(['std-2', 'std-1']);
    expect(result.current.livePresentCount).toBe(2);

    // Third scan: Student 1 (Kwame) scans AGAIN (repeated scan)
    const repeatScan1: AttendeeMarkedPayload = {
      instanceId: 'inst-999',
      studentId: 'std-1',
      studentName: 'Kwame Mensah',
      markedAt: '2026-11-04T08:30:20Z',
      presentCount: 2,
    };

    act(() => {
      (listeners['attendeeMarked'] || []).forEach((cb) => cb(repeatScan1));
    });

    // CRITICAL ASSERTION: Kwame must NOT appear twice. Length remains 2!
    expect(result.current.recentAttendees).toHaveLength(2);
    expect(result.current.recentAttendees.map((a) => a.studentId)).toEqual(['std-1', 'std-2']);
    // The latest markedAt timestamp for Kwame is preserved at the top
    expect(result.current.recentAttendees[0].markedAt).toBe('2026-11-04T08:30:20Z');
  });

  it('updates rotating QR code and countdown on qrRotate', () => {
    const { result } = renderHook(() =>
      useAttendanceStream({
        instanceId: 'inst-999',
      }),
    );

    const rotatePayload: QRRotatePayload = {
      instanceId: 'inst-999',
      qrImage: 'data:image/png;base64,newqrcode',
      token: 'jwt-new-token',
      expiresInSeconds: 20,
      rotatedAt: '2026-11-04T08:31:00Z',
    };

    act(() => {
      (listeners['qrRotate'] || []).forEach((cb) => cb(rotatePayload));
    });

    expect(result.current.qrImage).toBe('data:image/png;base64,newqrcode');
    expect(result.current.token).toBe('jwt-new-token');
    expect(result.current.countdown).toBe(20);
  });

  it('marks session as closed and clears QR on sessionClosed', () => {
    const { result } = renderHook(() =>
      useAttendanceStream({
        instanceId: 'inst-999',
        initialQrImage: 'data:image/png;base64,existing',
      }),
    );

    const closedPayload: SessionClosedPayload = {
      instanceId: 'inst-999',
      message: 'Session has ended',
    };

    act(() => {
      (listeners['sessionClosed'] || []).forEach((cb) => cb(closedPayload));
    });

    expect(result.current.isSessionClosed).toBe(true);
    expect(result.current.qrImage).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('leaves session room and cleans up listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useAttendanceStream({
        instanceId: 'inst-999',
      }),
    );

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('leaveSession', { instanceId: 'inst-999' });
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
