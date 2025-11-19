/**
 * Päätös Yhteenveto Prompt Management Service
 *
 * Manages Decision summary prompts with global LLM settings
 * Collection: PAATOS_YHTEENVETO
 * Test file: /public/PAATOS_YHTEENVETO_PROMPT.md
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

export interface PaatosYhteenvetoPrompt {
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

const PROMPTS_COLLECTION = 'PAATOS_YHTEENVETO';

/**
 * Get default prompt from /public/PAATOS_YHTEENVETO_PROMPT.md
 */
export async function getDefaultPrompt(): Promise<string> {
  try {
    const response = await fetch('/PAATOS_YHTEENVETO_PROMPT.md');
    if (response.ok) {
      console.log('✅ Loaded Päätös yhteenveto prompt from /PAATOS_YHTEENVETO_PROMPT.md');
      return await response.text();
    }
  } catch (error) {
    console.error('❌ Error loading PAATOS_YHTEENVETO_PROMPT.md:', error);
  }

  // Fallback
  return `Olet AI-avustaja, joka luo tiivistelmiä päätösdokumenteista.`;
}

/**
 * Get the latest prompt
 */
export async function getLatestPrompt(): Promise<PaatosYhteenvetoPrompt | null> {
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
      } as PaatosYhteenvetoPrompt;
    }

    return null;
  } catch (error) {
    console.error('Error fetching latest Päätös yhteenveto prompt:', error);
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
      console.log('📝 Using test Päätös yhteenveto prompt from file');
      try {
        const response = await fetch('/PAATOS_YHTEENVETO_PROMPT.md');
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.warn('Could not load test prompt file, falling back to production');
      }
    }

    // Load from Firestore (production)
    if (latest) {
      console.log(`📝 Using production Päätös yhteenveto prompt from ${latest.createdAt.toDate().toLocaleString()}`);
      return latest.content;
    }

    // Fallback to default
    console.log('📝 Using default Päätös yhteenveto prompt');
    return await getDefaultPrompt();
  } catch (error) {
    console.error('Error getting Päätös yhteenveto prompt for generation:', error);
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
      description: description || 'Päätös yhteenveto prompt update'
    });

    console.log(`✅ New Päätös yhteenveto prompt saved with ID: ${docRef.id} (Model: ${llmModel}, Temp: ${temperature}, Version: ${promptVersion})`);
    return docRef.id;
  } catch (error) {
    console.error('Error saving Päätös yhteenveto prompt:', error);
    return null;
  }
}

/**
 * Get prompt history (last N prompts)
 */
export async function getPromptHistory(limitCount: number = 50): Promise<PaatosYhteenvetoPrompt[]> {
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
    } as PaatosYhteenvetoPrompt));
  } catch (error) {
    console.error('Error fetching Päätös yhteenveto prompt history:', error);
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
        'Initial Päätös yhteenveto prompt'
      );
      console.log('✅ Päätös yhteenveto prompts initialized');
    }
  } catch (error) {
    console.error('Error initializing Päätös yhteenveto prompts:', error);
  }
}
