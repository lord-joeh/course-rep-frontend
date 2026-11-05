/* eslint-disable no-undef */
// Firebase Cloud Messaging Background Service Worker for CourseRep PWA

// 1. Listen for background push events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const notificationTitle =
      payload.notification?.title || payload.data?.title || 'CourseRep Announcement';
    const notificationOptions = {
      body:
        payload.notification?.body ||
        payload.data?.body ||
        payload.data?.message ||
        'You have a new update from your course cohort.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.data?.id || 'courserep-notification',
      renotify: true,
      data: {
        url: payload.data?.url || '/students/notifications',
        ...payload.data,
      },
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions),
    );
  } catch (_e) {
    // If not JSON, render plain text payload
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('CourseRep Notification', {
        body: text,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { url: '/students/notifications' },
      }),
    );
  }
});

// 2. Notification click handler: focus existing window or open target route
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/students/notifications';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If an existing client is open, focus it and navigate
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});

