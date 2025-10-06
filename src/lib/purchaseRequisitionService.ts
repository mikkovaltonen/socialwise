/**
 * Purchase Requisition Service - Mini Clone of Basware API
 * 
 * This service implements 10 key features from Basware Purchase Requisition API
 * and saves data to Firestore's purchase_requisitions collection
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { CategorizedError, ErrorType, ErrorSeverity } from './errorHandling';

// Purchase Requisition Status Enum (Basware-style workflow)
export enum RequisitionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ORDERED = 'ordered',
  CANCELLED = 'cancelled'
}

// Purchase Requisition Line Item
export interface RequisitionLineItem {
  lineNumber: number;
  externalCode?: string; // Basware unique identifier
  itemDescription: string;
  productCode?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalAmount: number;
  supplierName?: string;
  supplierCode?: string;
  categoryCode?: string;
  categoryName?: string;
  accountCode?: string;
  costCenter?: string;
  requestedDate: string; // ISO date
  notes?: string;
}

// Main Purchase Requisition Interface (10 key fields from Basware)
export interface PurchaseRequisition {
  // 1. Header Information
  id?: string; // Firestore document ID
  externalCode: string; // Basware external reference
  requisitionNumber?: string; // Auto-generated
  creatorEmail?: string; // Email of the user who created this requisition

  // 2. Requester Information
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  
  // 3. Dates
  createdDate: Timestamp | Date;
  requestedDeliveryDate: string; // ISO date
  lastModifiedDate?: Timestamp;
  
  // 4. Status & Workflow
  status: RequisitionStatus;
  approvalLevel?: number;
  approverId?: string;
  approverName?: string;
  approvalDate?: Timestamp;
  approvalComments?: string;
  
  // 5. Financial Information
  totalAmount: number;
  currency: string;
  budgetCode?: string;
  projectCode?: string;
  
  // 6. Supplier Information
  preferredSupplier?: string;
  supplierCode?: string;
  
  // 7. Delivery Information
  deliveryAddress: {
    locationCode: string;
    locationName: string;
    streetAddress?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  
  // 8. Line Items (Products/Services)
  lineItems: RequisitionLineItem[];
  
  // 9. Business Justification
  businessJustification: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  
  // 10. Attachments & Notes
  attachments?: string[]; // URLs to attached documents
  internalNotes?: string;
  supplierNotes?: string;
}

// Service Class
export class PurchaseRequisitionService {
  private collectionName = 'purchase_requisitions';
  
  /**
   * Create a new purchase requisition
   */
  async createRequisition(
    userId: string,
    requisition: Omit<PurchaseRequisition, 'id' | 'createdDate' | 'requisitionNumber'>,
    userEmail?: string
  ): Promise<string> {
    try {
      // Generate requisition number with new format: creator-email-vendor-date-time
      const requisitionNumber = await this.generateRequisitionNumber(
        userEmail || requisition.requesterEmail,
        requisition.preferredSupplier || requisition.lineItems[0]?.supplierName || 'unknown'
      );

      // Calculate total amount from line items
      const totalAmount = requisition.lineItems.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );

      // Prepare document with creator email
      // Remove undefined fields to avoid Firestore errors
      const cleanRequisition = Object.entries(requisition).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const docData = {
        ...cleanRequisition,
        requisitionNumber,
        creatorEmail: userEmail || requisition.requesterEmail,
        totalAmount,
        createdDate: serverTimestamp(),
        lastModifiedDate: serverTimestamp(),
        status: requisition.status || RequisitionStatus.DRAFT
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, this.collectionName), docData);
      
      console.log('✅ Purchase Requisition created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating purchase requisition:', error);

      // Provide detailed error information
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          throw new CategorizedError(
            ErrorType.PERMISSION,
            'Insufficient permissions to create purchase requisition',
            { originalError: error.message, userId },
            ErrorSeverity.HIGH,
            false
          );
        }
        if (error.message.includes('network') || error.message.includes('failed to fetch')) {
          throw new CategorizedError(
            ErrorType.NETWORK,
            'Network error while creating requisition',
            { originalError: error.message },
            ErrorSeverity.LOW,
            true
          );
        }
        if (error.message.includes('invalid') || error.message.includes('required')) {
          throw new CategorizedError(
            ErrorType.VALIDATION,
            error.message,
            { requisitionData: requisition },
            ErrorSeverity.MEDIUM,
            false
          );
        }
      }

      // Default categorized error
      throw new CategorizedError(
        ErrorType.DATABASE,
        `Failed to create purchase requisition: ${error instanceof Error ? error.message : 'Unknown database error'}`,
        { originalError: error, requisitionData: requisition },
        ErrorSeverity.MEDIUM,
        true
      );
    }
  }
  
  /**
   * Update an existing requisition
   */
  async updateRequisition(
    requisitionId: string, 
    updates: Partial<PurchaseRequisition>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, requisitionId);
      
      // Recalculate total if line items changed
      if (updates.lineItems) {
        updates.totalAmount = updates.lineItems.reduce(
          (sum, item) => sum + item.totalAmount, 
          0
        );
      }
      
      await updateDoc(docRef, {
        ...updates,
        lastModifiedDate: serverTimestamp()
      });
      
      console.log('✅ Purchase Requisition updated:', requisitionId);
    } catch (error) {
      console.error('❌ Error updating purchase requisition:', error);
      throw new Error('Failed to update purchase requisition');
    }
  }
  
  /**
   * Get requisition by ID
   */
  async getRequisition(requisitionId: string): Promise<PurchaseRequisition | null> {
    try {
      const docRef = doc(db, this.collectionName, requisitionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as PurchaseRequisition;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting purchase requisition:', error);
      throw new Error('Failed to get purchase requisition');
    }
  }
  
  /**
   * Get all requisitions for a user
   */
  async getUserRequisitions(userId: string): Promise<PurchaseRequisition[]> {
    try {
      // Simplified query without ordering to avoid index requirement
      // TODO: Add composite index for (requesterId, createdDate) for better performance
      const q = query(
        collection(db, this.collectionName),
        where('requesterId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const requisitions: PurchaseRequisition[] = [];

      querySnapshot.forEach((doc) => {
        requisitions.push({
          id: doc.id,
          ...doc.data()
        } as PurchaseRequisition);
      });

      // Sort in memory instead of in query to avoid index requirement
      requisitions.sort((a, b) => {
        const dateA = a.createdDate?.toDate?.() || new Date(0);
        const dateB = b.createdDate?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });

      return requisitions;
    } catch (error) {
      console.error('❌ Error getting user requisitions:', error);
      throw new Error('Failed to get user requisitions');
    }
  }
  
  /**
   * Submit requisition for approval
   */
  async submitForApproval(requisitionId: string): Promise<void> {
    await this.updateRequisition(requisitionId, {
      status: RequisitionStatus.SUBMITTED,
      approvalLevel: 1
    });
  }
  
  /**
   * Approve requisition
   */
  async approveRequisition(
    requisitionId: string, 
    approverId: string, 
    approverName: string, 
    comments?: string
  ): Promise<void> {
    await this.updateRequisition(requisitionId, {
      status: RequisitionStatus.APPROVED,
      approverId,
      approverName,
      approvalDate: new Date(),
      approvalComments: comments
    });
  }
  
  /**
   * Reject requisition
   */
  async rejectRequisition(
    requisitionId: string, 
    approverId: string, 
    approverName: string, 
    reason: string
  ): Promise<void> {
    await this.updateRequisition(requisitionId, {
      status: RequisitionStatus.REJECTED,
      approverId,
      approverName,
      approvalDate: new Date(),
      approvalComments: reason
    });
  }
  
  /**
   * Search requisitions by various criteria
   */
  async searchRequisitions(criteria: {
    status?: RequisitionStatus;
    supplierCode?: string;
    departm

?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<PurchaseRequisition[]> {
    try {
      let q = query(collection(db, this.collectionName));
      
      // Add filters based on criteria
      if (criteria.status) {
        q = query(q, where('status', '==', criteria.status));
      }
      if (criteria.supplierCode) {
        q = query(q, where('supplierCode', '==', criteria.supplierCode));
      }
      if (criteria.department) {
        q = query(q, where('department', '==', criteria.department));
      }
      
      const querySnapshot = await getDocs(q);
      const requisitions: PurchaseRequisition[] = [];
      
      querySnapshot.forEach((doc) => {
        requisitions.push({
          id: doc.id,
          ...doc.data()
        } as PurchaseRequisition);
      });
      
      return requisitions;
    } catch (error) {
      console.error('❌ Error searching requisitions:', error);
      throw new Error('Failed to search requisitions');
    }
  }
  
  /**
   * Generate unique requisition number
   */
  private async generateRequisitionNumber(email: string, vendor: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    // Format: creator-email-vendor-date-time
    // Extract username from email
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    // Clean vendor name
    const vendorClean = vendor.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);

    return `${username}-${vendorClean}-${year}${month}${day}-${hour}${minute}`;
  }
}

// Export singleton instance
export const purchaseRequisitionService = new PurchaseRequisitionService();