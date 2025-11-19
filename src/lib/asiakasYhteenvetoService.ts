/**
 * Asiakas Yhteenveto Prompt Management Service
 *
 * Manages client summary prompts with global LLM settings
 * Collection: ASIAKAS_YHTEENVETO
 * Test file: /public/ASIAKAS_YHTEENVETO_PROMPT.md
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

export interface AsiakasYhteenvetoPrompt {
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

const PROMPTS_COLLECTION = 'ASIAKAS_YHTEENVETO';

/**
 * Get default prompt from /public/ASIAKAS_YHTEENVETO_PROMPT.md
 */
export async function getDefaultPrompt(): Promise<string> {
  try {
    const response = await fetch('/ASIAKAS_YHTEENVETO_PROMPT.md');
    if (response.ok) {
      console.log('✅ Loaded asiakas yhteenveto prompt from /ASIAKAS_YHTEENVETO_PROMPT.md');
      return await response.text();
    }
  } catch (error) {
    console.error('❌ Error loading ASIAKAS_YHTEENVETO_PROMPT.md:', error);
  }

  // Fallback
  return `Olet AI-avustaja, joka luo tiivistelmiä asiakastiedoista.`;
}

/**
 * Get the latest prompt
 */
export async function getLatestPrompt(): Promise<AsiakasYhteenvetoPrompt | null> {
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
      } as AsiakasYhteenvetoPrompt;
    }

    return null;
  } catch (error) {
    console.error('Error fetching latest asiakas yhteenveto prompt:', error);
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
      console.log('📝 Using test asiakas yhteenveto prompt from file');
      try {
        const response = await fetch('/ASIAKAS_YHTEENVETO_PROMPT.md');
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.warn('Could not load test prompt file, falling back to production');
      }
    }

    // Load from Firestore (production)
    if (latest) {
      console.log(`📝 Using production asiakas yhteenveto prompt from ${latest.createdAt.toDate().toLocaleString()}`);
      return latest.content;
    }

    // Fallback to default
    console.log('📝 Using default asiakas yhteenveto prompt');
    return await getDefaultPrompt();
  } catch (error) {
    console.error('Error getting asiakas yhteenveto prompt for generation:', error);
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
    throw new Error('No Asiakas yhteenveto prompt found with LLM model');
  } catch (error) {
    console.error('Error fetching LLM model:', error);
    throw error;
  }
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
    throw new Error('No Asiakas yhteenveto prompt found with temperature');
  } catch (error) {
    console.error('Error fetching temperature:', error);
    throw error;
  }
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
      description: description || 'Asiakas yhteenveto prompt update'
    });

    console.log(`✅ New asiakas yhteenveto prompt saved with ID: ${docRef.id} (Model: ${llmModel}, Temp: ${temperature}, Version: ${promptVersion})`);
    return docRef.id;
  } catch (error) {
    console.error('Error saving asiakas yhteenveto prompt:', error);
    return null;
  }
}

/**
 * Get prompt history (last N prompts)
 */
export async function getPromptHistory(limitCount: number = 50): Promise<AsiakasYhteenvetoPrompt[]> {
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
    } as AsiakasYhteenvetoPrompt));
  } catch (error) {
    console.error('Error fetching asiakas yhteenveto prompt history:', error);
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
        'Initial asiakas yhteenveto prompt'
      );
      console.log('✅ Asiakas yhteenveto prompts initialized');
    }
  } catch (error) {
    console.error('Error initializing asiakas yhteenveto prompts:', error);
  }
}
