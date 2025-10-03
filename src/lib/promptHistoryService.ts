/**
 * Prompt History Management Service
 * Handles versioning, history, and restoration of system prompts
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface PromptHistoryEntry {
  id?: string;
  content: string;
  version: 'production' | 'testing';
  createdOn: Timestamp;
  savedBy: string;
  savedByEmail?: string;
  versionComment: string;
  reverted?: boolean;
  revertedFrom?: string; // ID of the version this was reverted from
}

const PROMPT_HISTORY_COLLECTION = 'system_prompt_history';

/**
 * Save a new version to history
 */
export async function savePromptToHistory(
  content: string,
  version: 'production' | 'testing',
  userId: string,
  userEmail: string,
  versionComment: string
): Promise<string | null> {
  try {
    const historyRef = collection(db, PROMPT_HISTORY_COLLECTION);

    const docRef = await addDoc(historyRef, {
      content,
      version,
      createdOn: serverTimestamp(),
      savedBy: userId,
      savedByEmail: userEmail,
      versionComment,
      reverted: false
    } as PromptHistoryEntry);

    console.log('✅ Prompt version saved to history:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving to prompt history:', error);
    return null;
  }
}

/**
 * Get prompt history
 */
export async function getPromptHistory(
  version: 'production' | 'testing',
  limitCount: number = 50
): Promise<PromptHistoryEntry[]> {
  try {
    const historyRef = collection(db, PROMPT_HISTORY_COLLECTION);
    const q = query(
      historyRef,
      orderBy('createdOn', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const allHistory = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PromptHistoryEntry));

    // Filter by version
    return allHistory.filter(entry => entry.version === version);
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    return [];
  }
}

/**
 * Get a specific history entry
 */
export async function getHistoryEntry(historyId: string): Promise<PromptHistoryEntry | null> {
  try {
    const docRef = doc(db, PROMPT_HISTORY_COLLECTION, historyId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as PromptHistoryEntry;
    }

    return null;
  } catch (error) {
    console.error('Error fetching history entry:', error);
    return null;
  }
}

/**
 * Revert to a previous version
 */
export async function revertToHistoryVersion(
  historyId: string,
  userId: string,
  userEmail: string
): Promise<boolean> {
  try {
    const historyEntry = await getHistoryEntry(historyId);
    if (!historyEntry) {
      console.error('History entry not found');
      return false;
    }

    // Save current version to history before reverting
    const currentPromptDoc = doc(db, 'system_prompts/production');
    const currentSnap = await getDoc(currentPromptDoc);

    if (currentSnap.exists()) {
      const currentData = currentSnap.data();
      await savePromptToHistory(
        currentData.content,
        'production',
        userId,
        userEmail,
        `Auto-saved before reverting to version from ${historyEntry.createdOn.toDate().toLocaleDateString()}`
      );
    }

    // Apply the historical version
    await setDoc(currentPromptDoc, {
      content: historyEntry.content,
      version: 'production',
      lastUpdated: serverTimestamp(),
      updatedBy: userId,
      description: `Reverted to version from ${historyEntry.createdOn.toDate().toLocaleDateString()}: ${historyEntry.versionComment}`
    });

    // Create a new history entry for the revert action
    await savePromptToHistory(
      historyEntry.content,
      'production',
      userId,
      userEmail,
      `Reverted to: ${historyEntry.versionComment}`
    );

    console.log('✅ Successfully reverted to history version:', historyId);
    return true;
  } catch (error) {
    console.error('Error reverting to history version:', error);
    return false;
  }
}

/**
 * Get the total count of history entries
 */
export async function getHistoryCount(version: 'production' | 'testing'): Promise<number> {
  try {
    const history = await getPromptHistory(version, 1000);
    return history.length;
  } catch (error) {
    console.error('Error counting history:', error);
    return 0;
  }
}

/**
 * Format timestamp for display
 */
export function formatHistoryDate(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}