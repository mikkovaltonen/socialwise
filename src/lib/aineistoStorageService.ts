/**
 * Firebase Storage Service for Client Data
 *
 * Fetches client data files from Firebase Storage
 * Requires user authentication via Firebase Auth
 *
 * Uusi rakenne: {clientId}/{category}/{filename}.md
 * Vanha rakenne: Aineisto/{category}/{filename}.md (ei enää käytössä)
 */

import { getStorage, ref, getBytes, getMetadata, uploadString, deleteObject, listAll } from 'firebase/storage';
import { auth } from './firebase';
import { logger } from './logger';
import { buildStoragePath } from '@/config/storage';

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
 *
 * @param path - Full storage path (e.g., 'lapsi-1/LS-ilmoitukset/2016_08_03_Lastensuojeluilmoitus.md')
 * @returns File content as string, or null if not found
 */
export async function fetchMarkdownFile(path: string): Promise<string | null> {
  try {
    // Ensure user is authenticated before accessing Storage
    await ensureAuthenticated();

    const storage = getStorage();
    const fileRef = ref(storage, path);

    // Get file bytes directly (uses authenticated user token)
    const arrayBuffer = await getBytes(fileRef);

    // Convert ArrayBuffer to string
    const decoder = new TextDecoder('utf-8');
    const content = decoder.decode(arrayBuffer);

    return content;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not authenticated')) {
      logger.error('Authentication required:', error.message);
    } else if (error instanceof Error && error.message.includes('object-not-found')) {
      // 404 on odotettava tilanne tyhjällä Storagella - ei virhettä, vain debug-viesti
      logger.debug(`File not found in Storage: ${path}`);
    } else {
      // Muut virheet (network, permission, jne.) ovat todellisia ongelmia
      logger.error(`Error fetching file from Firebase Storage (${path}):`, error);
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
 *
 * @param path - Full storage path (e.g., 'lapsi-1/LS-ilmoitukset/2016_08_03_Lastensuojeluilmoitus.md')
 * @returns true if file exists, false otherwise
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    // Ensure user is authenticated before accessing Storage
    await ensureAuthenticated();

    const storage = getStorage();
    const fileRef = ref(storage, path);

    await getMetadata(fileRef);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Upload markdown content to Firebase Storage
 * Requires user authentication
 *
 * @param path - Full storage path (e.g., 'lapsi-1/LS-ilmoitukset/2024_01_15_Lastensuojeluilmoitus.md')
 * @param content - Markdown content to upload
 * @returns true if successful, false otherwise
 */
export async function uploadMarkdownFile(path: string, content: string): Promise<boolean> {
  try {
    // Ensure user is authenticated before uploading
    await ensureAuthenticated();

    const storage = getStorage();
    const fileRef = ref(storage, path);

    // Upload string content as raw text
    await uploadString(fileRef, content, 'raw', {
      contentType: 'text/markdown; charset=utf-8',
    });

    logger.info(`Successfully uploaded: ${path}`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not authenticated')) {
      logger.error('Authentication required:', error.message);
    } else {
      logger.error(`Error uploading file to Firebase Storage (${path}):`, error);
    }
    return false;
  }
}

/**
 * Delete markdown file from Firebase Storage
 * Requires user authentication
 *
 * @param path - Full storage path (e.g., 'lapsi-1/LS-ilmoitukset/2024_01_15_Lastensuojeluilmoitus.md')
 * @returns true if successful, false otherwise
 */
export async function deleteMarkdownFile(path: string): Promise<boolean> {
  try {
    // Ensure user is authenticated before deleting
    await ensureAuthenticated();

    const storage = getStorage();
    const fileRef = ref(storage, path);

    await deleteObject(fileRef);

    logger.info(`Successfully deleted: ${path}`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not authenticated')) {
      logger.error('Authentication required:', error.message);
    } else {
      logger.error(`Error deleting file from Firebase Storage (${path}):`, error);
    }
    return false;
  }
}

/**
 * List all document filenames in a category for a client
 * Uses Firebase Storage listAll() to fetch document list
 * Requires user authentication
 *
 * @param clientId - Client ID (e.g., 'lapsi-1')
 * @param category - Category (e.g., 'LS-ilmoitukset')
 * @returns Array of filenames (e.g., ['2024_01_15_Lastensuojeluilmoitus.md'])
 */
export async function listDocuments(clientId: string, category: string): Promise<string[]> {
  try {
    // Ensure user is authenticated before accessing Storage
    await ensureAuthenticated();

    const storage = getStorage();
    const categoryPath = `${clientId}/${category}`;
    const categoryRef = ref(storage, categoryPath);

    // List all files in the category folder
    const result = await listAll(categoryRef);

    // Extract filenames from full paths
    const filenames = result.items.map(itemRef => {
      // itemRef.name contains just the filename (e.g., '2024_01_15_Lastensuojeluilmoitus.md')
      return itemRef.name;
    });

    logger.debug(`Found ${filenames.length} documents in ${categoryPath}`);
    return filenames;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not authenticated')) {
      logger.error('Authentication required:', error.message);
    } else if (error instanceof Error && error.message.includes('object-not-found')) {
      // Category folder doesn't exist yet - this is normal for new clients
      logger.debug(`Category folder not found: ${clientId}/${category}`);
    } else {
      logger.error(`Error listing documents in ${clientId}/${category}:`, error);
    }
    return [];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build a full storage path for a file
 *
 * @param clientId - Client ID (e.g., 'lapsi-1')
 * @param category - Category (e.g., 'LS-ilmoitukset')
 * @param filename - Filename (e.g., '2024_01_15_Lastensuojeluilmoitus.md')
 * @returns Full storage path
 */
export function buildFilePath(
  clientId: string,
  category: string,
  filename: string
): string {
  return buildStoragePath(clientId, category, filename);
}
