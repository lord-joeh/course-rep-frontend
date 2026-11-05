import { io, Socket } from 'socket.io-client';
import { tokenStore } from './token-store';

export function getSocketBaseUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
}

export function createNamespaceSocket(namespace: string): Socket {
  const token = tokenStore.getAccessToken();
  const baseUrl = getSocketBaseUrl();
  const cleanNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
  const url = `${baseUrl}${cleanNamespace}`;

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
