# Firebase Setup Guide

This document provides instructions for configuring your Firebase project to work with Brain Kit.

## Firebase Console Configuration

### 1. Enable Authentication Methods

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `brain-kit-prod`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable the following providers:
   - **Email/Password**: Click and enable
   - **Google**: Click, enable, and configure:
     - Set a public-facing name for your project
     - Choose a support email
     - Save

### 2. Firestore Database Setup

1. Navigate to **Firestore Database** in the Firebase Console
2. If not already created, click **Create database**
3. Choose **Start in production mode** (we'll add rules next)
4. Select your preferred region

### 3. Firestore Security Rules

Copy and paste these rules into your Firestore Security Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection - users can read/write their own document, admins can read all
    match /users/{userId} {
      allow read: if request.auth != null &&
                     (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Participant ID counter - allow authenticated users to read and update
    // This is needed for the transaction that generates sequential participant IDs
    match /counters/participantId {
      allow read, write: if request.auth != null;
    }

    // Stress data collection - users can only write their own data, admins can read all
    match /stressData/{docId} {
      allow read: if request.auth != null &&
                     (resource.data.creatorId == request.auth.uid || isAdmin());
      allow create: if request.auth != null
                    && request.resource.data.creatorId == request.auth.uid
                    && request.resource.data.keys().hasAll([
                      'creatorId',
                      'affirmationType',
                      'affirmation',
                      'stressBefore',
                      'stressAfter',
                      'timestamp',
                      'flowStartTime',
                      'affirmationStartTime',
                      'affirmationEndTime',
                      'flowEndTime',
                      'affirmationDurationSeconds',
                      'totalFlowDurationSeconds'
                    ]);
      allow update, delete: if request.auth != null
                           && resource.data.creatorId == request.auth.uid;
    }
  }
}
```

To apply these rules:
1. Go to **Firestore Database** → **Rules** tab
2. Paste the above rules
3. Click **Publish**

## Database Collections

Your Firebase project will use the following collections:

### `users`
Stores user profile information.

**Structure:**
- Document ID: Firebase Auth UID
- Fields:
  - `email` (string): User's email address
  - `participantId` (string): Unique participant ID (e.g., "P2025001")
  - `authProvider` (string, optional): "email" or "google"

### `stressData`
Stores affirmation session data for research purposes.

**Structure:**
- Document ID: Auto-generated
- Fields:
  - `creatorId` (string): User's Firebase Auth UID
  - `affirmationType` (string): "morning" | "evening" | null
  - `affirmation` (string): The affirmation text shown
  - `stressBefore` (number | null): Pre-affirmation mood score
  - `stressAfter` (number | null): Post-affirmation mood score
  - `timestamp` (string): ISO timestamp
  - `flowStartTime` (string): When user started the flow
  - `affirmationStartTime` (string): When affirmation was shown
  - `affirmationEndTime` (string): When user continued from affirmation
  - `flowEndTime` (string): When user completed the flow
  - `affirmationDurationSeconds` (number): Time spent viewing affirmation
  - `totalFlowDurationSeconds` (number): Total flow duration

### `counters`
Counter document for generating sequential participant IDs.

**Structure:**
- Document ID: `participantId`
- Fields:
  - `count` (number): Current counter value (starts at 2025001)

## Accessing Your Data

### Viewing Users
1. Go to **Firestore Database** → **Data** tab
2. Click on the `users` collection
3. You'll see all registered users with their participant IDs

### Viewing Research Data
1. Go to **Firestore Database** → **Data** tab
2. Click on the `stressData` collection
3. Each document contains one affirmation session with mood scores and timing data

### Exporting Data

To export your data for analysis:

1. **Using Firebase Console:**
   - Go to **Firestore Database** → **Data**
   - Select a collection
   - Click the three dots menu → **Export collection**

2. **Using Firebase CLI:**
   ```bash
   firebase firestore:export gs://brain-kit-prod.appspot.com/exports
   ```

3. **Query specific data** (example):
   - Filter by date range
   - Filter by participant ID
   - Download as CSV using third-party tools or scripts

## Project Configuration

The app is configured to use the following Firebase project:

- **Project ID:** brain-kit-prod
- **Auth Domain:** brain-kit-prod.firebaseapp.com
- **Storage Bucket:** brain-kit-prod.firebasestorage.app

Configuration files:
- [src/lib/firebase.ts](src/lib/firebase.ts) - Firebase initialization
- [.firebaserc](.firebaserc) - Firebase project settings

## Features Implemented

- ✅ Email/Password authentication
- ✅ Google Sign-In authentication
- ✅ User registration with auto-generated participant IDs
- ✅ Firestore database for user profiles
- ✅ Firestore database for affirmation session data
- ✅ Mood scoring (pre and post affirmation)
- ✅ Time tracking (time spent viewing affirmations)
- ✅ Secure data access with Firestore Security Rules

## Testing the Integration

1. **Test Email Sign-Up:**
   - Go to `/signup`
   - Create an account with email/password
   - Verify user appears in Firestore `users` collection

2. **Test Google Sign-In:**
   - Go to `/login` or `/signup`
   - Click "Sign in with Google" button
   - Authorize with your Google account
   - Verify user appears in Firestore `users` collection

3. **Test Data Collection:**
   - Complete an affirmation session
   - Check the `stressData` collection for the new record
   - Verify all fields are populated correctly

## Admin Dashboard Access

### Assigning Admin Role

The admin dashboard is located at `/admin` and is only accessible to users with the admin role.

**To assign admin role to a user:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `brain-kit-prod`
3. Navigate to **Firestore Database** → **Data** tab
4. Click on the `users` collection
5. Find the document for the user with email `lukanetzler@gmail.com`
   - You can search by clicking "Start collection" if needed
   - The document ID is the user's UID
6. Click on the document to edit it
7. Add a new field:
   - Field: `role`
   - Type: `string`
   - Value: `admin`
8. Click **Update**

**After assigning the role:**
- The user needs to log out and log back in for changes to take effect
- Once logged in as admin, they can access the dashboard at `/admin`
- The admin dashboard displays:
  - All registered users with their participant IDs
  - All research data (affirmation sessions with mood scores and time data)
  - Export functionality for both users and research data as CSV files

### Admin Dashboard Features

**Users Table:**
- Participant ID
- Email address
- User role
- Export to CSV

**Research Data Table:**
- Participant ID
- Date and time of session
- Affirmation type (Morning/Evening)
- Affirmation text shown to user
- Mood score before affirmation (1-5 scale)
- Mood score after affirmation (1-5 scale)
- Time spent viewing affirmation (in seconds)
- Export to CSV for external analysis

**CSV Export Format:**
The exported CSV files include headers and are formatted for easy import into statistical analysis tools like R, Python, SPSS, or Excel.

## Support

If you encounter any issues:
1. Check the Firebase Console → **Authentication** for user creation
2. Check the Firebase Console → **Firestore Database** for data
3. Check browser console for any error messages
4. Verify that all authentication methods are enabled
5. Verify that security rules are published
6. For admin access issues, verify the `role` field is set to `"admin"` (string) in the user document
