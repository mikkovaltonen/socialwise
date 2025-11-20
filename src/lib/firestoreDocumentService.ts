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
  fullMarkdownText?: string; // Optional - päätös documents use structured fields instead
  summary: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
  category: DocumentCategory;
}

export interface LSNotificationDocument extends BaseDocument {
  category: 'ls-ilmoitus';
  urgency?: 'kriittinen' | 'kiireellinen' | 'normaali' | 'ei_kiireellinen';

  // Structured fields (replaces fullMarkdownText)
  paivays?: string;
  ilmoittajanTiedot?: string;
  lapsenTiedot?: string;
  huoltajienTiedot?: string;
  huolenAiheet?: string;
  ilmoituksenPeruste?: string;
  toimenpiteet?: string;
  allekirjoitusJaKasittely?: string;
}

export interface PTADocument extends BaseDocument {
  category: 'pta-record';
  eventType?: 'tapaaminen' | 'arviointi' | 'verkostopalaveri' | 'muu';
  status?: 'Kesken' | 'Tulostettu';

  // Structured fields (replaces fullMarkdownText)
  paivays?: string;
  perhe?: string;
  tausta?: string;
  palvelut?: string;
  yhteistyotahotJaVerkosto?: string;
  lapsenJaPerheenTapaaminen?: string;
  asiakkaanMielipideJaNakemys?: string;
  sosiaalityontekijanJohtopäätökset?: string;
  arvioOmatyontekijanTarpeesta?: string;
  jakeluJaAllekirjoitus?: string;
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
  editor?: 'botti' | 'ihminen'; // Tracks if created by AI wizard or manually by user

  // Structured päätös fields (replaces fullMarkdownText parsing)
  ratkaisuTaiPaatos?: string;
  asianVireilletulopaiva?: string;
  asianKeskeinenSisalto?: string;
  paatoksenPerustelutJaToimeenpano?: string;
  ratkaisuVoimassa?: string;
  valmistelijaJaSosiaalityontekija?: string;
  ratkaisija?: string;
  tiedoksiantoPMV?: string;
}

export interface ServicePlanDocument extends BaseDocument {
  category: 'asiakassuunnitelma';
  planType?: 'avohuolto' | 'sijaishuolto' | 'jalkihuolto' | 'muu';
  validFrom?: string;
  validTo?: string;
}

export interface CaseNoteDocument extends BaseDocument {
  category: 'asiakaskirjaus';
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
 * - Generates LLM summary if fullMarkdownText OR structured fields provided
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

    // For päätös documents: check if we need to read existing doc to get editor field
    let existingEditor: 'botti' | 'ihminen' | undefined;
    if (category === 'päätös' && docId && !data.editor) {
      try {
        const existingDoc = await getDocument(collectionName, docId);
        if (existingDoc) {
          existingEditor = (existingDoc as any).editor;
          logger.debug(`Found existing päätös editor: ${existingEditor}`);
        }
      } catch (error) {
        logger.warn('Could not read existing document for editor field:', error);
      }
    }

