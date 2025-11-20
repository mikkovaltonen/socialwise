/**
 * Client Service - Asiakastietojen hallinta Firestoressa
 *
 * Hallinnoi clients ja ASIAKAS_PERUSTIEDOT -kokoelmia.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Client, ClientBasicInfo } from '@/types/client';
import { logger } from './logger';

// ============================================================================
// Constants
// ============================================================================

const CLIENTS_COLLECTION = 'clients';
const CLIENT_BASIC_INFO_COLLECTION = 'ASIAKAS_PERUSTIEDOT';

// ============================================================================
// Client CRUD Operations
// ============================================================================

/**
 * Hae kaikki asiakkaat
 *
 * @param organizationId - Suodata organisaation mukaan (valinnainen)
 * @returns Lista asiakkaista
 */
export async function getClients(organizationId?: string): Promise<Client[]> {
  try {
    const clientsRef = collection(db, CLIENTS_COLLECTION);
    const constraints: QueryConstraint[] = [];

    if (organizationId) {
      constraints.push(where('organizationId', '==', organizationId));
    }

    constraints.push(orderBy('name', 'asc'));

    const q = query(clientsRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Client));
  } catch (error) {
    logger.error('Error fetching clients:', error);
    return [];
  }
}

/**
 * Hae yksittäinen asiakas
 *
 * @param clientId - Asiakkaan tunniste
 * @returns Asiakas tai null
 */
export async function getClient(clientId: string): Promise<Client | null> {
  try {
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
    const clientDoc = await getDoc(clientRef);

    if (!clientDoc.exists()) {
      return null;
    }

    return {
      id: clientDoc.id,
      ...clientDoc.data()
    } as Client;
  } catch (error) {
    logger.error(`Error fetching client ${clientId}:`, error);
    return null;
  }
}

/**
 * Luo uusi asiakas
 *
 * @param client - Asiakkaan tiedot
 * @returns Luotu asiakas tai null virhetilanteessa
 */
export async function createClient(client: Omit<Client, 'createdAt' | 'updatedAt'>): Promise<Client | null> {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      logger.error('User not authenticated');
      return null;
    }

    const clientRef = doc(db, CLIENTS_COLLECTION, client.id);

    const newClient: Client = {
      ...client,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      isActive: client.isActive ?? true,
    };

    await setDoc(clientRef, newClient);

    return newClient;
  } catch (error) {
    logger.error('Error creating client:', error);
    return null;
  }
}

/**
 * Päivitä asiakkaan tiedot
 *
 * @param clientId - Asiakkaan tunniste
 * @param updates - Päivitettävät kentät
 * @returns Onnistuiko päivitys
 */
export async function updateClient(
  clientId: string,
  updates: Partial<Omit<Client, 'id' | 'createdAt' | 'createdBy'>>
): Promise<boolean> {
  try {
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId);

    await updateDoc(clientRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    logger.error(`Error updating client ${clientId}:`, error);
    return false;
  }
}

// ============================================================================
// Client Basic Info Operations (ASIAKAS_PERUSTIEDOT)
// ============================================================================

/**
 * Hae asiakkaan perustiedot (yhteystiedot)
 *
 * @param clientId - Asiakkaan tunniste
 * @returns Perustiedot tai null
 */
export async function getClientBasicInfo(clientId: string): Promise<ClientBasicInfo | null> {
  try {
    const infoRef = doc(db, CLIENT_BASIC_INFO_COLLECTION, clientId);
    const infoDoc = await getDoc(infoRef);

    if (!infoDoc.exists()) {
      logger.debug(`No basic info found for client ${clientId} in ASIAKAS_PERUSTIEDOT`);
      return null;
    }

    return {
      clientId: infoDoc.id,
      ...infoDoc.data()
    } as ClientBasicInfo;
  } catch (error) {
    logger.error(`Error fetching basic info for client ${clientId}:`, error);
    return null;
  }
}

/**
 * Hae kaikki asiakkaiden perustiedot
 *
 * @returns Lista kaikista perustiedoista
 */
