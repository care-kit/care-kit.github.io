import { getToken, onMessage, getMessaging, isSupported } from 'firebase/messaging';
import { app } from './firebase';

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if messaging is supported
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging is not supported in this browser');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // Unregister any existing service workers first
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.log('Unregistering existing service worker:', registration.scope);
          await registration.unregister();
        }
      }

      // Small delay to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Register service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          console.log('Service Worker registered:', registration);

          // Wait for service worker to be active
          if (registration.installing) {
            await new Promise((resolve) => {
              registration.installing!.addEventListener('statechange', function() {
                if (this.state === 'activated') {
                  resolve(null);
                }
              });
            });
          }

          await navigator.serviceWorker.ready;
          console.log('Service Worker is ready');
        } catch (swError) {
          console.error('Service Worker registration failed:', swError);
          return null;
        }
      }

      // Initialize messaging
      const messaging = getMessaging(app);

      // Get FCM token with retry logic
      let token = null;
      let retries = 0;
      const maxRetries = 3;

      while (!token && retries < maxRetries) {
        try {
          token = await getToken(messaging, {
            vapidKey: 'BAflMYuUiIVjaCaCxmVmwYp8801GpsUz5ic5hLsymTpnZEr2DrnHfwL7PLdPpi84JY8QKRqcl2bNqJtnbEFRpm0',
            serviceWorkerRegistration: await navigator.serviceWorker.ready
          });

          if (token) {
            console.log('FCM Token obtained successfully');
            break;
          }
        } catch (tokenError: any) {
          retries++;
          console.warn(`Token retrieval attempt ${retries}/${maxRetries} failed:`, tokenError.message);

          if (retries < maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          } else {
            throw tokenError;
          }
        }
      }

      if (token) {
        console.log('FCM Token:', token);
        return token;
      } else {
        console.log('No registration token available. Check service worker registration.');
        return null;
      }
    } else if (permission === 'denied') {
      console.log('Notification permission denied.');
      return null;
    } else {
      console.log('Notification permission not granted yet.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while requesting notification permission:', error);
    return null;
  }
}

// Listen for foreground messages
export async function listenForMessages(callback: (payload: any) => void) {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging is not supported');
      return;
    }

    const messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);

      // Show system tray notification even when app is in foreground
      if (payload.notification) {
        const notificationTitle = payload.notification.title || 'BRAIN KIT';
        const notificationOptions = {
          body: payload.notification.body || 'You have a new notification',
          icon: '/brain-kit-capacitor-logo.png',
          badge: '/brain-kit-capacitor-logo.png',
          tag: 'brain-kit-notification', // Prevents duplicate notifications
          requireInteraction: false, // Auto-dismiss after some time
          vibrate: [200, 100, 200], // Vibration pattern
          data: payload.data || {}, // Include custom data
          silent: false, // Play notification sound
        };

        // Create the notification
        const notification = new Notification(notificationTitle, notificationOptions);

        // Handle notification click - focus the app
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notification.close();

          // If there's a URL in the payload, navigate to it
          if (payload.data?.url) {
            window.location.href = payload.data.url;
          }
        };

        console.log('System tray notification shown in foreground');
      }

      // Also trigger the callback for any UI updates (like toast)
      callback(payload);
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
  }
}

// Save FCM token to user's Firestore document
export async function saveFCMTokenToUser(userId: string, token: string) {
  try {
    const { db } = await import('./firebase');
    const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token), // Store as array in case user has multiple devices
      lastTokenUpdate: new Date().toISOString()
    });

    console.log('FCM token saved to user document');
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}
