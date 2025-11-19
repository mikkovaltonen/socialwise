/**
 * Firestore Document Service
 *
 * Handles CRUD operations for all document types in Firestore collections:
 * - LASTENSUOJELUILMOITUKSET (LS notifications)
 * - PALVELUTARVEARVIOINNIT (PTA records)
 * - PÄÄTÖKSET (Decisions)
 * - ASIAKASSUUNNITELMAT (Service plans)
 *
 * Structure:
 * - fullMarkdownText: Complete markdown document
 * - metadata: date, summary, urgency, highlights (LLM-generated)
 * - clientId: Links document to client
 * - documentKey: Unique identifier "{clientId}_{timestamp}"
 * - updatedAt, updatedBy: Audit trail
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { generateDocumentSummary } from './documentSummaryService';
import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

export type DocumentCollection =
  | 'LASTENSUOJELUILMOITUKSET'
  | 'PALVELUTARVEARVIOINNIT'
  | 'PÄÄTÖKSET'
  | 'ASIAKASSUUNNITELMAT'
  | 'ASIAKASKIRJAUKSET';

export type DocumentCategory = 'ls-ilmoitus' | 'pta-record' | 'päätös' | 'asiakassuunnitelma' | 'asiakaskirjaus';

export interface BaseDocument {
  clientId: string;
  documentKey: string;
  date: string;
  fullMarkdownText: string;
  summary: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
  category: DocumentCategory;
}

export interface LSNotificationDocument extends BaseDocument {
  category: 'ls-ilmoitus';
  urgency?: 'kriittinen' | 'kiireellinen' | 'normaali' | 'ei_kiireellinen';
  reporter?: {
    name?: string;
    profession?: string;
    organization?: string;
  };
  // LLM-generated structured summary fields
  reporterSummary?: string; // Short form from LLM (e.g., "Koulupsykologi")
  reason?: string; // Longer description from LLM (200-500 chars)
}

export interface PTADocument extends BaseDocument {
  category: 'pta-record';
  eventType?: 'tapaaminen' | 'arviointi' | 'verkostopalaveri' | 'muu';
  status?: 'Kesken' | 'Tulostettu';
}

export interface DecisionDocument extends BaseDocument {
  category: 'päätös';
  decisionType?:
    | 'asiakkuuden_avaaminen'
    | 'asiakkuuden_paattyminen'
    | 'selvitys_aloitetaan'
    | 'kiireellinen_sijoitus'
    | 'avohuollon_tukitoimi'
    | 'muu';
  legalBasis?: string;
  highlights?: string[];
}

export interface ServicePlanDocument extends BaseDocument {
  category: 'asiakassuunnitelma';
  planType?: 'avohuolto' | 'sijaishuolto' | 'jalkihuolto' | 'muu';
  validFrom?: string;
  validTo?: string;
}

export interface CaseNoteDocument extends BaseDocument {
  category: 'asiakaskirjaus';
  manualSummary?: string; // User-written short summary
  keywords?: string[];
}

export type FirestoreDocument =
  | LSNotificationDocument
  | PTADocument
  | DecisionDocument
  | ServicePlanDocument
  | CaseNoteDocument;

export interface ListDocumentsOptions {
  limitCount?: number;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Collection Mapping
// ============================================================================

export function getCategoryFromCollection(collectionName: DocumentCollection): DocumentCategory {
  const mapping: Record<DocumentCollection, DocumentCategory> = {
    LASTENSUOJELUILMOITUKSET: 'ls-ilmoitus',
    PALVELUTARVEARVIOINNIT: 'pta-record',
    PÄÄTÖKSET: 'päätös',
    ASIAKASSUUNNITELMAT: 'asiakassuunnitelma',
    ASIAKASKIRJAUKSET: 'asiakaskirjaus',
  };
  return mapping[collectionName];
}

export function getCollectionFromCategory(category: DocumentCategory): DocumentCollection {
  const mapping: Record<DocumentCategory, DocumentCollection> = {
    'ls-ilmoitus': 'LASTENSUOJELUILMOITUKSET',
    'pta-record': 'PALVELUTARVEARVIOINNIT',
    päätös: 'PÄÄTÖKSET',
    asiakassuunnitelma: 'ASIAKASSUUNNITELMAT',
    asiakaskirjaus: 'ASIAKASKIRJAUKSET',
  };
  return mapping[category];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique document key
 * Format: {clientId}_{timestamp}
 */
export function generateDocumentKey(clientId: string): string {
  const timestamp = Date.now();
  return `${clientId}_${timestamp}`;
}

/**
 * Get current user email for audit trail
 */
