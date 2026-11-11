import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/fcm', () => ({
  isPushSupported: () => true,
  getFcmToken: () => Promise.resolve('test-fcm-registration-token'),
}));

describe('PWA & Push Notification Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('usePwaInstall', () => {
    it('initializes with non-installable state and captures beforeinstallprompt event', () => {
      const { result } = renderHook(() => usePwaInstall());

      expect(result.current.isInstallable).toBe(false);
      expect(result.current.isInstalled).toBe(false);

      // Simulate browser beforeinstallprompt event
      const promptEvent = new Event('beforeinstallprompt');
      Object.assign(promptEvent, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      });

      act(() => {
        window.dispatchEvent(promptEvent);
      });

      expect(result.current.isInstallable).toBe(true);
    });

    it('triggers promptInstall and marks app as installed upon user acceptance', async () => {
      const { result } = renderHook(() => usePwaInstall());

      const mockPrompt = vi.fn().mockResolvedValue(undefined);
      const promptEvent = new Event('beforeinstallprompt');
      Object.assign(promptEvent, {
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      });

      act(() => {
        window.dispatchEvent(promptEvent);
      });

      expect(result.current.isInstallable).toBe(true);

      let success = false;
      await act(async () => {
        success = await result.current.promptInstall();
      });

      expect(mockPrompt).toHaveBeenCalled();
      expect(success).toBe(true);
      expect(result.current.isInstalled).toBe(true);
      expect(result.current.isInstallable).toBe(false);
    });

    it('handles appinstalled event', () => {
      const { result } = renderHook(() => usePwaInstall());

      act(() => {
        window.dispatchEvent(new Event('appinstalled'));
      });

      expect(result.current.isInstalled).toBe(true);
      expect(result.current.isInstallable).toBe(false);
    });
  });

  describe('usePushNotifications', () => {
    const originalNotification = window.Notification;

    beforeEach(() => {
      // Mock Notification API
      (window as any).Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      };

      // Mock navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockResolvedValue({
            pushManager: {
              getSubscription: vi.fn().mockResolvedValue(null),
              subscribe: vi.fn().mockResolvedValue({
                toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/test' }),
              }),
            },
          }),
        },
        writable: true,
      });

      (window as any).PushManager = {};
    });

    afterEach(() => {
      window.Notification = originalNotification;
    });

    it('initializes permission state and allows requesting push permission', async () => {
      authStore.clearSession();
      authStore.setSession(
        {
          id: 'stu-1',
          name: 'Student One',
          email: 'student1@univ.edu',
          studentId: 'STU001',
          isRep: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        { accessToken: 'token-123' },
      );

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { success: true, message: 'FCM registered' },
      });

      const { result } = renderHook(() => usePushNotifications(), { wrapper });

      expect(result.current.isSupported).toBe(true);
      expect(result.current.permission).toBe('default');

      let granted = false;
      await act(async () => {
        granted = await result.current.requestPushPermission();
      });

      expect(granted).toBe(true);
      expect(result.current.permission).toBe('granted');
      expect(postSpy).toHaveBeenCalledWith(
        '/notifications/push-token',
        expect.objectContaining({
          token: expect.any(String),
          deviceType: 'web',
        }),
      );
    });

    it('handles permission denial gracefully', async () => {
      (window as any).Notification.requestPermission = vi.fn().mockResolvedValue('denied');

      const { result } = renderHook(() => usePushNotifications(), { wrapper });

      let granted = true;
      await act(async () => {
        granted = await result.current.requestPushPermission();
      });

      expect(granted).toBe(false);
      expect(result.current.permission).toBe('denied');
    });

    it('disables push notifications and calls DELETE /notifications/push-token', async () => {
      authStore.setSession(
        {
          id: 'stu-1',
          name: 'Student One',
          email: 'student1@univ.edu',
          studentId: 'STU001',
          isRep: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        { accessToken: 'token-123' },
      );

      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue({
        data: {
          success: true,
          data: {
            message: 'Push notifications turned off successfully',
            enabled: false,
            unregisteredCount: 1,
          },
        },
      });

      const { result } = renderHook(() => usePushNotifications(), { wrapper });

      let disabled = false;
      await act(async () => {
        disabled = await result.current.disablePushNotifications();
      });

      expect(disabled).toBe(true);
      expect(result.current.isEnabled).toBe(false);
      expect(deleteSpy).toHaveBeenCalledWith(
        '/notifications/push-token',
        expect.anything(),
      );
    });
  });
});
