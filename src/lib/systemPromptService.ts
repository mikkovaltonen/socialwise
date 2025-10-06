/**
 * Simplified System Prompt Management Service
 *
 * Structure:
 * - Production prompt: Stored in Firestore, editable
 * - Testing prompt: Always uses /public/system_prompt.md (read-only)
 * - User preferences: Simple flag for production/testing + LLM model
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';
import { savePromptToHistory } from './promptHistoryService';

export type PromptVersion = 'production' | 'testing';
export type LLMModel = 'x-ai/grok-4-fast' | 'google/gemini-2.5-flash' | 'google/gemini-2.5-pro';

export interface SystemPromptData {
  content: string;
  version: PromptVersion;
  selectedModel: LLMModel;
  lastUpdated: Timestamp | null;
  updatedBy: string;
  description?: string;
}

export interface UserPromptPreference {
  userId: string;
  useTestPrompt: boolean; // Simplified: true = testing, false = production
  selectedModel?: LLMModel; // User-specific LLM model preference
  lastUpdated: Timestamp | null;
}

// Simplified collections
const PRODUCTION_PROMPT_DOC = 'system_prompts/production'; // Single production prompt
const USER_PREFERENCES_COLLECTION = 'user_prompt_preferences';

/**
 * Get default system prompt from /public/system_prompt.md
 */
export async function getDefaultSystemPrompt(): Promise<string> {
  try {
    const response = await fetch('/system_prompt.md');
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.error('Error loading system_prompt.md:', error);
  }

  // Fallback
  return `You are a professional procurement assistant for Valmet Corporation.`;
}

/**
 * Get a specific version of the system prompt
 */
export async function getSystemPrompt(version: PromptVersion): Promise<SystemPromptData | null> {
  try {
    // Testing always uses the server file
    if (version === 'testing') {
      const content = await getDefaultSystemPrompt();
      const prodPrompt = await getSystemPrompt('production');
      return {
        content,
        version: 'testing',
        selectedModel: prodPrompt?.selectedModel || 'google/gemini-2.5-flash',
        lastUpdated: null,
        updatedBy: 'system',
        description: 'Testing version (read-only from /public/system_prompt.md)'
      };
    }

    // Production uses Firestore
    const docRef = doc(db, PRODUCTION_PROMPT_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as SystemPromptData;
    }

    // If production doesn't exist, initialize it
    const defaultContent = await getDefaultSystemPrompt();
    return {
      content: defaultContent,
      version: 'production',
      selectedModel: 'google/gemini-2.5-flash',
      lastUpdated: null,
      updatedBy: 'system',
      description: 'Production version'
    };
  } catch (error) {
    console.error(`Error fetching ${version} prompt:`, error);
    return null;
  }
}

/**
 * Save production prompt with history tracking
 */
export async function saveSystemPrompt(
  version: PromptVersion,
  content: string,
  userId: string,
  description?: string,
  versionComment?: string,
  userEmail?: string
): Promise<boolean> {
  try {
    // Only production can be saved
    if (version !== 'production') {
      console.warn('Only production prompt can be saved');
      return false;
    }

    const docRef = doc(db, PRODUCTION_PROMPT_DOC);
    // Get existing model to preserve it
    const existing = await getSystemPrompt('production');

    // Save to history if version comment is provided
    if (versionComment && userEmail) {
      await savePromptToHistory(
        content,
        'production',
        userId,
        userEmail,
        versionComment
      );
    }

    await setDoc(docRef, {
      content,
      version: 'production',
      selectedModel: existing?.selectedModel || 'x-ai/grok-4-fast',
      lastUpdated: serverTimestamp(),
      updatedBy: userId,
      description: description || 'Production system prompt'
    });

    console.log('✅ Production prompt saved');
    return true;
  } catch (error) {
    console.error('Error saving production prompt:', error);
    return false;
  }
}

/**
 * Get user's prompt preference (simplified)
 */
export async function getUserPromptPreference(userId: string): Promise<PromptVersion> {
  try {
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserPromptPreference;
      return data.useTestPrompt ? 'testing' : 'production';
    }

    return 'production'; // Default
  } catch (error) {
    console.error('Error fetching user preference:', error);
    return 'production';
  }
}

/**
 * Set user's prompt preference
 */
export async function setUserPromptPreference(
  userId: string,
  version: PromptVersion
): Promise<boolean> {
  try {
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);

    await setDoc(docRef, {
      userId,
      useTestPrompt: version === 'testing',
      lastUpdated: serverTimestamp()
    });

    console.log(`✅ User preference set to ${version}`);
    return true;
  } catch (error) {
    console.error('Error setting user preference:', error);
    return false;
  }
}

/**
 * Get system-wide LLM model (deprecated - use getUserLLMModel instead)
 */
