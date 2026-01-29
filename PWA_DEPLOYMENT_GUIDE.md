# PWA Deployment Guide - Firebase Hosting + Cloud Messaging

This guide explains how to deploy BRAIN KIT as a Progressive Web App (PWA) on Firebase Hosting with push notification support via Firebase Cloud Messaging (FCM).

## Overview

Your app now supports **two deployment methods**:
1. **Native App** - Capacitor builds for Android/iOS (existing setup)
2. **PWA** - Web app with offline support and push notifications (new setup)

Both can coexist! Users who can't install native apps can use the PWA version.

---

## Prerequisites

1. **Firebase CLI** - Install globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project** - You already have `brain-kit-prod` configured

3. **Web Push Certificate (VAPID Key)** - You'll need to generate this in Firebase Console

---

## Step 1: Get Your VAPID Key from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **brain-kit-prod**
3. Click the gear icon ⚙️ → **Project settings**
4. Go to the **Cloud Messaging** tab
5. Scroll down to **Web configuration**
6. Under **Web Push certificates**, click **Generate key pair**
7. Copy the key (starts with `B...`)

### Update Your Code with VAPID Key:

Edit [src/lib/notifications.ts](src/lib/notifications.ts:25):
```typescript
const token = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY_HERE' // Replace with the key you copied
});
```

---

## Step 2: Enable Firebase Cloud Messaging

