import { describe, it, expect, beforeEach } from 'vitest';
import { authStore } from '@/lib/auth-store';
import { tokenStore } from '@/lib/token-store';
import type { StudentProfile } from '@/types';

describe('authStore', () => {
  const dummyStudent: StudentProfile = {
    id: 'STU-100',
    name: 'Ada Lovelace',
    email: 'ada@computing.edu',
    phone: '+1555234567',
    isRep: false,
    status: 'active',
  };

  beforeEach(() => {
    authStore.clearSession();
  });

  it('sets session and updates reactive auth state and tokenStore', () => {
    expect(authStore.getState().isAuthenticated).toBe(false);

    authStore.setSession(dummyStudent, {
      accessToken: 'access-jwt-token',
      refreshToken: 'refresh-jwt-token',
    });

    const current = authStore.getState();
    expect(current.isAuthenticated).toBe(true);
    expect(current.user?.id).toBe('STU-100');
    expect(tokenStore.getAccessToken()).toBe('access-jwt-token');
    expect(tokenStore.getRefreshToken()).toBe('refresh-jwt-token');
  });

  it('updates student profile details', () => {
    authStore.setSession(dummyStudent, { accessToken: 'token' });
    authStore.updateUser({ name: 'Ada King, Countess of Lovelace' });

    expect(authStore.getState().user?.name).toBe('Ada King, Countess of Lovelace');
  });

  it('clears session and tokens on logout', () => {
    authStore.setSession(dummyStudent, { accessToken: 'token', refreshToken: 'refresh' });
    authStore.clearSession();

    const current = authStore.getState();
    expect(current.isAuthenticated).toBe(false);
    expect(current.user).toBeNull();
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });
});

