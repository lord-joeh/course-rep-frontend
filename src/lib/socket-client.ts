import { io, Socket } from 'socket.io-client';
import { tokenStore } from './token-store';

const SOCKET_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000');

export function createNamespaceSocket(namespace: string): Socket {
  const token = tokenStore.getAccessToken();
  const url = `${SOCKET_BASE_URL}${namespace.startsWith('/') ? '' : '/'}${namespace}`;

  return io(url, {
    auth: {
      token: token ? `Bearer ${token}` : '',
    },
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}
