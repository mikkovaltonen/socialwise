/**
 * Firestore Data Service
 * Provides access to invoice, contract, and training supplier data
 */

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

// Types for the different collections
export interface InvoiceRecord {
  ERP_ID?: string;
  Invoice_ID?: string;
  Status?: string;
  Business_Partner?: string;
  Net_Amount?: number;
  Reporting_Currency?: string;
  Invoice_Date?: Timestamp | string;
  Type_Description?: string;
  Approver?: string;
  Reviewer?: string;
  URL_Link?: string;
  [key: string]: unknown;
}

export interface ContractRecord {
  Contract_Number?: string;
  Supplier?: string;
  Description?: string;
  Start_Date?: Timestamp | string;
  End_Date?: Timestamp | string;
  Value?: number;
  Currency?: string;
  Status?: string;
  [key: string]: unknown;
}

export interface TrainingSupplierRecord {
  company_name?: string;
  supplier_code?: string;
  is_training_supplier?: boolean;
  pricing_per_day_eur?: number;
  pricing_per_day_eur_text?: string;
  country?: string;
  delivery_country?: string;
  contract_available?: boolean | string;
  classification?: string;
  nature_of_service?: string;
  training_area?: string;
  hse_training_provider?: string;
  valmet_contact_person?: string;
  catalog_in_basware?: boolean;
  preferred_supplier?: boolean;
  [key: string]: unknown;
}

// Search parameters
export interface InvoiceSearchParams {
  businessPartner?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  approver?: string;
  reviewer?: string;
  limit?: number;
}

export interface ContractSearchParams {
  supplier?: string;
  status?: string;
  searchText?: string;
  activeOnly?: boolean;
  limit?: number;
}

export interface TrainingSupplierSearchParams {
  companyName?: string;
  country?: string;
  deliveryCountry?: string;
  natureOfService?: string;
  trainingArea?: string;
  classification?: string;
  hseProvider?: boolean;
  preferredOnly?: boolean;
  hasContract?: boolean;
  limit?: number;
}

/**
 * Search training invoices from 2023
 */
