// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
// Note: Firebase client API keys are meant to be public.
// Security is enforced through Firestore Security Rules.
const firebaseConfig = {
  apiKey: 'AIzaSyANh6YrHtu3gIfpUQPJTMpMUyPqh7YiFDU',
  authDomain: 'affirmation-study.firebaseapp.com',
  projectId: 'affirmation-study',
  storageBucket: 'affirmation-study.firebasestorage.app',
  messagingSenderId: '27983281189',
  appId: '1:27983281189:web:474fc28d338072232013cc',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, 'care-kit');

// Initialize Firebase Cloud Messaging (only in browser, not during SSR)
let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { app, db, messaging };
