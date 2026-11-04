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
      setIsConnected(true);
      socket.emit('joinSession', { instanceId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
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
        setRecentAttendees((prev) => [payload, ...prev.slice(0, 9)]);
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
    qrImage,
    token,
    countdown,
    recentAttendees,
    livePresentCount,
    isSessionClosed,
  };
}
