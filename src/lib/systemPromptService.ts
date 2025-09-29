/**
 * System Prompt Version Management Service
 * Manages production and testing versions of system prompts in Firestore
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

export type PromptVersion = 'production' | 'testing';

export interface SystemPromptData {
  content: string;
  version: PromptVersion;
  lastUpdated: Timestamp | null;
  updatedBy: string;
  description?: string;
}

export interface UserPromptPreference {
  userId: string;
  selectedVersion: PromptVersion;
  lastUpdated: Timestamp | null;
}

const SYSTEM_PROMPTS_COLLECTION = 'system_prompts';
const USER_PREFERENCES_COLLECTION = 'user_prompt_preferences';

/**
 * Get a specific version of the system prompt
 */
export async function getSystemPrompt(version: PromptVersion): Promise<SystemPromptData | null> {
  try {
    // TESTING version always uses /public/system_prompt.md
    if (version === 'testing') {
      const content = await getDefaultSystemPrompt();
      return {
        content,
        version: 'testing',
        lastUpdated: null,
        updatedBy: 'system',
        description: 'Testing version (read-only from system_prompt.md)'
      };
    }

    // PRODUCTION version uses Firestore
    const docRef = doc(db, SYSTEM_PROMPTS_COLLECTION, version);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as SystemPromptData;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching ${version} system prompt:`, error);
    return null;
  }
}

/**
 * Save or update a system prompt version
 */
export async function saveSystemPrompt(
  version: PromptVersion,
  content: string,
  userId: string,
  description?: string
): Promise<boolean> {
  try {
    // TESTING version cannot be saved (read-only)
    if (version === 'testing') {
      console.warn('⚠️ Testing version is read-only and uses system_prompt.md');
      return false;
    }

    // Only PRODUCTION can be saved
    const docRef = doc(db, SYSTEM_PROMPTS_COLLECTION, version);

    await setDoc(docRef, {
      content,
      version,
      lastUpdated: serverTimestamp(),
      updatedBy: userId,
      description: description || `${version} version of system prompt`
    });

    console.log(`✅ ${version} system prompt saved successfully`);
    return true;
  } catch (error) {
    console.error(`Error saving ${version} system prompt:`, error);
    return false;
  }
}

/**
 * Get user's prompt version preference
 */
export async function getUserPromptPreference(userId: string): Promise<PromptVersion> {
  try {
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserPromptPreference;
      return data.selectedVersion;
    }

    // Default to production if no preference exists
    return 'production';
  } catch (error) {
    console.error('Error fetching user prompt preference:', error);
    return 'production'; // Default to production on error
  }
}

/**
 * Set user's prompt version preference
 */
export async function setUserPromptPreference(
  userId: string,
  version: PromptVersion
): Promise<boolean> {
  try {
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);

    await setDoc(docRef, {
      userId,
      selectedVersion: version,
      lastUpdated: serverTimestamp()
    });

    console.log(`✅ User preference set to ${version}`);
    return true;
  } catch (error) {
    console.error('Error setting user prompt preference:', error);
    return false;
  }
}

/**
 * Get the appropriate system prompt for a user
 * Returns the user's selected version or production as default
 */
export async function getSystemPromptForUser(user: User | null): Promise<string> {
  try {
    // If no user, return production prompt
    if (!user) {
      const prodPrompt = await getSystemPrompt('production');
      return prodPrompt?.content || await getDefaultSystemPrompt();
    }

    // Get user's preference
    const userVersion = await getUserPromptPreference(user.uid);

    // If TESTING, always return current system_prompt.md
    if (userVersion === 'testing') {
      console.log(`📝 Using TESTING prompt (system_prompt.md) for user ${user.email}`);
      return await getDefaultSystemPrompt();
    }

    // Get the selected version
    const prompt = await getSystemPrompt(userVersion);

    if (prompt?.content) {
      console.log(`📝 Using ${userVersion} system prompt for user ${user.email}`);
      return prompt.content;
    }

    // Fallback to production if selected version not found
    const prodPrompt = await getSystemPrompt('production');
    if (prodPrompt?.content) {
      console.log(`📝 Fallback to production prompt for user ${user.email}`);
      return prodPrompt.content;
    }

    // Final fallback to default
    return await getDefaultSystemPrompt();
  } catch (error) {
    console.error('Error getting system prompt for user:', error);
    return await getDefaultSystemPrompt();
  }
}

/**
 * Get default system prompt (fallback)
 */
export async function getDefaultSystemPrompt(): Promise<string> {
  try {
    // Try to load from public/system_prompt.md
    const response = await fetch('/system_prompt.md');
    if (response.ok) {
      const content = await response.text();
      return content;
    }
  } catch (error) {
    console.error('Error loading default prompt from file:', error);
  }

  // Fallback to hardcoded prompt
  return `You are a professional procurement assistant for Valmet Corporation...`;
}

/**
 * Reset a prompt version to default content
 */
export async function resetPromptToDefault(
  version: PromptVersion,
  userId: string
): Promise<boolean> {
  try {
    const defaultContent = await getDefaultSystemPrompt();

    const success = await saveSystemPrompt(
      version,
      defaultContent,
      userId,
      `Reset to default on ${new Date().toISOString()}`
    );

    if (success) {
      console.log(`✅ ${version} prompt reset to default`);
    }

    return success;
  } catch (error) {
    console.error(`Error resetting ${version} prompt to default:`, error);
    return false;
  }
}

/**
 * Initialize system prompts in Firestore if they don't exist
 */
export async function initializeSystemPrompts(userId: string): Promise<void> {
  try {
    // Check if production prompt exists
    const prodPrompt = await getSystemPrompt('production');
    if (!prodPrompt) {
      // Load default content
      const content = await getDefaultSystemPrompt();

      await saveSystemPrompt(
        'production',
        content,
        userId,
        'Production version - stable system prompt for all users'
      );
    }

    // Check if testing prompt exists
    const testPrompt = await getSystemPrompt('testing');
    if (!testPrompt) {
      // Initially, testing can be same as production
      const prodContent = prodPrompt?.content || await getDefaultSystemPrompt();

      await saveSystemPrompt(
        'testing',
        prodContent,
        userId,
        'Testing version - experimental system prompt for testing new features'
      );
    }

    console.log('✅ System prompts initialized');
  } catch (error) {
    console.error('Error initializing system prompts:', error);
  }
}

/**
 * Copy content from one version to another
 */
export async function copyPromptVersion(
  fromVersion: PromptVersion,
  toVersion: PromptVersion,
  userId: string
): Promise<boolean> {
  try {
    const sourcePrompt = await getSystemPrompt(fromVersion);
    if (!sourcePrompt) {
      console.error(`Source prompt ${fromVersion} not found`);
      return false;
    }

    await saveSystemPrompt(
      toVersion,
      sourcePrompt.content,
      userId,
      `Copied from ${fromVersion} on ${new Date().toISOString()}`
    );

    console.log(`✅ Copied ${fromVersion} to ${toVersion}`);
    return true;
  } catch (error) {
    console.error('Error copying prompt version:', error);
    return false;
  }
}