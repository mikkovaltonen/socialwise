/**
 * Simplified System Prompt Management Service
 *
 * Structure:
 * - Collection: botin_ohjeet
 * - Each save creates a new document with timestamp
 * - Always use the latest document (orderBy createdAt desc)
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface SystemPrompt {
  id?: string;
  content: string;
  createdAt: Timestamp;
  createdBy: string;
  createdByEmail?: string;
  description?: string;
}

const PROMPTS_COLLECTION = 'botin_ohjeet';
const USER_PREFERENCES_COLLECTION = 'crm_user_preferences';

/**
 * Get default chatbot prompt from /public/chatbot_prompt.md
 */
export async function getDefaultSystemPrompt(): Promise<string> {
  try {
    const response = await fetch('/chatbot_prompt.md');
    if (response.ok) {
      console.log('✅ Loaded chatbot prompt from /chatbot_prompt.md');
      return await response.text();
    }
  } catch (error) {
    console.warn('⚠️ Could not load chatbot_prompt.md, trying fallback system_prompt.md');
  }

  // Try old filename as fallback
  try {
    const response = await fetch('/system_prompt.md');
    if (response.ok) {
      console.log('✅ Loaded chatbot prompt from /system_prompt.md (fallback)');
      return await response.text();
    }
  } catch (error) {
    console.error('❌ Error loading system_prompt.md:', error);
  }

  // Last resort fallback
  return `Olet SocialWise AI-avustaja, joka tukee sosiaalityöntekijöitä heidän päivittäisessä työssään.`;
}

/**
 * Get the latest system prompt
 */
export async function getLatestSystemPrompt(): Promise<SystemPrompt | null> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);
    const q = query(
      promptsRef,
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as SystemPrompt;
    }

    return null;
  } catch (error) {
    console.error('Error fetching latest prompt:', error);
    return null;
  }
}

/**
 * Get user's prompt version preference (test vs production)
 */
export async function getUserPromptVersion(userId: string): Promise<'test' | 'production'> {
  try {
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.promptVersion || 'production';
    }

    return 'production'; // Default
  } catch (error) {
    console.error('Error fetching prompt version:', error);
    return 'production';
  }
}

/**
 * Set user's prompt version preference
 */
export async function setUserPromptVersion(userId: string, version: 'test' | 'production'): Promise<boolean> {
  try {
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    await setDoc(
      docRef,
      {
        promptVersion: version,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    console.log(`✅ Prompt version updated to: ${version}`);
    return true;
  } catch (error) {
    console.error('Error updating prompt version:', error);
    return false;
  }
}

/**
 * Get system prompt content for user
 */
export async function getSystemPromptForUser(user: any): Promise<string> {
  try {
    // Check user's version preference
    const version = await getUserPromptVersion(user.uid);

    if (version === 'test') {
      // Load from file
      console.log('📝 Using test prompt from /chatbot_prompt.md');
      try {
        const response = await fetch('/chatbot_prompt.md');
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.warn('Could not load test prompt file, falling back to production');
      }
    }

    // Load from Firestore (production)
    const latest = await getLatestSystemPrompt();

    if (latest) {
      console.log(`📝 Using production prompt from ${latest.createdAt.toDate().toLocaleString()}`);
      return latest.content;
    }

    // Fallback to default
    console.log('📝 Using default prompt');
    return await getDefaultSystemPrompt();
  } catch (error) {
    console.error('Error getting prompt for user:', error);
    return await getDefaultSystemPrompt();
  }
}

/**
 * Save a new system prompt (creates new document)
 */
export async function saveSystemPrompt(
  content: string,
  userId: string,
  userEmail?: string,
  description?: string
): Promise<string | null> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);

    const docRef = await addDoc(promptsRef, {
      content,
      createdAt: serverTimestamp(),
      createdBy: userId,
      createdByEmail: userEmail || '',
      description: description || 'System prompt'
    });

    console.log(`✅ New prompt saved with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error saving prompt:', error);
    return null;
  }
}

/**
 * Get prompt history (last N prompts)
 */
export async function getPromptHistory(limitCount: number = 50): Promise<SystemPrompt[]> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);
    const q = query(
      promptsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SystemPrompt));
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    return [];
  }
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  llmModel: string;
  temperature: number;  // Default: 0.05
  updatedAt?: any;
}

/**
 * Get user's preferences (LLM model and temperature)
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const userDoc = await getDoc(doc(db, 'kayttaja_preferenssit', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        llmModel: data.llmModel || 'x-ai/grok-4-fast',
        temperature: data.temperature ?? 0.05,
        updatedAt: data.updatedAt
      };
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
  }
  return {
    llmModel: 'x-ai/grok-4-fast',
    temperature: 0.05
  };
}

/**
 * Get user's LLM model preference
 */
export async function getUserLLMModel(userId: string): Promise<string> {
  const prefs = await getUserPreferences(userId);
  return prefs.llmModel;
}

/**
 * Get user's temperature preference
 */
export async function getUserTemperature(userId: string): Promise<number> {
  const prefs = await getUserPreferences(userId);
  return prefs.temperature;
}

/**
 * Get LLM model for CLIENT SUMMARY generation
 * FIXED: Always uses google/gemini-2.5-flash-lite for fast, cheap summaries
 */
export function getSummaryLLMModel(): string {
  return 'google/gemini-2.5-flash-lite';
}

/**
 * Get LLM model for PTA SUMMARY generation
 * FIXED: Always uses google/gemini-2.5-flash-lite for fast, cheap summaries
 */
export function getPTALLMModel(): string {
  return 'google/gemini-2.5-flash-lite';
}

/**
 * Get temperature for summary generation
 * Lower temperature = more consistent summaries
 */
export function getSummaryTemperature(): number {
  return 0.3;
}

/**
 * Set user's LLM model preference
 */
export async function setUserLLMModel(userId: string, model: string): Promise<boolean> {
  try {
    await setDoc(doc(db, 'kayttaja_preferenssit', userId), {
      llmModel: model,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`✅ User LLM model updated to: ${model}`);
    return true;
  } catch (error) {
    console.error('Error setting user LLM model:', error);
    return false;
  }
}

/**
 * Set user's temperature preference
 */
export async function setUserTemperature(userId: string, temperature: number): Promise<boolean> {
  try {
    await setDoc(doc(db, 'kayttaja_preferenssit', userId), {
      temperature,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`✅ User temperature updated to: ${temperature}`);
    return true;
  } catch (error) {
    console.error('Error setting user temperature:', error);
    return false;
  }
}

/**
 * Initialize system prompts if collection is empty
 */
export async function initializeSystemPrompts(userId: string): Promise<void> {
  try {
    const latest = await getLatestSystemPrompt();

    if (!latest) {
      const content = await getDefaultSystemPrompt();
      await saveSystemPrompt(
        content,
        userId,
        '',
        'Initial system prompt'
      );
      console.log('✅ System prompts initialized');
    }
  } catch (error) {
    console.error('Error initializing prompts:', error);
  }
}
