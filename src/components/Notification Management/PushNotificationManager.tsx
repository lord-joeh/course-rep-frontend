import { useEffect, useState } from "react";
import {
  onMessageListener,
  NotificationPayload,
  requestForToken,
} from "../../utils/firebase";
import { subscribeToPushNotification } from "../../services/notificationServices";
import ToastMessage from "../common/ToastMessage";

interface Notification {
  title: string;
  body: string;
}

export default function PushNotificationManager() {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const initFCM = async () => {
      try {
        // Register service worker
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
          );
          console.log("Service Worker registered:", registration);
        }

        // Request for token
        const token = await requestForToken();
        if (token) {
          await subscribeToPushNotification("1706188403", token);
        }

        // Listen for foreground messages
        const unsubscribe = onMessageListener().then(
          (payload: NotificationPayload) => {
            setNotification({
              title: payload.notification.title,
              body: payload.notification.body,
            });
          },
        );

        return () => unsubscribe;
      } catch (err) {
        console.error("FCM initialization error:", err);
      }
    };

    initFCM();
  }, []);

  return (
    <>
      {notification && (
        <ToastMessage
          message={notification?.body}
          type="success"
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}
