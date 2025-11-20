/**
 * Päätös Yhteenveto Prompt Management Service
 *
 * Manages decision summary prompts with global LLM settings
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
      console.log('✅ Loaded päätös yhteenveto prompt from /PAATOS_YHTEENVETO_PROMPT.md');
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
    console.error('Error fetching latest päätös yhteenveto prompt:', error);
    return null;
  }
}

/**
 * Get the production prompt for generation
 */
export async function getPromptForGeneration(): Promise<string> {
  const latestPrompt = await getLatestPrompt();

  if (latestPrompt && latestPrompt.promptVersion === 'production') {
    const timestamp = latestPrompt.createdAt?.toDate().toLocaleString('fi-FI');
    console.log(`📝 Using production päätös yhteenveto prompt from ${timestamp}`);
    return latestPrompt.content;
  }

  // Fallback to default
  console.log('⚠️ No production prompt found, using default PAATOS_YHTEENVETO_PROMPT.md');
  return getDefaultPrompt();
}

/**
 * Get LLM model from latest prompt, fallback to default
 */
export async function getLLMModel(): Promise<string> {
  const latestPrompt = await getLatestPrompt();

  if (latestPrompt && latestPrompt.promptVersion === 'production') {
    return latestPrompt.llmModel;
  }

  // Default model
  return 'x-ai/grok-4-fast';
}

/**
 * Get temperature from latest prompt, fallback to default
 */
export async function getTemperature(): Promise<number> {
  const latestPrompt = await getLatestPrompt();

  if (latestPrompt && latestPrompt.promptVersion === 'production') {
    return latestPrompt.temperature;
  }

  // Default temperature
  return 0.05;
}

/**
 * Save a new prompt version
 */
export async function savePrompt(
  content: string,
  llmModel: string,
  temperature: number,
  promptVersion: 'test' | 'production',
  userId: string,
  userEmail?: string,
  description?: string
): Promise<string> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);

    const docRef = await addDoc(promptsRef, {
      content,
      llmModel,
      temperature,
      promptVersion,
      createdAt: serverTimestamp(),
      createdBy: userId,
      createdByEmail: userEmail,
      description: description || `${promptVersion} version created`
    });

    console.log(`✅ Saved new ${promptVersion} päätös yhteenveto prompt:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving päätös yhteenveto prompt:', error);
    throw error;
  }
}

/**
 * Initialize collection with default prompt if empty
 */
export async function initializePrompts(userId: string, userEmail?: string): Promise<void> {
  try {
    const latestPrompt = await getLatestPrompt();

    if (!latestPrompt) {
      console.log('📝 Initializing PAATOS_YHTEENVETO collection with default prompt...');
      const defaultPrompt = await getDefaultPrompt();

      await savePrompt(
        defaultPrompt,
        'x-ai/grok-4-fast',
        0.05,
        'production',
        userId,
        userEmail,
        'Initial päätös yhteenveto prompt from PAATOS_YHTEENVETO_PROMPT.md'
      );

      console.log('✅ PAATOS_YHTEENVETO collection initialized');
    }
  } catch (error) {
    console.error('Error initializing PAATOS_YHTEENVETO prompts:', error);
  }
}
