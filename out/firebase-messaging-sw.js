// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyDrqE9PM1N7EdxHCwTeDi-o2Tq17hXmrlA',
  authDomain: 'brain-kit-prod.firebaseapp.com',
  projectId: 'brain-kit-prod',
  storageBucket: 'brain-kit-prod.firebasestorage.app',
  messagingSenderId: '16172690806',
  appId: '1:16172690806:web:aa9ca0f694733b23d29e57',
  measurementId: 'G-BVQ16YPJRS',
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title || 'BRAIN KIT Reminder';
  const notificationOptions = {
    body: payload.notification.body || 'Time for your daily affirmation',
    icon: '/brain-kit-capacitor-logo.png',
    badge: '/brain-kit-capacitor-logo.png',
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
