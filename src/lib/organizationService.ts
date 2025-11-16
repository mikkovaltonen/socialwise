/**
 * Organization Service
 *
 * Manages client organizations and user roles in Firestore
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
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import type { ClientOrganization, UserRole } from '@/data/ls-types';

const ORGANIZATION_COLLECTION = 'crm_client_organizations';

/**
 * Get all client organizations for a user
 */
export async function getUserClientOrganizations(userId: string): Promise<ClientOrganization[]> {
  try {
    const q = query(
      collection(db, ORGANIZATION_COLLECTION),
      where('roles', 'array-contains', { userId, role: 'oma_työntekijä' })
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ClientOrganization[];
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
}

/**
 * Get client organization by client ID
 */
export async function getClientOrganization(clientId: string): Promise<ClientOrganization | null> {
  try {
    const docRef = doc(db, ORGANIZATION_COLLECTION, clientId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as ClientOrganization;
    }

    return null;
  } catch (error) {
    console.error('Error fetching client organization:', error);
    return null;
  }
}

/**
 * Create new client organization
 */
export async function createClientOrganization(
  clientId: string,
  clientName: string,
  socialSecurityNumber: string | undefined,
  creatorUserId: string,
  creatorEmail: string
): Promise<ClientOrganization> {
  const organization: ClientOrganization = {
    clientId,
    clientName,
    socialSecurityNumber,
    roles: [{
      userId: creatorUserId,
      userEmail: creatorEmail,
      role: 'oma_työntekijä'
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await setDoc(doc(db, ORGANIZATION_COLLECTION, clientId), {
      ...organization,
      createdAt: Timestamp.fromDate(organization.createdAt),
      updatedAt: Timestamp.fromDate(organization.updatedAt),
    });

    console.log(`✅ Created organization for client: ${clientName}`);
    return organization;
  } catch (error) {
    console.error('Error creating client organization:', error);
    throw error;
  }
}

/**
 * Update client organization
 */
export async function updateClientOrganization(
  clientId: string,
  updates: Partial<Pick<ClientOrganization, 'clientName' | 'socialSecurityNumber'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, ORGANIZATION_COLLECTION, clientId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Updated organization for client: ${clientId}`);
  } catch (error) {
    console.error('Error updating client organization:', error);
    throw error;
  }
}

/**
 * Add user role to client organization
 */
export async function addUserRole(
  clientId: string,
  userId: string,
  userEmail: string,
  role: UserRole['role']
): Promise<void> {
  try {
    const newRole: UserRole = { userId, userEmail, role };

    await updateDoc(doc(db, ORGANIZATION_COLLECTION, clientId), {
      roles: arrayUnion(newRole),
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Added ${role} role for user ${userEmail} to client ${clientId}`);
  } catch (error) {
    console.error('Error adding user role:', error);
    throw error;
  }
}

/**
 * Remove user role from client organization
 */
export async function removeUserRole(
  clientId: string,
  userId: string,
  role: UserRole['role']
): Promise<void> {
  try {
    // Find the role to remove
    const organization = await getClientOrganization(clientId);
    if (!organization) throw new Error('Organization not found');

    const roleToRemove = organization.roles.find(r => r.userId === userId && r.role === role);
    if (!roleToRemove) throw new Error('Role not found');

    await updateDoc(doc(db, ORGANIZATION_COLLECTION, clientId), {
      roles: arrayRemove(roleToRemove),
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Removed ${role} role for user ${userId} from client ${clientId}`);
  } catch (error) {
    console.error('Error removing user role:', error);
    throw error;
  }
}

/**
 * Check if user has access to client
 */
export async function userHasAccessToClient(
  userId: string,
  clientId: string
): Promise<boolean> {
  try {
    const organization = await getClientOrganization(clientId);
    return organization?.roles.some(role => role.userId === userId) || false;
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

/**
 * Get user's role for a specific client
 */
export async function getUserRoleForClient(
  userId: string,
  clientId: string
): Promise<UserRole['role'] | null> {
  try {
    const organization = await getClientOrganization(clientId);
    const userRole = organization?.roles.find(role => role.userId === userId);
    return userRole?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}