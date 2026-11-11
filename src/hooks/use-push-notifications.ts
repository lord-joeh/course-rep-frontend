import { useState, useEffect, useCallback, useRef } from 'react';
import { isPushSupported, getFcmToken } from '@/lib/fcm';
import {
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
} from '@/hooks/use-notifications';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushNotificationsReturn {
  permission: PushPermissionState;
  isSupported: boolean;
  isSubscribed: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  token: string | null;
  requestPushPermission: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
  togglePushNotifications: () => Promise<boolean>;
}

const STORAGE_KEY = 'cr_push_enabled';

export function usePushNotifications(): UsePushNotificationsReturn {
  const { isAuthenticated } = useAuthStore();
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });

  const registerTokenMutation = useRegisterPushTokenMutation();
  const unregisterTokenMutation = useUnregisterPushTokenMutation();
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Initialize permission state
  useEffect(() => {
    const supported = isPushSupported();
    setIsSupported(supported);

    if (!supported) {
      setPermission('unsupported');
      setIsEnabled(false);
      return;
    }

    const currentPerm = Notification.permission;
    setPermission(currentPerm);

    if (currentPerm !== 'granted') {
      setIsEnabled(false);
    } else {
      const storedPref = localStorage.getItem(STORAGE_KEY);
      setIsEnabled(storedPref !== 'false');
    }
  }, []);

  // Centralized token sync function that prevents duplicate concurrent requests
  const syncToken = useCallback(
    async (explicitToken?: string) => {
      if (!isAuthenticated || isSyncingRef.current) {
        return;
      }

      isSyncingRef.current = true;
      try {
        const deviceToken = explicitToken || (await getFcmToken());
        if (deviceToken) {
          setToken(deviceToken);
          // Only send network request if this token hasn't been registered yet in this session
          if (lastRegisteredTokenRef.current !== deviceToken) {
            await registerTokenMutation.mutateAsync({
              token: deviceToken,
              deviceType: 'web',
            });
            lastRegisteredTokenRef.current = deviceToken;
          }
        }
      } catch (err) {
        console.warn('[PushNotifications] Push token sync error:', err);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [isAuthenticated, registerTokenMutation],
  );

  // Sync token with backend when user is logged in, permission is granted, and push is enabled
  useEffect(() => {
    if (!isAuthenticated || permission !== 'granted' || !isSupported || !isEnabled) {
      return;
    }

    syncToken();
  }, [isAuthenticated, permission, isSupported, isEnabled, syncToken]);

  // Request browser push notification permission and turn push ON
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Push notifications are not supported on this device/browser.');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsEnabled(true);

        const deviceToken = await getFcmToken();
        if (!deviceToken) {
          toast.error('Could not get a valid push token.');
          setIsLoading(false);
          return false;
        }

        setToken(deviceToken);
        await syncToken(deviceToken);
        toast.success('Push Notifications Enabled', {
          description: 'You will receive real-time alerts for schedule changes and deadlines.',
        });
        setIsLoading(false);
        return true;
      } else if (result === 'denied') {
        localStorage.setItem(STORAGE_KEY, 'false');
        setIsEnabled(false);
        toast.error('Push Notifications Blocked', {
          description: 'Please enable notifications in your browser site permissions to receive alerts.',
        });
        setIsLoading(false);
        return false;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      console.error('[PushNotifications] Error requesting permission:', err);
      toast.error('Failed to enable push notifications.');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, syncToken]);

  // Turn push notifications OFF and unregister device token from backend
  const disablePushNotifications = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'false');
      setIsEnabled(false);

      await unregisterTokenMutation.mutateAsync(
        token ? { token } : undefined,
      );

      setToken(null);
      lastRegisteredTokenRef.current = null;

      toast.success('Push Notifications Disabled', {
        description: 'You will no longer receive push notifications on this device.',
      });
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('[PushNotifications] Error disabling push notifications:', err);
      toast.error('Failed to disable push notifications.');
      setIsLoading(false);
      return false;
    }
  }, [token, unregisterTokenMutation]);

  // Toggle push notifications ON or OFF
  const togglePushNotifications = useCallback(async (): Promise<boolean> => {
    if (isEnabled && permission === 'granted') {
      return disablePushNotifications();
    } else {
      return requestPushPermission();
    }
  }, [isEnabled, permission, disablePushNotifications, requestPushPermission]);

  return {
    permission,
    isSupported,
    isSubscribed: permission === 'granted' && isEnabled && !!token,
    isEnabled,
    isLoading,
    token,
    requestPushPermission,
    disablePushNotifications,
    togglePushNotifications,
  };
}