export async function getAllClientsBasicInfo(): Promise<ClientBasicInfo[]> {
  try {
    const q = query(collection(db, CLIENT_BASIC_INFO_COLLECTION));
    const querySnapshot = await getDocs(q);

    const basicInfoList: ClientBasicInfo[] = [];
    querySnapshot.forEach((doc) => {
      basicInfoList.push({
        clientId: doc.id,
        ...doc.data()
      } as ClientBasicInfo);
    });

    return basicInfoList;
  } catch (error) {
    logger.error('Error fetching all clients basic info:', error);
    return [];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current user email for audit trail
 */
function getCurrentUserEmail(): string {
  const user = auth.currentUser;
  if (!user) {
    logger.warn('No authenticated user found, using "system" as updatedBy');
    return 'system';
  }
  return user.email || user.uid; // Use email if available, fallback to uid
}

/**
 * Remove undefined values from object recursively
 * Firestore does not accept undefined values - they must be omitted or set to null
 */
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};

  for (const key in obj) {
    if (obj[key] === undefined) {
      continue; // Skip undefined values
    }

    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Timestamp)) {
      // Recursively clean nested objects (but not arrays or Timestamps)
      result[key] = removeUndefined(obj[key]);
    } else if (Array.isArray(obj[key])) {
      // Clean arrays of objects
      result[key] = obj[key].map((item: any) =>
        typeof item === 'object' && item !== null ? removeUndefined(item) : item
      );
    } else {
      result[key] = obj[key];
    }
  }

  return result;
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Tallenna asiakkaan perustiedot
 *
 * @param basicInfo - Perustiedot
 * @returns Onnistuiko tallennus
 */
export async function saveClientBasicInfo(basicInfo: ClientBasicInfo): Promise<boolean> {
  try {
    const userEmail = getCurrentUserEmail();
    if (userEmail === 'system') {
      logger.error('User not authenticated');
      return false;
    }

    const infoRef = doc(db, CLIENT_BASIC_INFO_COLLECTION, basicInfo.clientId);

    // Remove undefined values before saving to Firestore
    const cleanedData = removeUndefined({
      ...basicInfo,
      updatedAt: Timestamp.now(),
      updatedBy: userEmail,
    });

    await setDoc(infoRef, cleanedData);

    return true;
  } catch (error) {
    logger.error('Error saving client basic info:', error);
    return false;
  }
}

/**
 * Päivitä asiakkaan perustiedot
 *
 * @param clientId - Asiakkaan tunniste
 * @param updates - Päivitettävät kentät
 * @returns Onnistuiko päivitys
 */
export async function updateClientBasicInfo(
  clientId: string,
  updates: Partial<Omit<ClientBasicInfo, 'clientId'>>
): Promise<boolean> {
  try {
    const userEmail = getCurrentUserEmail();
    if (userEmail === 'system') {
      logger.error('User not authenticated');
      return false;
    }

    const infoRef = doc(db, CLIENT_BASIC_INFO_COLLECTION, clientId);

    // Remove undefined values before saving to Firestore
    const cleanedData = removeUndefined({
      ...updates,
      updatedAt: Timestamp.now(),
      updatedBy: userEmail,
    });

    await updateDoc(infoRef, cleanedData);

    return true;
  } catch (error) {
    logger.error(`Error updating client basic info for ${clientId}:`, error);
    return false;
  }
}

// ============================================================================
// Search and Filter
// ============================================================================

/**
 * Hae asiakkaita nimellä (osittainen haku)
 *
 * @param searchTerm - Hakusana
 * @param organizationId - Suodata organisaation mukaan (valinnainen)
 * @returns Lista asiakkaista
 */
export async function searchClients(
  searchTerm: string,
  organizationId?: string
): Promise<Client[]> {
  try {
    const clients = await getClients(organizationId);

    // Firestore ei tue suoraa LIKE-hakua, joten tehdään suodatus muistissa
    const lowerSearch = searchTerm.toLowerCase();

    return clients.filter(client =>
      client.name.toLowerCase().includes(lowerSearch) ||
      client.id.toLowerCase().includes(lowerSearch)
    );
  } catch (error) {
    logger.error('Error searching clients:', error);
    return [];
  }
}

/**
 * Hae aktiiviset asiakkaat
 *
 * @param organizationId - Suodata organisaation mukaan (valinnainen)
 * @returns Lista aktiivisista asiakkaista
 */
export async function getActiveClients(organizationId?: string): Promise<Client[]> {
  try {
    const clientsRef = collection(db, CLIENTS_COLLECTION);
    const constraints: QueryConstraint[] = [where('isActive', '==', true)];

    if (organizationId) {
      constraints.push(where('organizationId', '==', organizationId));
    }

    constraints.push(orderBy('name', 'asc'));

    const q = query(clientsRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Client));
  } catch (error) {
    logger.error('Error fetching active clients:', error);
    return [];
  }
}
