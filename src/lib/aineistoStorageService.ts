/**
 * Firebase Storage Service for Aineisto Client Data
 *
 * Fetches client data files from Firebase Storage
 * Requires user authentication via Firebase Auth
 * Note: DATA_PARSING_DOKUMENTAATIO.md remains in local /public/Aineisto folder
 */

import { getStorage, ref, getBytes, getMetadata, uploadString, deleteObject } from 'firebase/storage';
import { auth } from './firebase';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_BASE_PATH = 'Aineisto';

// ============================================================================
// Authentication Helper
// ============================================================================

/**
 * Ensure user is authenticated before accessing Storage
 * Storage rules require authentication
 */
async function ensureAuthenticated(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already authenticated, resolve immediately
    if (auth.currentUser) {
      resolve();
      return;
    }

    // Wait for auth state to be determined (max 5 seconds)
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Authentication timeout. User must be logged in to access client data.'));
    }, 5000);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      clearTimeout(timeout);
      unsubscribe();

      if (user) {
        resolve();
      } else {
        reject(new Error('User not authenticated. Please log in to access client data.'));
      }
    });
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch a single markdown file from Firebase Storage
 * Requires user authentication
 * @param path - Relative path within Aineisto folder (e.g., 'LS-ilmoitukset/Lapsi_1_2016_08_03_Lastensuojeluilmoitus.md')
 * @returns File content as string, or null if not found
 */
export async function fetchMarkdownFile(path: string): Promise<string | null> {
  try {
    // Ensure user is authenticated before accessing Storage
    await ensureAuthenticated();

    const storage = getStorage();
    const filePath = `${STORAGE_BASE_PATH}/${path}`;
    const fileRef = ref(storage, filePath);

    // Get file bytes directly (uses authenticated user token)
    const arrayBuffer = await getBytes(fileRef);

    // Convert ArrayBuffer to string
    const decoder = new TextDecoder('utf-8');
    const content = decoder.decode(arrayBuffer);

    return content;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not authenticated')) {
      console.error('🔒 Authentication required:', error.message);
    } else {
      console.error(`Error fetching file from Firebase Storage (${path}):`, error);
    }
    return null;
  }
}

/**
 * Fetch multiple markdown files from Firebase Storage
 * @param paths - Array of relative paths
 * @returns Array of file contents (null for files that failed to load)
 */
export async function fetchMarkdownFiles(paths: string[]): Promise<(string | null)[]> {
  return Promise.all(paths.map(path => fetchMarkdownFile(path)));
}

/**
 * Check if a file exists in Firebase Storage
 * Requires user authentication
 * @param path - Relative path within Aineisto folder
 * @returns true if file exists, false otherwise
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    // Ensure user is authenticated before accessing Storage
    await ensureAuthenticated();

    const storage = getStorage();
    const filePath = `${STORAGE_BASE_PATH}/${path}`;
    const fileRef = ref(storage, filePath);

    await getMetadata(fileRef);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Upload markdown content to Firebase Storage
 * Requires user authentication
 * @param path - Relative path within Aineisto folder (e.g., 'LS-ilmoitukset/Lapsi_1_2024_01_15_Lastensuojeluilmoitus.md')
 * @param content - Markdown content to upload
 * @returns true if successful, false otherwise
 */
export async function uploadMarkdownFile(path: string, content: string): Promise<boolean> {
  try {
    // Ensure user is authenticated before uploading
    await ensureAuthenticated();

    const storage = getStorage();
    const filePath = `${STORAGE_BASE_PATH}/${path}`;
    const fileRef = ref(storage, filePath);

    // Upload string content as raw text
    await uploadString(fileRef, content, 'raw', {
      contentType: 'text/markdown; charset=utf-8',
    });

    console.log(`✅ Successfully uploaded: ${filePath}`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not authenticated')) {
      console.error('🔒 Authentication required:', error.message);
    } else {
      console.error(`❌ Error uploading file to Firebase Storage (${path}):`, error);
    }
    return false;
  }
}

/**
 * Delete markdown file from Firebase Storage
 * Requires user authentication
 * @param path - Relative path within Aineisto folder (e.g., 'LS-ilmoitukset/Lapsi_1_2024_01_15_Lastensuojeluilmoitus.md')
 * @returns true if successful, false otherwise
 */
export async function deleteMarkdownFile(path: string): Promise<boolean> {
  try {
    // Ensure user is authenticated before deleting
    await ensureAuthenticated();

    const storage = getStorage();
    const filePath = `${STORAGE_BASE_PATH}/${path}`;
    const fileRef = ref(storage, filePath);

    await deleteObject(fileRef);

    console.log(`✅ Successfully deleted: ${filePath}`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not authenticated')) {
      console.error('🔒 Authentication required:', error.message);
    } else {
      console.error(`❌ Error deleting file from Firebase Storage (${path}):`, error);
    }
    return false;
  }
}

/**
 * Known file paths for each category (in Firebase Storage)
 * These are hardcoded since Firebase Storage doesn't support directory listing
 * without custom backend
 */
export const KNOWN_FILES = {
  'LS-ilmoitukset': [
    'LS-ilmoitukset/Lapsi_1_2016_08_03_Lastensuojeluilmoitus.md',
    'LS-ilmoitukset/Lapsi_1_2017_11_16_Lastensuojeluilmoitus.md',
    'LS-ilmoitukset/Lapsi_1_2018_04_26_Lastensuojeluilmoitus.md',
    // Lapsi 2 dokumentit
    'LS-ilmoitukset/Lapsi_2_2023_10_15_Lastensuojeluilmoitus.md',
    'LS-ilmoitukset/Lapsi_2_2024_01_20_Lastensuojeluilmoitus.md',
  ],
  'Päätökset': [
    'Päätökset/Lapsi_1_2025_03_22_päätös.md',
    // Lapsi 2 dokumentit
    'Päätökset/Lapsi_2_2024_02_10_päätös.md',
  ],
  'Yhteystiedot': [
    'Yhteystiedot/Lapsi_1_yhteystiedot.md',
    // Lapsi 2 dokumentit
    'Yhteystiedot/Lapsi_2_yhteystiedot.md',
  ],
  'PTA': [
    'PTA/PTA_malliasiakas.md',
    // Lapsi 2 dokumentit
    'PTA/PTA_Lapsi_2.md',
  ],
  'Asiakassuunnitelmat': [],
} as const;
