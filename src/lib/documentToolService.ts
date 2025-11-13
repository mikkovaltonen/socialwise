/**
 * Document Tool Service
 *
 * Enables AI to create and manage documents in Firebase Storage.
 * Used with OpenRouter function calling to allow LLM to create
 * child welfare documents (decisions, case notes, PTA, etc.)
 */

import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { storage, db } from './firebase';

// Allowed document categories
export type DocumentCategory =
  | 'LS-ilmoitukset'
  | 'Asiakaskirjaukset'
  | 'Päätökset'
  | 'PTA'
  | 'Asiakassuunnitelmat';

export interface DocumentMetadata {
  id?: string;
  category: DocumentCategory;
  filename: string;
  clientId: string;
  storagePath: string;
  downloadURL?: string;
  aiGenerated: boolean;
  createdBy: string;
  createdByEmail?: string;
  createdAt: any;
  lastModified?: any;
  contentPreview?: string; // First 200 chars
}

/**
 * Create a new markdown document in Firebase Storage
 */
export async function createDocument(
  category: DocumentCategory,
  filename: string,
  content: string,
  clientId: string,
  userId: string,
  userEmail?: string
): Promise<{ success: boolean; storagePath?: string; downloadURL?: string; error?: string }> {
  try {
    // Sanitize filename (remove special chars, add .md extension if needed)
    let sanitizedFilename = filename.trim();
    if (!sanitizedFilename.endsWith('.md')) {
      sanitizedFilename += '.md';
    }
    sanitizedFilename = sanitizedFilename.replace(/[^a-zA-Z0-9_\-åäöÅÄÖ.]/g, '_');

    // Build storage path: /Aineisto/{category}/{filename}
    const storagePath = `/Aineisto/${category}/${sanitizedFilename}`;
    const storageRef = ref(storage, storagePath);

    // Upload markdown content
    await uploadString(storageRef, content, 'raw', {
      contentType: 'text/markdown; charset=utf-8',
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Save metadata to Firestore
    const metadata: Omit<DocumentMetadata, 'id'> = {
      category,
      filename: sanitizedFilename,
      clientId,
      storagePath,
      downloadURL,
      aiGenerated: true,
      createdBy: userId,
      createdByEmail: userEmail || '',
      createdAt: serverTimestamp(),
      contentPreview: content.substring(0, 200),
    };

    const docRef = await addDoc(collection(db, 'dokumentit'), metadata);
    console.log(`✅ Document created: ${storagePath} (Firestore ID: ${docRef.id})`);

    return {
      success: true,
      storagePath,
      downloadURL,
    };
  } catch (error) {
    console.error('❌ Error creating document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update an existing document in Firebase Storage
 */
export async function updateDocument(
  storagePath: string,
  content: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const storageRef = ref(storage, storagePath);

    // Upload updated content
    await uploadString(storageRef, content, 'raw', {
      contentType: 'text/markdown; charset=utf-8',
    });

    // Update metadata in Firestore (find document by storagePath)
    // Note: This is a simple implementation. For production, you'd want to index by storagePath
    console.log(`✅ Document updated: ${storagePath}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error updating document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a document from Firebase Storage
 */
export async function deleteDocument(
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    console.log(`✅ Document deleted: ${storagePath}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate a filename for a document
 * Format: {ClientId}_{YYYY_MM_DD}_{DocumentType}.md
 * Example: Lapsi_1_2025_01_13_Paatos.md
 */
export function generateFilename(
  clientId: string,
  documentType: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const sanitizedClientId = clientId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedType = documentType.replace(/[^a-zA-Z0-9_-åäöÅÄÖ]/g, '_');

  return `${sanitizedClientId}_${year}_${month}_${day}_${sanitizedType}.md`;
}
