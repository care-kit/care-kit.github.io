// src/services/stress-data-service.ts

import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface StressDataRecord {
  creatorId: string; // Add creatorId to the interface
  affirmationType: 'morning' | 'evening' | null;
  affirmation: string;
  stressBefore: number | null;
  stressAfter: number | null;
  timestamp: string;
  // Time tracking fields
  flowStartTime: string; // When the user started the flow
  affirmationStartTime: string; // When the affirmation was shown
  affirmationEndTime: string; // When user clicked continue from affirmation
  flowEndTime: string; // When the user completed the flow
  affirmationDurationSeconds: number; // Time spent viewing affirmation
  totalFlowDurationSeconds: number; // Total time from start to completion
}

export async function saveStressData(data: StressDataRecord) {
  console.log('Inside saveStressData:');
  console.log('Data to be saved:', data);
  
  try {
    // Your Firestore rules now require `creatorId` in the data payload.
    // The client component is now sending it.
    const docRef = await addDoc(collection(db, 'stressData'), data);
    console.log('Document written with ID: ', docRef.id);
    return { success: true, id: docRef.id };
  } catch (e) {
    console.error('Error adding document: ', e);
    if (e instanceof Error) {
      return { success: false, error: e.message };
    }
    return { success: false, error: 'Failed to save data' };
  }
}