1. In [Firebase Console](https://console.firebase.google.com/) → **brain-kit-prod**
2. Navigate to **Cloud Messaging** (under Build section)
3. Click **Get Started** if not already enabled
4. The service should now be active

---

## Step 3: Build Your App

Build the static export for deployment:

```bash
npm run build
```

This creates the `out/` directory with your static files.

---

## Step 4: Login to Firebase CLI

Authenticate with Firebase:

```bash
firebase login
```

This will open your browser to sign in with your Google account.

---

## Step 5: Deploy to Firebase Hosting

Deploy your app:

```bash
firebase deploy --only hosting
```

Your app will be deployed to:
- **https://brain-kit-prod.web.app**
- **https://brain-kit-prod.firebaseapp.com**

---

## Step 6: Test Your PWA

### On Desktop (Chrome/Edge):
1. Visit your deployed URL
2. Look for the install icon (⊕) in the address bar
3. Click to install the PWA
4. The app will open in its own window

### On Android:
1. Visit your deployed URL in Chrome
2. Tap the menu (⋮) → **Add to Home screen**
3. Tap **Install**
4. The app appears on your home screen like a native app

### On iOS (Limited Support):
1. Visit your deployed URL in Safari
2. Tap the Share button
3. Tap **Add to Home Screen**
4. The app appears on your home screen

**Note:** iOS has limited PWA notification support. For full notifications on iOS, users should use the native Capacitor app.

---

## Step 7: Request Notification Permission

Add this code to your app where appropriate (e.g., after user login):

```typescript
import { requestNotificationPermission, saveFCMTokenToUser, listenForMessages } from '@/lib/notifications';

// Request permission and save token
async function setupNotifications(userId: string) {
  const token = await requestNotificationPermission();
  if (token) {
    await saveFCMTokenToUser(userId, token);
    console.log('Notifications enabled!');
  }

  // Listen for foreground messages
  listenForMessages((payload) => {
    console.log('Received notification:', payload);
    // Handle notification in your UI
  });
}
```

---

## Step 8: Send Notifications to Users

### Option A: Using Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Cloud Messaging**
3. Click **Send your first message**
4. Enter title and message
5. Click **Send test message** or **Next** to send to all users

### Option B: Using Firebase Admin SDK (Automated)

Create a server-side function to send scheduled notifications:

```typescript
// Example: Send notification to a specific user
import admin from 'firebase-admin';

async function sendNotificationToUser(userId: string) {
  // Get user's FCM tokens from Firestore
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const tokens = userDoc.data()?.fcmTokens || [];

  if (tokens.length === 0) {
    console.log('User has no FCM tokens');
    return;
  }

  // Send notification
  const message = {
    notification: {
      title: 'Time for your daily affirmation!',
      body: 'Start your morning routine with BRAIN KIT',
    },
    tokens: tokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  console.log(`Sent ${response.successCount} notifications`);
}
```

### Option C: Schedule Notifications (Recommended for Adherence)

Use Firebase Cloud Functions with scheduled triggers:

```bash
# Install Firebase Functions
npm install -g firebase-functions
firebase init functions
```

Then create scheduled notifications for morning/evening reminders.

---

## Notification Support by Platform

| Platform | PWA Notifications | Native App Notifications |
|----------|-------------------|-------------------------|
| **Android** | ✅ Full support | ✅ Full support |
| **iOS** | ⚠️ Limited (requires add to home screen) | ✅ Full support |
| **Desktop** | ✅ Full support | N/A |

**Recommendation:**
- Android users can use either PWA or native app
- iOS users should use the native Capacitor app for reliable notifications
- Desktop users can use PWA

---

## Continuous Deployment

### Auto-deploy from GitHub (Optional)

1. In Firebase Console → **Hosting**
2. Click **Get started** under GitHub integration
3. Connect your repository
4. Every push to main will auto-deploy

---

## Testing Checklist

- [ ] Build succeeds: `npm run build`
- [ ] Deploy succeeds: `firebase deploy --only hosting`
- [ ] PWA installs on Android
- [ ] PWA installs on desktop
- [ ] Notification permission dialog appears
- [ ] FCM token saves to Firestore
- [ ] Test notification sends successfully
- [ ] Background notifications work (when app is closed)
- [ ] Foreground notifications work (when app is open)
- [ ] Click notification opens app
- [ ] Offline mode works (service worker caches assets)

---

## Firestore Security Rules Update

Add FCM token support to your security rules:

```javascript
match /users/{userId} {
  allow read: if request.auth != null &&
                 (request.auth.uid == userId || isAdmin());
  allow write: if request.auth != null && request.auth.uid == userId;

  // Allow users to update their own FCM tokens
  allow update: if request.auth != null &&
                   request.auth.uid == userId &&
                   request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['fcmTokens', 'lastTokenUpdate']);
}
```

---

## Monitoring & Analytics

### View Notification Stats:
1. Firebase Console → **Cloud Messaging**
2. See delivery rates, open rates, etc.

### View Hosting Analytics:
1. Firebase Console → **Hosting**
2. See traffic, bandwidth usage

---

## Costs (Free Tier Limits)

Firebase Free Tier includes:
- **Hosting:** 10 GB storage, 360 MB/day transfer
- **Cloud Messaging:** Unlimited notifications
- **Firestore:** 50k reads, 20k writes per day

Your app should easily stay within free tier limits.

---

## Troubleshooting

### Notifications not working:
1. Check browser console for errors
2. Verify VAPID key is correct in [src/lib/notifications.ts](src/lib/notifications.ts)
3. Ensure notification permission was granted
4. Check FCM token is saved in Firestore user document
5. Verify service worker is registered (check DevTools → Application → Service Workers)

### PWA not installing:
1. Ensure site is served over HTTPS (Firebase Hosting does this automatically)
2. Check manifest.json is accessible at `/manifest.json`
3. Verify service worker is registered
4. Clear browser cache and try again

### Build fails:
1. Delete `out/` directory and `.next/` directory
2. Run `npm run build` again
3. Check for TypeScript errors

---

## Next Steps

1. **Update VAPID key** in [src/lib/notifications.ts](src/lib/notifications.ts)
2. **Deploy:** `firebase deploy --only hosting`
3. **Test notifications** with Firebase Console
4. **Set up scheduled reminders** for participant adherence
5. **Monitor usage** in Firebase Console

---

## Support

- **Firebase Hosting Docs:** https://firebase.google.com/docs/hosting
- **FCM Web Docs:** https://firebase.google.com/docs/cloud-messaging/js/client
- **PWA Checklist:** https://web.dev/pwa-checklist/

---

## Comparison: Native App vs PWA

### Native App (Capacitor):
✅ Full notification support on iOS
✅ Better performance
✅ Access to device features
❌ Requires app store approval or sideloading
❌ Harder to update

### PWA (Firebase Hosting):
✅ Instant deployment (no approval)
✅ Instant updates
✅ Works on all platforms
✅ Easier distribution (just share URL)
❌ Limited iOS notification support
❌ Limited device feature access

**Recommendation:** Offer both! Let users choose based on their needs.