export async function searchTrainingInvoices(params: InvoiceSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  records: InvoiceRecord[];
  error?: string;
}> {
  try {
    // Get all invoices first, then filter client-side to avoid index requirements
    const q = query(
      collection(db, 'invoices_training_2023'),
      orderBy('Invoice_Date', 'desc'),
      limit(1000)  // Get more records initially for filtering
    );

    const querySnapshot = await getDocs(q);

    const allRecords: InvoiceRecord[] = [];
    querySnapshot.forEach((doc) => {
      allRecords.push({ id: doc.id, ...doc.data() } as InvoiceRecord);
    });

    // Apply all filters client-side
    let filteredRecords = allRecords;

    // Business Partner filter (fuzzy match)
    if (params.businessPartner) {
      const searchTerm = params.businessPartner.toLowerCase();
      filteredRecords = filteredRecords.filter(record =>
        record.Business_Partner?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (params.status) {
      filteredRecords = filteredRecords.filter(record =>
        record.Status === params.status
      );
    }

    // Amount filters
    if (params.minAmount !== undefined) {
      filteredRecords = filteredRecords.filter(record =>
        (record.Net_Amount || 0) >= params.minAmount!
      );
    }

    if (params.maxAmount !== undefined) {
      filteredRecords = filteredRecords.filter(record =>
        (record.Net_Amount || 0) <= params.maxAmount!
      );
    }

    // Approver filter (fuzzy match)
    if (params.approver) {
      const searchTerm = params.approver.toLowerCase();
      filteredRecords = filteredRecords.filter(record =>
        record.Approver?.toLowerCase().includes(searchTerm)
      );
    }

    // Reviewer filter (fuzzy match)
    if (params.reviewer) {
      const searchTerm = params.reviewer.toLowerCase();
      filteredRecords = filteredRecords.filter(record =>
        record.Reviewer?.toLowerCase().includes(searchTerm)
      );
    }

    // Date filtering
    if (params.dateFrom || params.dateTo) {
      filteredRecords = filteredRecords.filter(record => {
        if (!record.Invoice_Date) return false;

        const invoiceDate = record.Invoice_Date instanceof Timestamp
          ? record.Invoice_Date.toDate()
          : new Date(record.Invoice_Date as string);

        if (params.dateFrom && invoiceDate < new Date(params.dateFrom)) return false;
        if (params.dateTo && invoiceDate > new Date(params.dateTo)) return false;

        return true;
      });
    }

    // Apply limit after filtering
    const limitedRecords = filteredRecords.slice(0, params.limit || 10);

    console.log(`📊 Invoice search: Found ${filteredRecords.length} matching invoices, returning ${limitedRecords.length}`);

    return {
      success: true,
      totalFound: filteredRecords.length,
      records: limitedRecords
    };
  } catch (error) {
    console.error('Error searching training invoices:', error);
    return {
      success: false,
      totalFound: 0,
      records: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Search iPRO contracts
 */
export async function searchIproContracts(params: ContractSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  records: ContractRecord[];
  error?: string;
}> {
  try {
    // Get all contracts first, then filter client-side
    const q = query(
      collection(db, 'ipro_contracts'),
      limit(1000) // Get more records for filtering
    );

    const querySnapshot = await getDocs(q);
    let records: ContractRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({ id: doc.id, ...data } as ContractRecord);
    });

    // Client-side filtering for flexible search
    if (params.supplier) {
      const searchLower = params.supplier.toLowerCase();
      records = records.filter(r => {
        // Check Contract_Party_Branch and related fields
        const partyBranch = r.Contract_Party_Branch || r['Contract Party Branch'] || r.Contract_party_branch || '';
        const contractTitle = r.Name_or_title || r.Title || r.Contract_Title || '';

        return partyBranch.toLowerCase().includes(searchLower) ||
               contractTitle.toLowerCase().includes(searchLower);
      });
    }

    if (params.searchText) {
      const searchLower = params.searchText.toLowerCase();
      records = records.filter(r =>
        Object.values(r).some(v =>
          v && typeof v === 'string' && v.toLowerCase().includes(searchLower)
        )
      );
    }

    if (params.status) {
      records = records.filter(r => r.Status === params.status);
    }

    if (params.activeOnly) {
      const now = new Date();
      records = records.filter(r => {
        if (!r.End_Date) return true;
        const endDate = r.End_Date instanceof Timestamp
          ? r.End_Date.toDate()
          : new Date(r.End_Date as string);
        return endDate >= now;
      });
    }

    const limitedRecords = records.slice(0, params.limit || 10);
    console.log(`📊 Contract search: Found ${records.length} matching contracts, returning ${limitedRecords.length}`);

    return {
      success: true,
      totalFound: records.length,
      records: limitedRecords
    };
  } catch (error) {
    console.error('Error searching iPRO contracts:', error);
    return {
      success: false,
      totalFound: 0,
      records: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Search training suppliers
 */
export async function searchTrainingSuppliers(params: TrainingSupplierSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  records: TrainingSupplierRecord[];
  error?: string;
}> {
  try {
    // Get all training suppliers, then filter client-side
    const q = query(
      collection(db, 'training_suppliers'),
      limit(1000) // Get more records for filtering
    );
    const querySnapshot = await getDocs(q);

    let records: TrainingSupplierRecord[] = [];
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as TrainingSupplierRecord);
    });

    // Apply filters
    if (params.companyName) {
      const searchLower = params.companyName.toLowerCase();
      records = records.filter(r =>
        r.company_name && r.company_name.toLowerCase().includes(searchLower)
      );
    }

    if (params.country) {
      const searchLower = params.country.toLowerCase();
      records = records.filter(r =>
        r.country && r.country.toLowerCase().includes(searchLower)
      );
    }

    if (params.deliveryCountry) {
      const searchLower = params.deliveryCountry.toLowerCase();
      records = records.filter(r =>
        r.delivery_country && r.delivery_country.toLowerCase().includes(searchLower)
      );
    }

    if (params.natureOfService) {
      const searchLower = params.natureOfService.toLowerCase();
      records = records.filter(r =>
        r.nature_of_service && r.nature_of_service.toLowerCase().includes(searchLower)
      );
    }

    if (params.trainingArea) {
      const searchLower = params.trainingArea.toLowerCase();
      records = records.filter(r =>
        r.training_area && r.training_area.toLowerCase().includes(searchLower)
      );
    }

    if (params.classification) {
      records = records.filter(r => r.classification === params.classification);
    }

    if (params.hseProvider) {
      records = records.filter(r => r.hse_training_provider === 'x');
    }

    if (params.preferredOnly) {
      records = records.filter(r => r.preferred_supplier === true);
    }

    if (params.hasContract !== undefined) {
      if (params.hasContract) {
        records = records.filter(r => r.contract_available === true || r.contract_available === 'Y');
      } else {
        records = records.filter(r => r.contract_available === false || r.contract_available === 'N');
      }
    }

    // Sort by classification (A first, then B, then C) and company name
    records.sort((a, b) => {
      if (a.classification && b.classification && a.classification !== b.classification) {
        return a.classification.localeCompare(b.classification);
      }
      return (a.company_name || '').localeCompare(b.company_name || '');
    });

    // Apply limit
    const totalFound = records.length;
    if (params.limit) {
      records = records.slice(0, params.limit);
    }

    console.log(`🎓 Training supplier search: Found ${totalFound} matching suppliers, returning ${records.length}`);

    return {
      success: true,
      totalFound: totalFound,
      records
    };
  } catch (error) {
    console.error('Error searching training suppliers:', error);
    return {
      success: false,
      totalFound: 0,
      records: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get summary statistics for all collections
 */
export async function getFirestoreDataSummary(): Promise<{
  invoices: { total: number, totalAmount: number, suppliers: string[] };
  contracts: { total: number, active: number, suppliers: string[] };
  trainingSuppliers: { total: number, preferred: number, withContract: number };
}> {
  try {
    // Get invoice stats
    const invoiceSnapshot = await getDocs(collection(db, 'invoices_training_2023'));
    let totalInvoiceAmount = 0;
    const invoiceSuppliers = new Set<string>();

    invoiceSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.Net_Amount) totalInvoiceAmount += data.Net_Amount;
      if (data.Business_Partner) invoiceSuppliers.add(data.Business_Partner);
    });

    // Get contract stats
    const contractSnapshot = await getDocs(collection(db, 'ipro_contracts'));
    let activeContracts = 0;
    const contractSuppliers = new Set<string>();
    const now = new Date();

    contractSnapshot.forEach((doc) => {
      const data = doc.data();

      // Extract supplier from Contract_Party_Branch
      const partyBranch = data.Contract_Party_Branch || data['Contract Party Branch'] || '';
      if (partyBranch) {
        const supplierName = partyBranch.split('/')[0]?.trim();
        if (supplierName) contractSuppliers.add(supplierName);
      }

      // Check if contract is active
      if (data.State === 'Active' || data.Status === 'Active') {
        activeContracts++;
      } else if (data.End_Date) {
        const endDate = data.End_Date instanceof Timestamp
          ? data.End_Date.toDate()
          : new Date(data.End_Date);
        if (endDate >= now) activeContracts++;
      } else if (!data.State && !data.Status) {
        activeContracts++; // No status or end date means active
      }
    });

    // Get training supplier stats
    const supplierSnapshot = await getDocs(collection(db, 'training_suppliers'));
    let preferredSuppliers = 0;
    let suppliersWithContract = 0;

    supplierSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.preferred_supplier === true) preferredSuppliers++;
      if (data.contract_available === true || data.contract_available === 'Y') {
        suppliersWithContract++;
      }
    });

    return {
      invoices: {
        total: invoiceSnapshot.size,
        totalAmount: totalInvoiceAmount,
        suppliers: Array.from(invoiceSuppliers)
      },
      contracts: {
        total: contractSnapshot.size,
        active: activeContracts,
        suppliers: Array.from(contractSuppliers)
      },
      trainingSuppliers: {
        total: supplierSnapshot.size,
        preferred: preferredSuppliers,
        withContract: suppliersWithContract
      }
    };
  } catch (error) {
    console.error('Error getting Firestore data summary:', error);
    return {
      invoices: { total: 0, totalAmount: 0, suppliers: [] },
      contracts: { total: 0, active: 0, suppliers: [] },
      trainingSuppliers: { total: 0, preferred: 0, withContract: 0 }
    };
  }
}