/**
 * Summary Prompt Service
 *
 * Manages client summary generation prompts in Firestore
 * Similar to systemPromptService but for summary generation
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
  getDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'crm_summary_prompts';
const PREFERENCES_COLLECTION = 'crm_summary_preferences';

// Default prompt loaded from file
let DEFAULT_SUMMARY_PROMPT: string | null = null;

/**
 * Load default summary prompt from file
 */
async function loadDefaultSummaryPrompt(): Promise<string> {
  if (DEFAULT_SUMMARY_PROMPT) {
    return DEFAULT_SUMMARY_PROMPT;
  }

  try {
    const response = await fetch('/summary_prompt.md');
    if (response.ok) {
      DEFAULT_SUMMARY_PROMPT = await response.text();
      console.log('✅ Loaded summary prompt from /summary_prompt.md');
      return DEFAULT_SUMMARY_PROMPT;
    }
  } catch (error) {
    console.warn('⚠️ Could not load summary_prompt.md, using fallback');
  }

  // Fallback if file not found
  DEFAULT_SUMMARY_PROMPT = `Olet lastensuojelun asiantuntija. Analysoi asiakkaan tiedot ja palauta VAIN JSON-muotoinen vastaus seuraavassa muodossa:

{
  "mainProblems": "Lyhyt kuvaus pääongelmista (max 60 merkkiä)",
  "timePeriod": "Aikaväli muodossa DD.MM.YYYY - DD.MM.YYYY"
}

Esimerkki:
{
  "mainProblems": "Koulun käymättömyys, päihteiden käyttö",
  "timePeriod": "15.09.2015 - 20.09.2015"
}

TÄRKEÄÄ:
- Tunnista keskeiset ongelmat (max 2-3 asiaa pilkulla eroteltuna)
- Käytä vain lähdeaineistossa mainittuja ongelmia
- Aikaväli: Ensimmäisestä ilmoituksesta viimeisimpään tapahtumaan
- Palauta VAIN JSON, ei mitään muuta tekstiä`;

  return DEFAULT_SUMMARY_PROMPT;
}

export interface SummaryPrompt {
  id?: string;
  content: string;
  createdAt: Timestamp;
  createdBy: string;
  createdByEmail: string;
  description: string;
}

interface SummaryPreferences {
  llmModel: string;
  temperature: number;
  updatedAt: Timestamp;
}

/**
 * Get the latest summary prompt
 */
export async function getLatestSummaryPrompt(): Promise<SummaryPrompt | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as SummaryPrompt;
  } catch (error) {
    console.error('Error fetching latest summary prompt:', error);
    return null;
  }
}

/**
 * Save a new summary prompt version
 */
export async function saveSummaryPrompt(
  content: string,
  description: string,
  userId: string,
  userEmail: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      content,
      description,
      createdAt: Timestamp.now(),
      createdBy: userId,
      createdByEmail: userEmail,
    });

    console.log('✅ Summary prompt saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving summary prompt:', error);
    throw error;
  }
}

/**
 * Get prompt history (all versions)
 */
export async function getSummaryPromptHistory(): Promise<SummaryPrompt[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SummaryPrompt[];
  } catch (error) {
    console.error('Error fetching summary prompt history:', error);
    return [];
  }
}

/**
 * Get summary prompt content for summary generation
 * Returns the latest prompt from Firestore, or default from file if none exists
 */
export async function getSummaryPromptForGeneration(): Promise<string> {
  const latest = await getLatestSummaryPrompt();

  if (latest && latest.content) {
    console.log('📝 Using custom summary prompt from Firestore');
    return latest.content;
  }

  console.log('📝 Using default summary prompt from file');
  return await loadDefaultSummaryPrompt();
}

/**
 * Initialize summary prompts collection with default prompt if empty
 */
export async function initializeSummaryPrompts(userId: string, userEmail: string): Promise<void> {
  try {
    const latest = await getLatestSummaryPrompt();

    if (!latest) {
      console.log('⚙️ No summary prompts found, initializing with default...');
      const defaultPrompt = await loadDefaultSummaryPrompt();
      await saveSummaryPrompt(
        defaultPrompt,
        'Default summary generation prompt from summary_prompt.md',
        userId,
        userEmail
      );
      console.log('✅ Default summary prompt initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing summary prompts:', error);
  }
}

/**
 * Get user's LLM model preference for summary generation
 */
export async function getSummaryLLMModel(userId: string): Promise<string> {
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as SummaryPreferences;
      return data.llmModel || 'google/gemini-2.0-flash-exp:free';
    }

    return 'google/gemini-2.0-flash-exp:free'; // Default
  } catch (error) {
    console.error('Error fetching summary LLM model:', error);
    return 'google/gemini-2.0-flash-exp:free';
  }
}

/**
 * Set user's LLM model preference for summary generation
 */
export async function setSummaryLLMModel(userId: string, model: string): Promise<boolean> {
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    await setDoc(
      docRef,
      {
        llmModel: model,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    console.log(`✅ Summary LLM model updated to: ${model}`);
    return true;
  } catch (error) {
    console.error('Error updating summary LLM model:', error);
    return false;
  }
}

/**
 * Get user's temperature preference for summary generation
 */
export async function getSummaryTemperature(userId: string): Promise<number> {
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as SummaryPreferences;
      return data.temperature !== undefined ? data.temperature : 0.3;
    }

    return 0.3; // Default
  } catch (error) {
    console.error('Error fetching summary temperature:', error);
    return 0.3;
  }
}

/**
 * Set user's temperature preference for summary generation
 */
export async function setSummaryTemperature(userId: string, temperature: number): Promise<boolean> {
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    await setDoc(
      docRef,
      {
        temperature,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    console.log(`✅ Summary temperature updated to: ${temperature}`);
    return true;
  } catch (error) {
    console.error('Error updating summary temperature:', error);
    return false;
  }
}

/**
 * Get user's summary generation preferences (model + temperature)
 */
export async function getSummaryPreferences(userId: string): Promise<{ model: string; temperature: number }> {
  const model = await getSummaryLLMModel(userId);
  const temperature = await getSummaryTemperature(userId);
  return { model, temperature };
}
