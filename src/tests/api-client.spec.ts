import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { tokenStore } from '@/lib/token-store';

describe('apiClient Interceptors', () => {
  const originalAdapter = apiClient.defaults.adapter;

  beforeEach(() => {
    tokenStore.clearTokens();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it('attaches Bearer token from in-memory tokenStore on outgoing requests', async () => {
    tokenStore.setAccessToken('my-test-access-token');

    let interceptedHeaders: any = null;
    apiClient.defaults.adapter = async (config) => {
      interceptedHeaders = config.headers;
      return {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await apiClient.get('/test-route');

    expect(interceptedHeaders).not.toBeNull();
    expect(interceptedHeaders?.get('Authorization')).toBe('Bearer my-test-access-token');
  });

  it('handles 401 and performs silent refresh rotation, then replays queued request', async () => {
    tokenStore.setTokens('initial-access', 'valid-refresh-token');

    // Mock axios.post for the refresh-token endpoint
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          accessToken: 'new-rotated-access-token',
          refreshToken: 'new-rotated-refresh-token',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    let attemptCount = 0;
    apiClient.defaults.adapter = async (config) => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: { message: 'Token expired' },
        } as any);
      }

      return {
        data: { success: true, message: 'Recovered after refresh' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const response = await apiClient.get('/protected-data');

    expect(response.data.success).toBe(true);
    expect(response.data.message).toBe('Recovered after refresh');
    expect(tokenStore.getAccessToken()).toBe('new-rotated-access-token');
    expect(tokenStore.getRefreshToken()).toBe('new-rotated-refresh-token');
    expect(attemptCount).toBe(2);
  });

  it('clears tokens and dispatches auth:unauthorized when refresh fails', async () => {
    tokenStore.setTokens('expired-access', 'revoked-refresh');

    const unauthorizedEventSpy = vi.fn();
    window.addEventListener('auth:unauthorized', unauthorizedEventSpy);

    // Mock axios.post to simulate a rejected refresh attempt (e.g. revoked token)
    vi.spyOn(axios, 'post').mockRejectedValueOnce(
      new AxiosError('Revoked token', 'ERR_BAD_REQUEST', {} as any, null, {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
        data: { message: 'Revoked refresh token' },
      } as any),
    );

    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
        data: { message: 'Expired' },
      } as any);
    };

    await expect(apiClient.get('/sensitive-info')).rejects.toThrow();

    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
    expect(unauthorizedEventSpy).toHaveBeenCalled();

    window.removeEventListener('auth:unauthorized', unauthorizedEventSpy);
  });
});
