import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, type Messaging } from 'firebase/messaging';

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app: FirebaseApp | null = null;
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

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return null;
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    app = initializeApp(firebaseConfig);
    return app;
  } catch (err) {
    console.warn('[FCM] Failed to initialize Firebase app:', err);
    return null;
  }
}

/**
 * Register service worker and acquire FCM / Web Push device token.
 */
export async function getFcmToken(): Promise<string | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    // 1. Ensure service worker is registered
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    const firebaseApp = getFirebaseApp();

    // 2. If Firebase credentials are fully configured, use Firebase Messaging SDK
    if (firebaseApp && vapidKey) {
      if (!messaging) {
        messaging = getMessaging(firebaseApp);
      }
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      return token || null;
    }

    // 3. Graceful fallback for local development or standard Web Push
    // Check if an existing PushSubscription exists or generate a client token
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription && vapidKey) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });
      } catch (_subErr) {
        // Fall through to fallback token
      }
    }

    if (subscription) {
      return JSON.stringify(subscription.toJSON());
    }

    // Simulated local dev token
    const stored = window.localStorage.getItem('courserep_fcm_dev_token');
    if (stored) return stored;

    const devToken = `dev-fcm-token-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    window.localStorage.setItem('courserep_fcm_dev_token', devToken);
    return devToken;
  } catch (err) {
    console.warn('[FCM] Error acquiring FCM device token:', err);
    return null;
  }
}

