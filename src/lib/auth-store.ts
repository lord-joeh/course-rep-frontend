import { useEffect, useState } from 'react';
import { tokenStore } from './token-store';
import { apiClient } from './api-client';
import type { StudentProfile, ApiResponse, RefreshTokenResponse } from '@/types';

const USER_STORAGE_KEY = 'cr_v2_user_profile';

interface AuthState {
  user: StudentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

let state: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function getStoredUser(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user: StudentProfile | null) {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Storage disabled or unavailable
  }
}

export const authStore = {
  getState(): AuthState {
    return state;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setSession(student: StudentProfile, tokens: { accessToken: string; refreshToken?: string }): void {
    tokenStore.setTokens(tokens.accessToken, tokens.refreshToken || null);
    persistUser(student);
    state = {
      user: student,
      isAuthenticated: true,
      isLoading: false,
    };
    notify();
  },

  updateUser(updates: Partial<StudentProfile>): void {
    if (!state.user) return;
    const updatedUser = { ...state.user, ...updates };
    persistUser(updatedUser);
    state = {
      ...state,
      user: updatedUser,
    };
    notify();
  },

  clearSession(): void {
    tokenStore.clearTokens();
    persistUser(null);
    state = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
    notify();
  },

  async initialize(): Promise<void> {
    const refreshToken = tokenStore.getRefreshToken();
    const storedUser = getStoredUser();

    if (!refreshToken) {
      this.clearSession();
      return;
    }

    // Temporary optimistic restoration while verifying with backend
    if (storedUser) {
      state = {
        user: storedUser,
        isAuthenticated: true,
        isLoading: true,
      };
      notify();
    }

    try {
      // Attempt silent rotation to obtain fresh in-memory access token
      const refreshRes = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
        '/auth/refresh-token',
        { refreshToken },
      );

      const tokens = refreshRes.data?.data;
      if (tokens?.accessToken) {
        tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);

        // Fetch fresh profile
        const profileRes = await apiClient.get<ApiResponse<StudentProfile>>('/students/me');
        const student = profileRes.data?.data;

        if (student) {
          persistUser(student);
          state = {
            user: student,
            isAuthenticated: true,
            isLoading: false,
          };
          notify();
          return;
        }
      }

      this.clearSession();
    } catch {
      this.clearSession();
    }
  },
};

// Global event listener for token expiry from api-client
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    authStore.clearSession();
  });
}

/**
 * Custom React hook to subscribe to auth state.
 */
export function useAuthStore() {
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());

  useEffect(() => {
    return authStore.subscribe(() => {
      setAuthState(authStore.getState());
    });
  }, []);

  return authState;
}

export function useAuth() {
  return useAuthStore();
}

