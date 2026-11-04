import { io, Socket } from 'socket.io-client';
import { tokenStore } from './token-store';

export function getSocketBaseUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
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
