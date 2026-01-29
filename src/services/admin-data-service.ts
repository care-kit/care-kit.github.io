import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStudyDay, getAffirmationIndex } from '@/lib/study-day';

export interface UserData {
  uid: string;
  email: string;
  participantId: string;
  role?: string;
  createdAt?: string;
  studyStartDate?: string;
  hasCompletedStudy?: boolean;
  memorableCodeWord?: string;
}

export interface StressDataWithUser {
  participantId: string;
  memorableCodeWord?: string;
  date: string;
  time: string;
  affirmationType: string;
  affirmation: string;
  stressBefore: number | null;
  stressAfter: number | null;
  timeSpentSeconds: number;
  timestamp: string;
  studyDay?: number;
  affirmationNumber?: number;
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);

    const users: UserData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email || '',
        participantId: data.participantId || '',
        role: data.role || 'user',
        studyStartDate: data.studyStartDate,
        hasCompletedStudy: data.hasCompletedStudy || false,
        memorableCodeWord: data.memorableCodeWord,
      });
    });

    // Sort by memorable codeword, then email if no codeword
    return users.sort((a, b) => {
      const aCode = a.memorableCodeWord || a.email || '';
      const bCode = b.memorableCodeWord || b.email || '';
      return aCode.localeCompare(bCode);
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function getCompletedStudyUsers(): Promise<UserData[]> {
  try {
    const users = await getAllUsers();
    return users.filter(user => user.hasCompletedStudy === true);
  } catch (error) {
    console.error('Error fetching completed study users:', error);
    throw error;
  }
}

export async function getAllStressData(): Promise<StressDataWithUser[]> {
  try {
    // First get all users to map UIDs to participant IDs and study start dates
    const users = await getAllUsers();
    const uidToUserMap = new Map(
      users.map(user => [user.uid, user])
    );

    // Then get all stress data
    const stressDataRef = collection(db, 'stressData');
    const q = query(stressDataRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    const stressData: StressDataWithUser[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const timestamp = new Date(data.timestamp);
      const user = uidToUserMap.get(data.creatorId);

      // Calculate study day and affirmation number if user has studyStartDate
      let studyDay: number | undefined;
      let affirmationNumber: number | undefined;

      if (user?.studyStartDate) {
        // Calculate study day at the time of the session
        const sessionDate = new Date(data.timestamp);
        const startDate = new Date(user.studyStartDate);
        startDate.setHours(0, 0, 0, 0);
        sessionDate.setHours(0, 0, 0, 0);
        const diffTime = sessionDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        studyDay = diffDays + 1;

        // Calculate affirmation number (0-13)
        const isMorning = data.affirmationType === 'morning';
        affirmationNumber = getAffirmationIndex(user.studyStartDate, isMorning);
      }

      stressData.push({
        participantId: user?.memorableCodeWord || user?.participantId || data.creatorId,
        memorableCodeWord: user?.memorableCodeWord,
        date: timestamp.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        time: timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        affirmationType: data.affirmationType || '',
        affirmation: data.affirmation || '',
        stressBefore: data.stressBefore,
        stressAfter: data.stressAfter,
        timeSpentSeconds: data.affirmationDurationSeconds || 0,
        timestamp: data.timestamp,
        studyDay,
        affirmationNumber,
      });
    });

    return stressData;
  } catch (error) {
    console.error('Error fetching stress data:', error);
    throw error;
  }
}
