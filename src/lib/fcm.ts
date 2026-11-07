import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, type Messaging } from 'firebase/messaging';

interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  vapidKey?: string;
}

declare global {
  interface Window {
    __FIREBASE_CONFIG__?: FirebaseClientConfig;
  }
}

const runtimeFirebaseConfig =
  typeof window !== 'undefined' ? window.__FIREBASE_CONFIG__ : undefined;

const firebaseConfig = {
  apiKey: runtimeFirebaseConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:
    runtimeFirebaseConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: runtimeFirebaseConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:
    runtimeFirebaseConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    runtimeFirebaseConfig?.messagingSenderId ||
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: runtimeFirebaseConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = runtimeFirebaseConfig?.vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messaging: Messaging | null = null;

/**
 * Check if the current browser environment supports Push Notifications.
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Initialize Firebase client if configuration is present.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;

  const missingConfig = (
    ['apiKey', 'projectId', 'messagingSenderId', 'appId'] as const
  ).filter((key) => !firebaseConfig[key]);
  if (missingConfig.length > 0) {
    console.warn(`[FCM] Firebase configuration is missing: ${missingConfig.join(', ')}`);
    return null;
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    return initializeApp(firebaseConfig);
  } catch (err) {
    console.warn('[FCM] Failed to initialize Firebase app:', err);
    return null;
  }
}

async function getMessagingServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (import.meta.env.DEV) {
    return navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  }
  return navigator.serviceWorker.ready;
}

/**
 * Acquire a Firebase Cloud Messaging registration token.
 */
export async function getFcmToken(): Promise<string | null> {
  if (!isPushSupported()) {
    return null;
  }

  if (!vapidKey) {
    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is not configured.');
    return null;
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  try {
    const registration = await getMessagingServiceWorkerRegistration();
    if (!messaging) {
      messaging = getMessaging(firebaseApp);
    }
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.warn('[FCM] Error acquiring FCM device token:', err);
    return null;
  }
}
