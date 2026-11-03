import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tokenStore } from '@/lib/token-store';

describe('tokenStore', () => {
  beforeEach(() => {
    tokenStore.clearTokens();
  });

  it('stores and retrieves access token strictly in memory', () => {
    expect(tokenStore.getAccessToken()).toBeNull();
    tokenStore.setAccessToken('sample.access.jwt');
    expect(tokenStore.getAccessToken()).toBe('sample.access.jwt');
  });

  it('clears access token on clearTokens', () => {
    tokenStore.setAccessToken('sample.access.jwt');
    tokenStore.clearTokens();
    expect(tokenStore.getAccessToken()).toBeNull();
  });

  it('stores and retrieves refresh token', () => {
    expect(tokenStore.getRefreshToken()).toBeNull();
    tokenStore.setRefreshToken('sample.refresh.jwt');
    expect(tokenStore.getRefreshToken()).toBe('sample.refresh.jwt');
  });

  it('notifies subscribers when tokens change', () => {
    const listener = vi.fn();
    const unsubscribe = tokenStore.subscribe(listener);

    tokenStore.setAccessToken('token-1');
    expect(listener).toHaveBeenCalledWith(true);

    tokenStore.clearTokens();
    expect(listener).toHaveBeenCalledWith(false);

    unsubscribe();
    tokenStore.setAccessToken('token-2');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('correctly assesses valid session state', () => {
    expect(tokenStore.hasValidSession()).toBe(false);
    tokenStore.setRefreshToken('refresh-token');
    expect(tokenStore.hasValidSession()).toBe(true);
  });
});
