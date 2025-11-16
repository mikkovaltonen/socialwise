/**
 * Ilmoitus Summary Service
 *
 * Manages lastensuojeluilmoitus summary generation prompts in Firestore
 * Similar to summaryPromptService but for ilmoitus summary generation
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

const COLLECTION_NAME = 'crm_ilmoitus_summary_prompts';
const PREFERENCES_COLLECTION = 'crm_ilmoitus_summary_preferences';

// Default prompt loaded from file
let DEFAULT_ILMOITUS_PROMPT: string | null = null;

/**
 * Load default ilmoitus summary prompt from file
 */
async function loadDefaultIlmoitusPrompt(): Promise<string> {
  if (DEFAULT_ILMOITUS_PROMPT) {
    return DEFAULT_ILMOITUS_PROMPT;
  }

  try {
    const response = await fetch('/ilmootus_prompt.md');
    if (response.ok) {
      DEFAULT_ILMOITUS_PROMPT = await response.text();
      console.log('✅ Loaded ilmoitus summary prompt from /ilmootus_prompt.md');
      return DEFAULT_ILMOITUS_PROMPT;
    }
  } catch (error) {
    console.warn('⚠️ Could not load ilmootus_prompt.md, using fallback');
  }

  // Fallback if file not found
  DEFAULT_ILMOITUS_PROMPT = `Olet lastensuojelutyön asiantuntija. Analysoi lastensuojeluilmoitus ja palauta VAIN JSON-muotoinen vastaus seuraavassa muodossa:

{
  "luomispäivämäärä": "YYYY-MM-DD",
  "lastensuojelu-ilmootuksen_peruste": "Lyhyt kuvaus perusteesta (max 100 merkkiä)",
  "lastensuojelutarpeen_kiireellisyys": "kriittinen|kiireellinen|normaali|ei_kiireellinen"
}

TÄRKEÄÄ:
- Päivämäärä: Käytä ilmoituksessa mainittua päivämäärää YYYY-MM-DD muodossa
- Peruste: Keskeisin ilmoituksen peruste (max 100 merkkiä)
- Kiireellisyys: Arvioi lapsen turvallisuuden perusteella
- Palauta VAIN JSON, ei mitään muuta tekstiä`;

  return DEFAULT_ILMOITUS_PROMPT;
}

export interface IlmoitusSummaryPrompt {
  id?: string;
  content: string;
  createdAt: Timestamp;
  createdBy: string;
  createdByEmail: string;
  description: string;
}

interface IlmoitusSummaryPreferences {
  llmModel: string;
  temperature: number;
  updatedAt: Timestamp;
}

/**
 * Get the latest ilmoitus summary prompt
 */
export async function getLatestIlmoitusSummaryPrompt(): Promise<IlmoitusSummaryPrompt | null> {
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
    } as IlmoitusSummaryPrompt;
  } catch (error) {
    console.error('Error fetching latest ilmoitus summary prompt:', error);
    return null;
  }
}

/**
 * Save a new ilmoitus summary prompt version
 */
export async function saveIlmoitusSummaryPrompt(
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

    console.log('✅ Ilmoitus summary prompt saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving ilmoitus summary prompt:', error);
    throw error;
  }
}

/**
 * Get ilmoitus prompt history (all versions)
 */
export async function getIlmoitusSummaryPromptHistory(): Promise<IlmoitusSummaryPrompt[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as IlmoitusSummaryPrompt[];
  } catch (error) {
    console.error('Error fetching ilmoitus summary prompt history:', error);
    return [];
  }
}

/**
 * Get ilmoitus summary prompt content for summary generation
 * Returns the latest prompt from Firestore, or default from file if none exists
 */
export async function getIlmoitusSummaryPromptForGeneration(): Promise<string> {
  // Always use file version for now (development)
  console.log('📝 Using ilmoitus summary prompt from file');
  return await loadDefaultIlmoitusPrompt();
}

/**
 * Initialize ilmoitus summary prompts collection with default prompt if empty
 */
export async function initializeIlmoitusSummaryPrompts(userId: string, userEmail: string): Promise<void> {
  try {
    const latest = await getLatestIlmoitusSummaryPrompt();

    if (!latest) {
      console.log('⚙️ No ilmoitus summary prompts found, initializing with default...');
      const defaultPrompt = await loadDefaultIlmoitusPrompt();
      await saveIlmoitusSummaryPrompt(
        defaultPrompt,
        'Default ilmoitus summary generation prompt from ilmootus_prompt.md',
        userId,
        userEmail
      );
      console.log('✅ Default ilmoitus summary prompt initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing ilmoitus summary prompts:', error);
  }
}

/**
 * Get user's LLM model preference for ilmoitus summary generation
 */
export async function getIlmoitusSummaryLLMModel(userId: string): Promise<string> {
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as IlmoitusSummaryPreferences;
      return data.llmModel || 'google/gemini-2.0-flash-exp:free';
    }

    return 'google/gemini-2.0-flash-exp:free'; // Default
  } catch (error) {
    console.error('Error fetching ilmoitus summary LLM model:', error);
    return 'google/gemini-2.0-flash-exp:free';
  }
}

/**
 * Set user's LLM model preference for ilmoitus summary generation
 */
export async function setIlmoitusSummaryLLMModel(userId: string, model: string): Promise<boolean> {
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

    console.log(`✅ Ilmoitus summary LLM model updated to: ${model}`);
    return true;
  } catch (error) {
    console.error('Error updating ilmoitus summary LLM model:', error);
    return false;
  }
}

/**
 * Get user's temperature preference for ilmoitus summary generation
 */
export async function getIlmoitusSummaryTemperature(userId: string): Promise<number> {
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as IlmoitusSummaryPreferences;
      return data.temperature !== undefined ? data.temperature : 0.3;
    }

    return 0.3; // Default
  } catch (error) {
    console.error('Error fetching ilmoitus summary temperature:', error);
    return 0.3;
  }
}

/**
 * Set user's temperature preference for ilmoitus summary generation
 */
export async function setIlmoitusSummaryTemperature(userId: string, temperature: number): Promise<boolean> {
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

    console.log(`✅ Ilmoitus summary temperature updated to: ${temperature}`);
    return true;
  } catch (error) {
    console.error('Error updating ilmoitus summary temperature:', error);
    return false;
  }
}

/**
 * Get user's ilmoitus summary generation preferences (model + temperature)
 */
export async function getIlmoitusSummaryPreferences(userId: string): Promise<{ model: string; temperature: number }> {
  const model = await getIlmoitusSummaryLLMModel(userId);
  const temperature = await getIlmoitusSummaryTemperature(userId);
  return { model, temperature };
}