# PWA & Push Notification Testing Guide

Your app is now live at: **https://brain-kit-prod.web.app**

## ✅ What's Been Set Up

1. **PWA Configuration** - Your app can be installed like a native app
2. **Firebase Cloud Messaging** - Push notifications ready
3. **Notification Permission** - Users will see a prompt to enable notifications after login
4. **Service Worker** - Background notifications and offline support

---

## 🧪 Testing Steps

### Step 1: Test PWA Installation

#### On Desktop (Chrome/Edge):
1. Visit **https://brain-kit-prod.web.app**
2. Look in the address bar for an install icon (⊕ or computer icon)
3. Click it and select "Install"
4. The app will open in its own window without browser UI
5. Check your Applications folder - BRAIN KIT should appear there

#### On Android:
1. Open Chrome and visit **https://brain-kit-prod.web.app**
2. Tap the menu (⋮) → "Add to Home screen" or "Install app"
3. Tap "Install"
4. Find the BRAIN KIT icon on your home screen
5. Tap to open - it should feel like a native app

#### On iOS:
1. Open Safari and visit **https://brain-kit-prod.web.app**
2. Tap the Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"
5. Find BRAIN KIT on your home screen

---

### Step 2: Test Notification Permission

1. Log in to your app
2. You should see a blue card at the top saying "Enable Notifications"
3. Click "Enable Notifications"
4. Your browser will show a permission dialog
5. Click "Allow"
6. You should see a success toast: "Notifications enabled!"
7. Check Firebase Console → Firestore → users → (your user) → you should see an `fcmTokens` field

---

### Step 3: Test Push Notifications

#### Option A: Send Test Notification via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/) → **brain-kit-prod**
2. Click **Cloud Messaging** in the left sidebar
3. Click **Send your first message** (or "New notification")
4. Fill in:
   - **Notification title**: "Time for your morning affirmation!"
   - **Notification text**: "Open BRAIN KIT to start your day right"
5. Click **Send test message**
6. Enter your FCM token (found in browser console after enabling notifications, or in Firestore)
7. Click **Test**
8. You should receive the notification!

#### Option B: Send to All Users

1. Same steps as above, but instead of "Send test message"
2. Click **Next** → **Next** → **Review** → **Publish**
3. All users with notifications enabled will receive it

---

### Step 4: Verify Notification Behavior

#### When App is Open (Foreground):
- Notification should appear as a browser notification
- Also shows as a toast inside the app

#### When App is Closed (Background):
- Notification appears in system notification center
- Clicking it opens the app

#### Test Both Scenarios:
1. Keep app open and send a test notification → should see browser notification + toast
2. Close app completely and send another → should see system notification → click it → app opens

---

## 📊 Monitoring

### Check Notification Delivery:
1. Firebase Console → Cloud Messaging
2. See sent messages, delivery rates, and opens

### Check User Tokens:
1. Firebase Console → Firestore Database → users collection
2. Each user document should have:
   - `fcmTokens`: array of FCM tokens (one per device)
   - `lastTokenUpdate`: timestamp of last token update

---

## 🔧 Troubleshooting

### PWA Not Installing:
- ✅ Make sure you're using HTTPS (Firebase Hosting does this automatically)
- ✅ Clear browser cache and try again
- ✅ Try in incognito/private mode

### Notification Permission Not Requesting:
- ✅ Check browser console for errors
- ✅ Verify VAPID key is correct in [src/lib/notifications.ts](src/lib/notifications.ts:23)
- ✅ Make sure you're logged in (notification prompt only shows after login)

### Notifications Not Received:
- ✅ Verify notification permission is "granted" (check browser settings)
- ✅ Check FCM token is saved in Firestore user document
- ✅ Verify service worker is registered: DevTools → Application → Service Workers
- ✅ Check Firebase Console → Cloud Messaging for delivery status
- ✅ Try in incognito mode (fresh start)

### iOS Issues:
- ⚠️ iOS PWA notifications are limited - users need to add to home screen first
- ⚠️ For reliable iOS notifications, use your Capacitor native app instead
- ✅ The PWA still works great for the app functionality, just not push notifications

---

## 🚀 Next Steps: Automated Reminders

To send scheduled reminders for participant adherence, you can:

### Option 1: Firebase Cloud Functions (Recommended)

Create scheduled functions that send notifications at specific times:

```bash
firebase init functions
```

Then create a scheduled function:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const sendMorningReminder = functions.pubsub
  .schedule('0 8 * * *') // Every day at 8 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const users = await admin.firestore().collection('users').get();

    const messages = users.docs.map(doc => {
      const tokens = doc.data().fcmTokens || [];
      return tokens.map((token: string) => ({
        notification: {
          title: 'Good morning!',
          body: 'Time for your morning affirmation'
        },
        token: token
      }));
    }).flat();

    await admin.messaging().sendEach(messages);
  });
```

### Option 2: Third-Party Services

Use services like:
- **Cloud Scheduler** (Google Cloud)
- **Zapier** + Firebase Admin SDK
- **n8n** (self-hosted automation)

---

## 📱 Platform Comparison

| Feature | Desktop PWA | Android PWA | iOS PWA | Native App |
|---------|------------|-------------|---------|------------|
| Install | ✅ | ✅ | ✅ | ✅ |
| Offline Mode | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ Full | ✅ Full | ⚠️ Limited | ✅ Full |
| Background Sync | ✅ | ✅ | ❌ | ✅ |
| App Store | ❌ | ❌ | ❌ | ✅ |
| Instant Updates | ✅ | ✅ | ✅ | ❌ |

---

## 🎯 Recommendation for Your Study

### For Android Participants:
- Use the PWA - easy distribution, full notification support
- Just share the URL: https://brain-kit-prod.web.app
- They can install it directly

### For iOS Participants:
- Use your Capacitor native app for reliable notifications
- Distribute via TestFlight or Ad Hoc
- PWA works as a backup option for app functionality

### Distribution Strategy:
1. Primary: Share PWA URL with all participants
2. Android users: Can use PWA fully (including notifications)
3. iOS users: Install native app if they need notification reminders
4. Fallback: PWA works for everyone for the core app functionality

---

## 📞 Support

### Useful Links:
- **Your App**: https://brain-kit-prod.web.app
- **Firebase Console**: https://console.firebase.google.com/project/brain-kit-prod
- **Cloud Messaging Docs**: https://firebase.google.com/docs/cloud-messaging

### Debugging Tools:
- Browser DevTools → Application → Service Workers
- Browser DevTools → Application → Manifest
- Browser DevTools → Console (for FCM token)
- Firebase Console → Cloud Messaging → Reports

---

## ✨ Success Checklist

- [ ] PWA installs successfully on desktop
- [ ] PWA installs successfully on Android
- [ ] PWA installs successfully on iOS
- [ ] Notification permission prompt appears after login
- [ ] FCM token is saved to Firestore
- [ ] Test notification received (foreground)
- [ ] Test notification received (background)
- [ ] Clicking notification opens the app
- [ ] App works offline (after first load)
- [ ] Scheduled reminders configured (if using Cloud Functions)

---

Good luck with your study! 🧠✨
