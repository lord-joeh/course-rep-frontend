import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from './token-store';
import type { ApiResponse, RefreshTokenResponse } from '@/types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // Attach active Socket.io client ID if available
    const socketId = (window as unknown as { __activeSocketId?: string }).__activeSocketId;
    if (socketId) {
      config.headers.set('X-Socket-ID', socketId);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor with Token Rotation Mutex
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    // 1. Silent Refresh on 401 Unauthorized
    if (error.response.status === 401) {
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh-token') ||
        originalRequest.url?.includes('/auth/register');

      if (originalRequest._retry || isAuthEndpoint) {
        return Promise.reject(error);
      }

      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken) {
        tokenStore.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { withCredentials: true },
        );

        const newTokens = response.data?.data;
        if (!newTokens?.accessToken) {
          throw new Error('Malformed token refresh response');
        }

        tokenStore.setTokens(newTokens.accessToken, newTokens.refreshToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
        originalRequest.headers.set('Authorization', `Bearer ${newTokens.accessToken}`);

        processQueue(null, newTokens.accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStore.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 2. Exponential Backoff on 429 Too Many Requests
    if (error.response.status === 429) {
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 2) {
        originalRequest._retryCount = retryCount + 1;
        const delay = 1000 * Math.pow(2, retryCount); // 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
