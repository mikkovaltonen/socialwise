/**
 * PDF Instruction Service
 *
 * Hallitsee chatbotin PDF-ohjeiden lataamista, parsimista ja tallennusta.
 * - Parsii PDF:n tekstiksi
 * - Konvertoi markdown-muotoon
 * - Laskee tokenit (~4 merkkiä per token)
 * - Tallentaa Firebase Storageen (.md) ja Firestoreen (metadata)
 */

import { ref, uploadString, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { storage, db } from './firebase';

const COLLECTION_NAME = 'chatbot_instruction_docs';
const STORAGE_PATH = 'chatbot-instructions';
const MAX_CONTEXT_TOKENS = 1000000; // 1M tokens

export interface InstructionDocument {
  id?: string;
  filename: string; // e.g., "lastensuojelulaki.md"
  originalFilename: string; // e.g., "Lastensuojelulaki.pdf"
  storagePath: string;
  downloadURL?: string;
  content: string; // Markdown text
  tokenCount: number;
  percentOfContext: number; // % of 1M
  active: boolean;
  createdAt: any;
  createdBy: string;
  createdByEmail?: string;
  description?: string;
}

/**
 * Calculate token count from text
 * Approximation: ~4 characters per token (GPT-style tokenization)
 */
export function calculateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate percentage of 1M token context window
 */
export function calculatePercentOfContext(tokenCount: number): number {
  return Number(((tokenCount / MAX_CONTEXT_TOKENS) * 100).toFixed(2));
}

/**
 * Parse PDF file to text using pdfjs-dist
 */
export async function parsePDFToText(file: File): Promise<string> {
  try {
    // Dynamic import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source - use jsdelivr CDN which has all versions
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

    // Extract text from all pages
    const textPages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      textPages.push(pageText);
    }

    const fullText = textPages.join('\n\n');

    if (fullText.length < 100) {
      throw new Error('PDF sisältää liian vähän tekstiä (< 100 merkkiä)');
    }

    console.log(`✅ Extracted ${fullText.length} characters from ${pdf.numPages} pages`);
    return fullText;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('PDF-parsinta epäonnistui. Varmista että PDF sisältää tekstiä (ei pelkkiä kuvia).');
  }
}

/**
 * Convert text to markdown format
 */
export function convertToMarkdown(text: string, title: string): string {
  return `# ${title}

${text}

---
*Dokumentti parsittu automaattisesti PDF:stä*
`;
}

/**
 * Upload PDF instruction to Firebase
 */
export async function uploadPDFInstruction(
  file: File,
  userId: string,
  userEmail?: string,
  description?: string
): Promise<{ success: boolean; document?: InstructionDocument; error?: string }> {
  try {
    console.log('📄 Starting PDF upload:', file.name);

    // 1. Parse PDF to text
    const text = await parsePDFToText(file);
    console.log(`✅ PDF parsed: ${text.length} characters`);

    // 2. Convert to markdown
    const title = file.name.replace('.pdf', '');
    const markdown = convertToMarkdown(text, title);

    // 3. Calculate tokens
    const tokenCount = calculateTokenCount(markdown);
    const percentOfContext = calculatePercentOfContext(tokenCount);

    console.log(`📊 Tokens: ${tokenCount} (${percentOfContext}% of 1M)`);

    // 4. Generate filename
    const sanitizedFilename = file.name
      .replace('.pdf', '.md')
      .replace(/[^a-zA-Z0-9_\-åäöÅÄÖ.]/g, '_');

    // 5. Upload to Firebase Storage
    const storagePath = `${STORAGE_PATH}/${sanitizedFilename}`;
    const storageRef = ref(storage, storagePath);

    await uploadString(storageRef, markdown, 'raw', {
      contentType: 'text/markdown; charset=utf-8',
    });

    console.log(`✅ Uploaded to Storage: ${storagePath}`);

    // 6. Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // 7. Save metadata to Firestore
    const metadata: Omit<InstructionDocument, 'id'> = {
      filename: sanitizedFilename,
      originalFilename: file.name,
      storagePath,
      downloadURL,
      content: markdown,
      tokenCount,
      percentOfContext,
      active: false, // Default to inactive
      createdAt: serverTimestamp(),
      createdBy: userId,
      createdByEmail: userEmail || '',
      description: description || '',
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), metadata);
    console.log(`✅ Metadata saved to Firestore: ${docRef.id}`);

    return {
      success: true,
      document: {
        ...metadata,
        id: docRef.id,
      } as InstructionDocument,
    };
  } catch (error) {
    console.error('❌ Error uploading PDF instruction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all instruction documents
 */
export async function getAllInstructions(): Promise<InstructionDocument[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InstructionDocument));
  } catch (error) {
    console.error('Error fetching instructions:', error);
    return [];
  }
}

