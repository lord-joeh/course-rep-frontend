/**
 * In-Memory Token Vault.
 * Access tokens are stored strictly in-memory to prevent XSS exfiltration.
 * Refresh tokens are persisted securely to enable silent rotation across session reloads.
 */

let inMemoryAccessToken: string | null = null;
const REFRESH_TOKEN_KEY = 'cr_v2_refresh_token';

type AuthListener = (hasAuth: boolean) => void;
const listeners = new Set<AuthListener>();

export const tokenStore = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
    this.notify();
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch {
      // Storage unavailable or disabled
    }
    this.notify();
  },

  setTokens(accessToken: string | null, refreshToken: string | null): void {
    inMemoryAccessToken = accessToken;
    if (refreshToken) {
      try {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } catch {
        // Ignored
      }
    } else {
      try {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch {
        // Ignored
      }
    }
    this.notify();
  },

  clearTokens(): void {
    inMemoryAccessToken = null;
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignored
    }
    this.notify();
  },

  hasValidSession(): boolean {
    return !!(inMemoryAccessToken || this.getRefreshToken());
  },

  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  notify(): void {
    const hasAuth = !!inMemoryAccessToken;
    listeners.forEach((listener) => listener(hasAuth));
  },
};
