import { useState, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { createNamespaceSocket } from '@/lib/socket-client';
import type {
  QRRotatePayload,
  AttendeeMarkedPayload,
  SessionClosedPayload,
} from '@/types';

interface UseAttendanceStreamOptions {
  instanceId?: string;
  initialQrImage?: string | null;
  initialToken?: string | null;
  initialPresentCount?: number;
}

export function useAttendanceStream({
  instanceId,
  initialQrImage = null,
  initialToken = null,
  initialPresentCount = 0,
}: UseAttendanceStreamOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(initialQrImage);
  const [token, setToken] = useState<string | null>(initialToken);
  const [countdown, setCountdown] = useState<number>(20);
  const [recentAttendees, setRecentAttendees] = useState<AttendeeMarkedPayload[]>([]);
  const [livePresentCount, setLivePresentCount] = useState<number>(initialPresentCount);
  const [isSessionClosed, setIsSessionClosed] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setQrImage(initialQrImage);
  }, [initialQrImage]);

  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  useEffect(() => {
    setLivePresentCount(initialPresentCount);
  }, [initialPresentCount]);

  useEffect(() => {
    if (!instanceId) return;

    const socket = createNamespaceSocket('/attendance-stream');
    socketRef.current = socket;

    socket.connect();

    socket.on('connect', () => {
      console.log(`[AttendanceStream] Connected to namespace: ${socket.id}`);
      setIsConnected(true);
      setConnectionError(null);
      socket.emit('joinSession', { instanceId });
    });

    socket.on('disconnect', (reason) => {
      console.warn(`[AttendanceStream] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error(`[AttendanceStream] Connection error: ${error.message}`);
      setIsConnected(false);
      setConnectionError(error.message);
    });

    socket.on('qrRotate', (payload: QRRotatePayload) => {
      if (payload.instanceId === instanceId) {
        setQrImage(payload.qrImage);
        setToken(payload.token);
        setCountdown(payload.expiresInSeconds || 20);
      }
    });

    socket.on('attendeeMarked', (payload: AttendeeMarkedPayload) => {
      if (payload.instanceId === instanceId) {
        // Prevent duplicate student entries if student scans multiple times
        setRecentAttendees((prev) => {
          const filtered = prev.filter((att) => att.studentId !== payload.studentId);
          return [payload, ...filtered].slice(0, 10);
        });
        setLivePresentCount(payload.presentCount);
      }
    });

    socket.on('sessionClosed', (payload: SessionClosedPayload) => {
      if (payload.instanceId === instanceId) {
        setIsSessionClosed(true);
        setQrImage(null);
        setToken(null);
      }
    });

    return () => {
      try {
        if (socket.connected) {
          socket.emit('leaveSession', { instanceId });
        }
      } catch (err) {
        console.warn('[AttendanceStream] Error emitting leaveSession', err);
      }
      if (typeof socket.off === 'function') {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('qrRotate');
        socket.off('attendeeMarked');
        socket.off('sessionClosed');
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [instanceId]);

  // 1-second interval timer for the 20s countdown ring
  useEffect(() => {
    if (!qrImage || isSessionClosed) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [qrImage, isSessionClosed]);

  return {
    isConnected,
    connectionError,
    qrImage,
    token,
    countdown,
    recentAttendees,
    livePresentCount,
    isSessionClosed,
  };
}