function getCurrentUserId(): string {
  const user = auth.currentUser;
  if (!user) {
    logger.warn('No authenticated user found, using "system" as updatedBy');
    return 'system';
  }
  return user.email || user.uid; // Use email if available, fallback to uid
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Save document to Firestore
 * - Creates new document if docId not provided
 * - Updates existing document if docId provided
 * - Generates LLM summary if fullMarkdownText provided
 * - Auto-sets updatedAt and updatedBy
 *
 * @param collectionName - Firestore collection name
 * @param data - Document data (without timestamps)
 * @param docId - Optional document ID (for updates)
 * @returns Document ID
 */
export async function saveDocument(
  collectionName: DocumentCollection,
  data: Partial<FirestoreDocument>,
  docId?: string
): Promise<string> {
  try {
    const category = getCategoryFromCollection(collectionName);
    const userId = getCurrentUserId();

    // Generate LLM summary if fullMarkdownText provided and no summary exists
    let summaryData: any = {};
    if (data.fullMarkdownText && !data.summary) {
      logger.debug(`Generating LLM summary for ${category}...`);
      const summaryObj = await generateDocumentSummary(data.fullMarkdownText, category);

      // summaryObj is now a parsed JSON object (e.g., {date, summary} for PTA)
      summaryData = summaryObj;

      const summaryText = summaryObj.summary || JSON.stringify(summaryObj);
      logger.debug(`Summary generated: ${summaryText.substring(0, 50)}...`);
    }

    // Prepare document data - merge summary fields into document
    const documentData: Partial<FirestoreDocument> = {
      ...data,
      category,
      ...summaryData,  // Spread parsed summary fields (date, summary, reporter, etc.)
      updatedAt: serverTimestamp() as any,
      updatedBy: userId,
    };

    // Set createdAt only for new documents
    if (!docId) {
      documentData.createdAt = serverTimestamp() as any;
      documentData.documentKey = data.documentKey || generateDocumentKey(data.clientId!);
    }

    // Save to Firestore
    const collectionRef = collection(db, collectionName);
    const finalDocId = docId || generateDocumentKey(data.clientId!);
    const docRef = doc(collectionRef, finalDocId);

    await setDoc(docRef, documentData, { merge: true });

    logger.info(`Document saved to ${collectionName}/${finalDocId}`);
    return finalDocId;
  } catch (error) {
    logger.error(`Error saving document to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get single document by ID
 *
 * @param collectionName - Firestore collection name
 * @param docId - Document ID
 * @returns Document data or null if not found
 */
export async function getDocument(
  collectionName: DocumentCollection,
  docId: string
): Promise<FirestoreDocument | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      logger.warn(`Document not found: ${collectionName}/${docId}`);
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as FirestoreDocument;
  } catch (error) {
    logger.error(`Error getting document from ${collectionName}/${docId}:`, error);
    throw error;
  }
}

/**
 * List documents for a client
 *
 * @param collectionName - Firestore collection name
 * @param clientId - Client ID
 * @param options - Optional filters (limit, date range)
 * @returns Array of documents (sorted by date in memory)
 */
export async function listDocuments(
  collectionName: DocumentCollection,
  clientId: string,
  options: ListDocumentsOptions = {}
): Promise<FirestoreDocument[]> {
  try {
    const collectionRef = collection(db, collectionName);

    // Simple query without orderBy to avoid index requirement
    const constraints: QueryConstraint[] = [
      where('clientId', '==', clientId),
    ];

    // Add date range filters if needed
    if (options.dateFrom) {
      constraints.push(where('date', '>=', options.dateFrom));
    }
    if (options.dateTo) {
      constraints.push(where('date', '<=', options.dateTo));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    let documents: FirestoreDocument[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() } as FirestoreDocument);
    });

    // Sort by date in memory (descending)
    documents.sort((a, b) => b.date.localeCompare(a.date));

    // Apply limit after sorting if specified
    if (options.limitCount) {
      documents = documents.slice(0, options.limitCount);
    }

    logger.debug(`Listed ${documents.length} documents from ${collectionName} for client ${clientId}`);
    return documents;
  } catch (error) {
    logger.error(`Error listing documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete document from Firestore
 *
 * @param collectionName - Firestore collection name
 * @param docId - Document ID
 * @returns Success boolean
 */
export async function deleteDocument(
  collectionName: DocumentCollection,
  docId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);

    logger.info(`Document deleted: ${collectionName}/${docId}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting document from ${collectionName}/${docId}:`, error);
    return false;
  }
}

/**
 * Get all documents for a client across all collections
 * Useful for timeline views
 *
 * @param clientId - Client ID
 * @returns Object with documents grouped by collection
 */
export async function getAllClientDocuments(clientId: string): Promise<{
  notifications: LSNotificationDocument[];
  ptaRecords: PTADocument[];
  decisions: DecisionDocument[];
  servicePlans: ServicePlanDocument[];
}> {
  try {
    const [notifications, ptaRecords, decisions, servicePlans] = await Promise.all([
      listDocuments('LASTENSUOJELUILMOITUKSET', clientId),
      listDocuments('PALVELUTARVEARVIOINNIT', clientId),
      listDocuments('PÄÄTÖKSET', clientId),
      listDocuments('ASIAKASSUUNNITELMAT', clientId),
    ]);

    return {
      notifications: notifications as LSNotificationDocument[],
      ptaRecords: ptaRecords as PTADocument[],
      decisions: decisions as DecisionDocument[],
      servicePlans: servicePlans as ServicePlanDocument[],
    };
  } catch (error) {
    logger.error(`Error getting all documents for client ${clientId}:`, error);
    throw error;
  }
}