export async function getSystemLLMModel(): Promise<LLMModel> {
  try {
    const prod = await getSystemPrompt('production');
    return prod?.selectedModel || 'google/gemini-2.5-flash';
  } catch (error) {
    console.error('Error getting system LLM model:', error);
    return 'google/gemini-2.5-flash';
  }
}

/**
 * Get user-specific LLM model preference
 */
export async function getUserLLMModel(userId: string): Promise<LLMModel> {
  try {
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const prefs = docSnap.data() as UserPromptPreference;
      if (prefs.selectedModel) {
        console.log(`📝 Using user-specific model for ${userId}: ${prefs.selectedModel}`);
        return prefs.selectedModel;
      }
    }

    // Fallback to default
    console.log(`📝 Using default model for ${userId}: gemini-2.5-flash`);
    return 'google/gemini-2.5-flash';
  } catch (error) {
    console.error('Error getting user LLM model:', error);
    return 'google/gemini-2.5-flash';
  }
}

/**
 * Set user-specific LLM model preference
 */
export async function setUserLLMModel(userId: string, model: LLMModel): Promise<boolean> {
  try {
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);

    // Get existing preferences to preserve other settings
    const docSnap = await getDoc(docRef);
    const existing = docSnap.exists() ? docSnap.data() as UserPromptPreference : {
      userId,
      useTestPrompt: false,
      lastUpdated: null
    };

    await setDoc(docRef, {
      ...existing,
      selectedModel: model,
      lastUpdated: serverTimestamp()
    });

    console.log(`✅ User ${userId} LLM model set to ${model}`);
    return true;
  } catch (error) {
    console.error('Error setting user LLM model:', error);
    return false;
  }
}

/**
 * Set system-wide LLM model (deprecated - kept for backward compatibility)
 */
export async function setSystemLLMModel(model: LLMModel, userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, PRODUCTION_PROMPT_DOC);

    // Get existing prompt data to preserve it
    const existing = await getSystemPrompt('production');
    if (!existing) {
      console.error('Production prompt not found');
      return false;
    }

    await setDoc(docRef, {
      ...existing,
      selectedModel: model,
      lastUpdated: serverTimestamp(),
      updatedBy: userId
    });

    console.log(`✅ System LLM model set to ${model}`);
    return true;
  } catch (error) {
    console.error('Error setting system LLM model:', error);
    return false;
  }
}

/**
 * Get the appropriate system prompt for a user
 */
export async function getSystemPromptForUser(user: User | null): Promise<string> {
  try {
    // No user = production
    if (!user) {
      const prod = await getSystemPrompt('production');
      return prod?.content || await getDefaultSystemPrompt();
    }

    // Get user preference
    const version = await getUserPromptPreference(user.uid);

    // Testing = always use server file
    if (version === 'testing') {
      console.log(`📝 Using testing prompt (system_prompt.md) for ${user.email}`);
      return await getDefaultSystemPrompt();
    }

    // Production = use Firestore
    const prod = await getSystemPrompt('production');
    console.log(`📝 Using production prompt for ${user.email}`);
    return prod?.content || await getDefaultSystemPrompt();
  } catch (error) {
    console.error('Error getting prompt for user:', error);
    return await getDefaultSystemPrompt();
  }
}

/**
 * Get user's AI configuration
 */
export async function getUserAIConfig(userId: string): Promise<{
  promptVersion: PromptVersion;
  llmModel: LLMModel
}> {
  try {
    const [promptVersion, llmModel] = await Promise.all([
      getUserPromptPreference(userId),
      getUserLLMModel(userId)
    ]);

    return { promptVersion, llmModel };
  } catch (error) {
    console.error('Error getting AI config:', error);
    return {
      promptVersion: 'production',
      llmModel: 'google/gemini-2.5-flash'
    };
  }
}

/**
 * Initialize production prompt if it doesn't exist
 */
export async function initializeSystemPrompts(userId: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTION_PROMPT_DOC);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Initialize with default content
      const content = await getDefaultSystemPrompt();
      await setDoc(docRef, {
        content,
        version: 'production',
        selectedModel: 'google/gemini-2.5-flash',
        lastUpdated: serverTimestamp(),
        updatedBy: userId,
        description: 'Initial production prompt'
      });
      console.log('✅ Production prompt initialized');
    }
  } catch (error) {
    console.error('Error initializing prompts:', error);
  }
}

/**
 * Copy prompt between versions (simplified)
 */
export async function copyPromptVersion(
  from: PromptVersion,
  to: PromptVersion,
  userId: string
): Promise<boolean> {
  try {
    const source = await getSystemPrompt(from);
    if (!source) return false;

    // Can only copy TO production
    if (to !== 'production') {
      console.warn('Can only copy to production');
      return false;
    }

    await saveSystemPrompt('production', source.content, userId, `Copied from ${from}`);
    console.log(`✅ Copied ${from} to production`);
    return true;
  } catch (error) {
    console.error('Error copying prompt:', error);
    return false;
  }
}