/**
 * Get only active instruction documents
 */
export async function getActiveInstructions(): Promise<InstructionDocument[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InstructionDocument));
  } catch (error) {
    console.error('Error fetching active instructions:', error);
    return [];
  }
}

/**
 * Toggle instruction active status
 */
export async function toggleInstructionActive(
  docId: string,
  active: boolean
): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await updateDoc(docRef, {
      active,
    });

    console.log(`✅ Instruction ${docId} set to ${active ? 'active' : 'inactive'}`);
    return true;
  } catch (error) {
    console.error('Error toggling instruction:', error);
    return false;
  }
}

/**
 * Delete instruction from Storage and Firestore
 * Returns success status and optional error message
 */
export async function deleteInstruction(
  docId: string,
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  let firestoreDeleted = false;
  let storageDeleted = false;
  const errors: string[] = [];

  try {
    // 1. Delete from Firestore FIRST (metadata is more critical)
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, docId));
      console.log(`✅ Deleted from Firestore: ${docId}`);
      firestoreDeleted = true;
    } catch (firestoreError) {
      const msg = `Firestore-poisto epäonnistui: ${firestoreError instanceof Error ? firestoreError.message : 'Tuntematon virhe'}`;
      console.error(msg);
      errors.push(msg);
    }

    // 2. Delete from Storage (allow to fail if file not found)
    if (storagePath) {
      try {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
        console.log(`✅ Deleted from Storage: ${storagePath}`);
        storageDeleted = true;
      } catch (storageError: any) {
        // If file not found, treat as success (already deleted)
        if (storageError?.code === 'storage/object-not-found') {
          console.warn(`⚠️ Storage file not found (already deleted?): ${storagePath}`);
          storageDeleted = true;
        } else {
          const msg = `Storage-poisto epäonnistui: ${storageError instanceof Error ? storageError.message : 'Tuntematon virhe'}`;
          console.error(msg);
          errors.push(msg);
        }
      }
    } else {
      console.warn('⚠️ No storagePath provided, skipping Storage deletion');
      storageDeleted = true; // Treat as success
    }

    // Success if at least Firestore was deleted
    if (firestoreDeleted) {
      return { success: true };
    } else {
      return { success: false, error: errors.join('; ') };
    }
  } catch (error) {
    const msg = `Yleinen virhe poistossa: ${error instanceof Error ? error.message : 'Tuntematon virhe'}`;
    console.error(msg);
    return { success: false, error: msg };
  }
}

/**
 * Get total token count of all active instructions
 */
export async function getTotalActiveTokens(): Promise<{
  totalTokens: number;
  percentOfContext: number;
  activeCount: number;
}> {
  try {
    const activeInstructions = await getActiveInstructions();

    const totalTokens = activeInstructions.reduce(
      (sum, doc) => sum + doc.tokenCount,
      0
    );

    const percentOfContext = calculatePercentOfContext(totalTokens);

    return {
      totalTokens,
      percentOfContext,
      activeCount: activeInstructions.length,
    };
  } catch (error) {
    console.error('Error calculating total tokens:', error);
    return {
      totalTokens: 0,
      percentOfContext: 0,
      activeCount: 0,
    };
  }
}
