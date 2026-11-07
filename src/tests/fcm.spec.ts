import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMocks = vi.hoisted(() => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(),
  getMessaging: vi.fn(),
  getToken: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: firebaseMocks.initializeApp,
  getApps: firebaseMocks.getApps,
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: firebaseMocks.getMessaging,
  getToken: firebaseMocks.getToken,
}));

describe('FCM token acquisition', () => {
  const registration = {} as ServiceWorkerRegistration;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    for (const key of [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
      'VITE_FIREBASE_VAPID_KEY',
    ]) {
      vi.stubEnv(key, '');
    }
    window.__FIREBASE_CONFIG__ = undefined;

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'granted' },
    });
    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: {},
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        get ready() {
          return Promise.resolve(registration);
        },
      },
    });

    firebaseMocks.getApps.mockReturnValue([]);
    firebaseMocks.initializeApp.mockReturnValue({});
    firebaseMocks.getMessaging.mockReturnValue({});
    firebaseMocks.getToken.mockResolvedValue('valid-fcm-registration-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the Firebase SDK and supplies the registered messaging worker', async () => {
    window.__FIREBASE_CONFIG__ = {
      apiKey: 'test-api-key',
      projectId: 'test-project',
      messagingSenderId: 'test-sender',
      appId: 'test-app',
      vapidKey: 'test-vapid-key',
    };

    const { getFcmToken } = await import('@/lib/fcm');
    await expect(getFcmToken()).resolves.toBe('valid-fcm-registration-token');
    expect(firebaseMocks.getToken).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ serviceWorkerRegistration: registration }),
    );
  });

  it('uses the active PWA registration in production', async () => {
    vi.stubEnv('DEV', false);
    window.__FIREBASE_CONFIG__ = {
      apiKey: 'test-api-key',
      projectId: 'test-project',
      messagingSenderId: 'test-sender',
      appId: 'test-app',
      vapidKey: 'test-vapid-key',
    };

    const { getFcmToken } = await import('@/lib/fcm');
    await expect(getFcmToken()).resolves.toBe('valid-fcm-registration-token');
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
    expect(firebaseMocks.getToken).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ serviceWorkerRegistration: registration }),
    );
  });

  it('does not create or return a fake token when Firebase config is incomplete', async () => {
    window.__FIREBASE_CONFIG__ = { apiKey: 'test-api-key' };

    const { getFcmToken } = await import('@/lib/fcm');
    await expect(getFcmToken()).resolves.toBeNull();
    expect(firebaseMocks.getToken).not.toHaveBeenCalled();
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('courserep_fcm_dev_token')).toBeNull();
  });

  it('does not attempt token acquisition without a VAPID key', async () => {
    window.__FIREBASE_CONFIG__ = {
      apiKey: 'test-api-key',
      projectId: 'test-project',
      messagingSenderId: 'test-sender',
      appId: 'test-app',
    };

    const { getFcmToken } = await import('@/lib/fcm');
    await expect(getFcmToken()).resolves.toBeNull();
    expect(firebaseMocks.getToken).not.toHaveBeenCalled();
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  it('returns null rather than a fake token when Firebase rejects token acquisition', async () => {
    window.__FIREBASE_CONFIG__ = {
      apiKey: 'test-api-key',
      projectId: 'test-project',
      messagingSenderId: 'test-sender',
      appId: 'test-app',
      vapidKey: 'test-vapid-key',
    };
    firebaseMocks.getToken.mockRejectedValue(new Error('Firebase token request failed'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { getFcmToken } = await import('@/lib/fcm');
    await expect(getFcmToken()).resolves.toBeNull();
    expect(window.localStorage.getItem('courserep_fcm_dev_token')).toBeNull();
  });
});
