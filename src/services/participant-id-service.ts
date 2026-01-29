import { doc, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COUNTER_DOC_REF = doc(db, 'counters', 'participantId');
const STARTING_ID = 2025000; // It will be incremented to 2025001 on the first run

/**
 * Gets the next sequential participant ID.
 * Uses a Firestore transaction to ensure atomicity.
 * @returns A promise that resolves to the new participant ID string (e.g., "P2025001") or null on error.
 */
export async function getNextParticipantId(): Promise<string | null> {
  try {
    const newIdNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(COUNTER_DOC_REF);

      let newCount;
      if (!counterDoc.exists()) {
        // If the counter document doesn't exist, this is the first user.
        newCount = STARTING_ID + 1;
      } else {
        const currentCount = counterDoc.data().count;
        newCount = currentCount + 1;
      }

      transaction.set(COUNTER_DOC_REF, { count: newCount });
      return newCount;
    });

    return `P${newIdNumber}`;
  } catch (e) {
    console.error('Transaction failed: ', e);
    return null;
  }
}
