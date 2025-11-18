/**
 * Ilmoitus Yhteenveto Prompt Management Service
 *
 * Manages notification summary prompts with global LLM settings
 * Collection: ILMOITUS_YHTEENVETO
 * Test file: /public/ILMOITUS_YHTEENVETO_PROMPT.md
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface IlmoitusYhteenvetoPrompt {
  id?: string;
  content: string;
  llmModel: string;
  temperature: number;
  promptVersion: 'test' | 'production';
  createdAt: Timestamp;
  createdBy: string;
  createdByEmail?: string;
  description?: string;
}

const PROMPTS_COLLECTION = 'ILMOITUS_YHTEENVETO';

/**
 * Get default prompt from /public/ILMOITUS_YHTEENVETO_PROMPT.md
 */
export async function getDefaultPrompt(): Promise<string> {
  try {
    const response = await fetch('/ILMOITUS_YHTEENVETO_PROMPT.md');
    if (response.ok) {
      console.log('✅ Loaded ilmoitus yhteenveto prompt from /ILMOITUS_YHTEENVETO_PROMPT.md');
      return await response.text();
    }
  } catch (error) {
    console.error('❌ Error loading ILMOITUS_YHTEENVETO_PROMPT.md:', error);
  }

  // Fallback
  return `Olet AI-avustaja, joka luo tiivistelmiä lastensuojeluilmoituksista.`;
}

/**
 * Get the latest prompt
 */
export async function getLatestPrompt(): Promise<IlmoitusYhteenvetoPrompt | null> {
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
      } as IlmoitusYhteenvetoPrompt;
    }

    return null;
  } catch (error) {
    console.error('Error fetching latest ilmoitus yhteenveto prompt:', error);
    return null;
  }
}

/**
 * Get prompt content for generation (respects promptVersion)
 */
export async function getPromptForGeneration(): Promise<string> {
  try {
    const latest = await getLatestPrompt();

    if (latest && latest.promptVersion === 'test') {
      // Load from file
      console.log('📝 Using test ilmoitus yhteenveto prompt from file');
      try {
        const response = await fetch('/ILMOITUS_YHTEENVETO_PROMPT.md');
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.warn('Could not load test prompt file, falling back to production');
      }
    }

    // Load from Firestore (production)
    if (latest) {
      console.log(`📝 Using production ilmoitus yhteenveto prompt from ${latest.createdAt.toDate().toLocaleString()}`);
      return latest.content;
    }

    // Fallback to default
    console.log('📝 Using default ilmoitus yhteenveto prompt');
    return await getDefaultPrompt();
  } catch (error) {
    console.error('Error getting ilmoitus yhteenveto prompt for generation:', error);
    return await getDefaultPrompt();
  }
}

/**
 * Get LLM model from latest prompt
 */
export async function getLLMModel(): Promise<string> {
  try {
    const latest = await getLatestPrompt();
    if (latest && latest.llmModel) {
      return latest.llmModel;
    }
  } catch (error) {
    console.error('Error fetching LLM model:', error);
  }
  return 'google/gemini-2.5-flash-lite'; // Default
}

/**
 * Get temperature from latest prompt
 */
export async function getTemperature(): Promise<number> {
  try {
    const latest = await getLatestPrompt();
    if (latest && latest.temperature !== undefined) {
      return latest.temperature;
    }
  } catch (error) {
    console.error('Error fetching temperature:', error);
  }
  return 0.3; // Default
}

/**
 * Save a new prompt (creates new document)
 */
export async function savePrompt(
  content: string,
  userId: string,
  llmModel: string,
  temperature: number,
  promptVersion: 'test' | 'production',
  userEmail?: string,
  description?: string
): Promise<string | null> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);

    const docRef = await addDoc(promptsRef, {
      content,
      llmModel,
      temperature,
      promptVersion,
      createdAt: serverTimestamp(),
      createdBy: userId,
      createdByEmail: userEmail || '',
      description: description || 'Ilmoitus yhteenveto prompt update'
    });

    console.log(`✅ New ilmoitus yhteenveto prompt saved with ID: ${docRef.id} (Model: ${llmModel}, Temp: ${temperature}, Version: ${promptVersion})`);
    return docRef.id;
  } catch (error) {
    console.error('Error saving ilmoitus yhteenveto prompt:', error);
    return null;
  }
}

/**
 * Get prompt history (last N prompts)
 */
export async function getPromptHistory(limitCount: number = 50): Promise<IlmoitusYhteenvetoPrompt[]> {
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
    } as IlmoitusYhteenvetoPrompt));
  } catch (error) {
    console.error('Error fetching ilmoitus yhteenveto prompt history:', error);
    return [];
  }
}

/**
 * Initialize prompts if collection is empty
 */
export async function initializePrompts(userId: string): Promise<void> {
  try {
    const latest = await getLatestPrompt();

    if (!latest) {
      const content = await getDefaultPrompt();
      await savePrompt(
        content,
        userId,
        'google/gemini-2.5-flash-lite', // Default LLM model
        0.3, // Default temperature
        'production', // Default prompt version
        '',
        'Initial ilmoitus yhteenveto prompt'
      );
      console.log('✅ Ilmoitus yhteenveto prompts initialized');
    }
  } catch (error) {
    console.error('Error initializing ilmoitus yhteenveto prompts:', error);
  }
}