    // Generate LLM summary if needed (and no summary exists)
    let summaryData: any = {};
    if (!data.summary) {
      let contentForSummary: string | object | null = null;

      // Check if we have fullMarkdownText (old format - markdown string)
      if (data.fullMarkdownText) {
        contentForSummary = data.fullMarkdownText;
        logger.debug('Using fullMarkdownText for summary generation');
      }
      // Or check if we have structured fields (new format - JSON object)
      else if (category === 'ls-ilmoitus') {
        const lsData = data as Partial<LSNotificationDocument>;
        if (lsData.paivays || lsData.ilmoittajanTiedot || lsData.huolenAiheet) {
          // Send structured fields directly as JSON object
          contentForSummary = {
            paivays: lsData.paivays,
            ilmoittajanTiedot: lsData.ilmoittajanTiedot,
            lapsenTiedot: lsData.lapsenTiedot,
            huoltajienTiedot: lsData.huoltajienTiedot,
            huolenAiheet: lsData.huolenAiheet,
            ilmoituksenPeruste: lsData.ilmoituksenPeruste,
            toimenpiteet: lsData.toimenpiteet,
            allekirjoitusJaKasittely: lsData.allekirjoitusJaKasittely,
          };
          logger.debug('Using LS-ilmoitus structured fields (JSON) for summary generation');
        }
      } else if (category === 'pta-record') {
        const ptaData = data as Partial<PTADocument>;
        if (ptaData.paivays || ptaData.perhe || ptaData.tausta) {
          // Send structured fields directly as JSON object
          contentForSummary = {
            paivays: ptaData.paivays,
            perhe: ptaData.perhe,
            tausta: ptaData.tausta,
            palvelut: ptaData.palvelut,
            yhteistyotahotJaVerkosto: ptaData.yhteistyotahotJaVerkosto,
            lapsenJaPerheenTapaaminen: ptaData.lapsenJaPerheenTapaaminen,
            asiakkaanMielipideJaNakemys: ptaData.asiakkaanMielipideJaNakemys,
            sosiaalityontekijanJohtopäätökset: ptaData.sosiaalityontekijanJohtopäätökset,
            arvioOmatyontekijanTarpeesta: ptaData.arvioOmatyontekijanTarpeesta,
            jakeluJaAllekirjoitus: ptaData.jakeluJaAllekirjoitus,
          };
          logger.debug('Using PTA structured fields (JSON) for summary generation');
        }
      } else if (category === 'päätös') {
        const paatosData = data as Partial<DecisionDocument>;
        if (paatosData.ratkaisuTaiPaatos || paatosData.asianKeskeinenSisalto) {
          // Send structured fields directly as JSON object
          contentForSummary = {
            ratkaisuTaiPaatos: paatosData.ratkaisuTaiPaatos,
            asianVireilletulopaiva: paatosData.asianVireilletulopaiva,
            asianKeskeinenSisalto: paatosData.asianKeskeinenSisalto,
            paatoksenPerustelutJaToimeenpano: paatosData.paatoksenPerustelutJaToimeenpano,
            ratkaisuVoimassa: paatosData.ratkaisuVoimassa,
            valmistelijaJaSosiaalityontekija: paatosData.valmistelijaJaSosiaalityontekija,
            ratkaisija: paatosData.ratkaisija,
            tiedoksiantoPMV: paatosData.tiedoksiantoPMV,
          };
          logger.debug('Using Päätös structured fields (JSON) for summary generation');
        }
      }
      // Other document types use fullMarkdownText

      // Generate summary from content (if we have any)
      if (contentForSummary) {
        logger.debug(`Generating LLM summary for ${category}...`);

        // Pass editor field to skip botti-created päätös documents
        // Use existing editor if we read it from Firestore (for päätös edits)
        const editor = (data as any).editor || existingEditor;
        logger.debug(`Editor for summary generation: ${editor}`);
        const summaryObj = await generateDocumentSummary(contentForSummary, category, editor);

        // summaryObj is now a parsed JSON object (e.g., {date, summary, reporter, reason} for LS)
        summaryData = summaryObj;

        logger.debug(`Summary data received from LLM:`, summaryData);
        logger.debug(`Summary data type:`, typeof summaryData);
        logger.debug(`Summary data keys:`, Object.keys(summaryData));

        const summaryText = summaryObj.summary || JSON.stringify(summaryObj);
        logger.debug(`Summary generated: ${summaryText.substring(0, 50)}...`);
      }
    }

    // Prepare document data - merge summary fields into document
    const documentData: Partial<FirestoreDocument> = {
      ...data,
      category,
      ...summaryData,  // Spread parsed summary fields (date, summary, reporter, etc.)
      updatedAt: serverTimestamp() as any,
      updatedBy: userId,
    };

    // Fix null date from LLM summary (use fallback to today, ignore placeholder "1900-01-01")
    if (documentData.date === null || documentData.date === undefined || documentData.date === '1900-01-01') {
      documentData.date = new Date().toISOString().split('T')[0];
      logger.debug(`Date was null/placeholder from LLM, using today's date: ${documentData.date}`);
    }

    logger.debug(`Document data after spreading summary:`, {
      hasSummary: !!documentData.summary,
      hasReporter: !!(documentData as any).reporter,
      hasReason: !!(documentData as any).reason,
      summaryKeys: Object.keys(summaryData),
      dateValue: documentData.date,
    });

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
