importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyCO7KD4EXFyf8I5NEqjT5AxCIO1fpK6v_E",
  authDomain: "course-rep-a4086.firebaseapp.com",
  projectId: "course-rep-a4086",
  storageBucket: "course-rep-a4086.firebasestorage.app",
  messagingSenderId: "885858359",
  appId: "1:885858359:web:f89a57582ed50f568d9fb2",
  measurementId: "G-1X0ZYZ0FJH",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || "/flowbite-react.svg",
  });
});
