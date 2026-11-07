import { useState, useEffect, useCallback, useRef } from 'react';
import { isPushSupported, getFcmToken } from '@/lib/fcm';
import { useRegisterPushTokenMutation } from '@/hooks/use-notifications';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushNotificationsReturn {
  permission: PushPermissionState;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  token: string | null;
  requestPushPermission: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { isAuthenticated } = useAuthStore();
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const registerTokenMutation = useRegisterPushTokenMutation();
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Initialize permission state
  useEffect(() => {
    const supported = isPushSupported();
    setIsSupported(supported);

    if (!supported) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);
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

  // Sync token with backend when user is logged in and permission is granted
  useEffect(() => {
    if (!isAuthenticated || permission !== 'granted' || !isSupported) {
      return;
    }

    syncToken();
  }, [isAuthenticated, permission, isSupported, syncToken]);

  // Request browser push notification permission
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
        const deviceToken = await getFcmToken();
        if (!deviceToken) {
          toast.error('Could not get a valid push token. Check Firebase configuration and try again.');
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

  return {
    permission,
    isSupported,
    isSubscribed: permission === 'granted' && !!token,
    isLoading,
    token,
    requestPushPermission,
  };
}
