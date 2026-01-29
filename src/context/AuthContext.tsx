
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseUser, deleteUser, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { app } from '@/lib/firebase'; // Import firebase app

type User = {
  email: string;
  participantId?: string;
  uid: string;
  name?: string;
  role?: 'user' | 'admin';
  memorableCodeWord?: string;
  studyStartDate?: string;
  hasCompletedStudy?: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, memorableCodeWord: string) => Promise<string>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize Firebase Auth
const auth = getAuth(app);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('onAuthStateChanged triggered, user:', firebaseUser?.uid);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // Retry logic to handle race condition during signup
        console.log('Fetching user document...');
        let userDoc = await getDoc(userDocRef);
        let retries = 0;
        const maxRetries = 5;

        // If document doesn't exist, wait a bit and retry (signup might still be creating it)
        while (!userDoc.exists() && retries < maxRetries) {
          console.log(`User document not found, retry ${retries + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          userDoc = await getDoc(userDocRef);
          retries++;
        }

        if (userDoc.exists()) {
          console.log('User document found, setting user state');
          const userData = userDoc.data();
          setUser({
            email: firebaseUser.email!,
            uid: firebaseUser.uid,
            participantId: userData.participantId, // Optional
            name: userData.name,
            role: userData.role || 'user',
            memorableCodeWord: userData.memorableCodeWord,
            studyStartDate: userData.studyStartDate,
            hasCompletedStudy: userData.hasCompletedStudy || false,
          });
        } else {
          // Document still doesn't exist after retries - sign out
          console.error('User document not found after retries');
          await signOut(auth);
          setUser(null);
        }
      } else {
        console.log('No authenticated user');
        setUser(null);
      }
      console.log('Setting loading to false');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, name: string, memorableCodeWord: string): Promise<string> => {
    let firebaseUser: FirebaseUser | null = null;
    try {
      console.log('Starting signup process...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      firebaseUser = userCredential.user;
      console.log('Firebase user created:', firebaseUser.uid);

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      console.log('Creating user document...');
      await setDoc(userDocRef, {
        email: firebaseUser.email,
        name: name.trim(),
        memorableCodeWord: memorableCodeWord.trim().toLowerCase(),
        role: 'user',
        studyStartDate: new Date().toISOString(),
        hasCompletedStudy: false,
      });
      console.log('User document created successfully');
      // Return the memorable code word as confirmation
      return memorableCodeWord.trim().toLowerCase();
    } catch (error) {
        console.error('Signup error:', error);
        if (firebaseUser) {
          try {
            console.log('Cleaning up failed signup...');
            await signInWithEmailAndPassword(auth, email, pass);
            await deleteUser(auth.currentUser!);
            console.log('User cleaned up');
          } catch (deleteError) {
             console.error("Failed to clean up user during signup failure:", deleteError)
          }
        }
        throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // New Google user - create participant ID
        const participantId = await getNextParticipantId();

        if (participantId) {
          await setDoc(userDocRef, {
            email: firebaseUser.email,
            participantId: participantId,
            authProvider: 'google',
            role: 'user',
            studyStartDate: new Date().toISOString(),
            hasCompletedStudy: false,
          });
        } else {
          throw new Error("Failed to generate participant ID.");
        }
      }
      // onAuthStateChanged will handle setting the user state
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, signInWithGoogle, logout, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
