/**
 * Firestore Search Functions for AI Chat
 *
 * These functions provide the AI chatbot with access to invoice, contract,
 * and training supplier data from Firestore collections.
 */

import { Timestamp } from 'firebase/firestore';
import {
  searchTrainingInvoices,
  searchIproContracts,
  searchTrainingSuppliers,
  InvoiceSearchParams,
  ContractSearchParams,
  TrainingSupplierSearchParams,
  InvoiceRecord,
  ContractRecord,
  TrainingSupplierRecord,
  getFirestoreDataSummary
} from './firestoreDataService';

/**
 * Format invoice data for chat display
 */
function formatInvoiceForChat(invoice: InvoiceRecord): string {
  const lines: string[] = [];

  lines.push(`**Invoice ID: ${invoice.Invoice_ID || invoice.ERP_ID || 'N/A'}**`);
  if (invoice.Business_Partner) lines.push(`Supplier: ${invoice.Business_Partner}`);
  if (invoice.Net_Amount) lines.push(`Amount: €${invoice.Net_Amount.toLocaleString()} ${invoice.Reporting_Currency || 'EUR'}`);
  if (invoice.Status) lines.push(`Status: ${invoice.Status}`);
  if (invoice.Invoice_Date) {
    const date = invoice.Invoice_Date.toDate ? invoice.Invoice_Date.toDate() : new Date(invoice.Invoice_Date);
    lines.push(`Date: ${date.toLocaleDateString()}`);
  }
  if (invoice.Type_Description) lines.push(`Type: ${invoice.Type_Description}`);
  if (invoice.Approver) lines.push(`Approver: ${invoice.Approver}`);
  if (invoice.Reviewer) lines.push(`Reviewer: ${invoice.Reviewer}`);
  if (invoice.URL_Link) lines.push(`Basware Link: ${invoice.URL_Link}`);

  return lines.join('\n');
}

/**
 * Format contract data for chat display
 */
function formatContractForChat(contract: ContractRecord): string {
  const lines: string[] = [];

  // Get contract name/title
  const contractName = contract.Name_or_title ||
                      contract['Name or title'] ||
                      contract.id ||
                      'N/A';

  lines.push(`**Contract: ${contractName}**`);

  // Get supplier/party info from Contract_Party_Branch field
  const supplier = contract.Contract_Party_Branch ||
                  contract['Contract Party Branch'] ||
                  contract.Contract_party_branch ||
                  'Unknown Party';

  // Extract just the company name from the full string
  const supplierName = supplier.split('/')[0]?.trim() || supplier;
  lines.push(`Party: ${supplierName}`);

  // Get contract type
  const contractType = contract.Contract_type ||
                      contract['Contract type'] ||
                      'N/A';
  lines.push(`Type: ${contractType}`);

  // Get state
  const state = contract.State || contract.state || 'N/A';
  lines.push(`State: ${state}`);

  // Get validity terms
  const validity = contract.Terms_of_Validity ||
                  contract['Terms of Validity'] ||
                  'N/A';
  lines.push(`Validity: ${validity}`);

  // Get description from Name_or_title (truncated)
  const description = contract.Name_or_title ||
                     contract['Contract Description'] ||
                     contract['Description'];
  if (description) lines.push(`Description: ${description}`);

  // Get dates
  if (contract.Start_Date || contract['Start Date']) {
    const startDate = contract.Start_Date || contract['Start Date'];
    const date = startDate.toDate ? startDate.toDate() : new Date(startDate);
    lines.push(`Start Date: ${date.toLocaleDateString()}`);
  }

  if (contract.End_Date || contract['End Date']) {
    const endDate = contract.End_Date || contract['End Date'];
    const date = endDate.toDate ? endDate.toDate() : new Date(endDate);
    lines.push(`End Date: ${date.toLocaleDateString()}`);

    // Check if active
    const now = new Date();
    const endDateObj = endDate.toDate ? endDate.toDate() : new Date(endDate);
    if (endDateObj >= now) {
      lines.push(`Status: ✅ Active`);
    } else {
      lines.push(`Status: ❌ Expired`);
    }
  }

  // Get value
  const value = contract.Value || contract['Contract Value'] || contract['Total Value'];
  const currency = contract.Currency || contract['Currency Code'] || 'EUR';
  if (value) lines.push(`Value: €${value.toLocaleString()} ${currency}`);

  // Get status if explicitly set
  if (contract.Status) lines.push(`Contract Status: ${contract.Status}`);

  return lines.join('\n');
}

/**
 * Format training supplier data for chat display
 */
function formatTrainingSupplierForChat(supplier: TrainingSupplierRecord): string {
  const lines: string[] = [];

  lines.push(`**${supplier.company_name || 'Unknown Supplier'}**`);
  if (supplier.supplier_code) lines.push(`Code: ${supplier.supplier_code}`);

  // Classification and status
  const status: string[] = [];
  if (supplier.classification) status.push(`Class ${supplier.classification}`);
  if (supplier.is_training_supplier) status.push('✅ Training Supplier');
  if (supplier.preferred_supplier) status.push('⭐ Preferred');
  if (supplier.catalog_in_basware) status.push('📋 In Basware');
  if (status.length > 0) lines.push(`Status: ${status.join(', ')}`);

  // Location
  if (supplier.country || supplier.delivery_country) {
    const locations = [supplier.country, supplier.delivery_country].filter(Boolean);
    lines.push(`Location: ${locations.join(' / ')}`);
  }

  // Service details
  if (supplier.nature_of_service) lines.push(`Service Type: ${supplier.nature_of_service}`);
  if (supplier.training_area) lines.push(`Training Area: ${supplier.training_area}`);

  // Pricing
  if (supplier.pricing_per_day_eur) {
    lines.push(`Daily Rate: €${supplier.pricing_per_day_eur}`);
  } else if (supplier.pricing_per_day_eur_text) {
    lines.push(`Pricing: ${supplier.pricing_per_day_eur_text}`);
  }

  // Contract status
  if (supplier.contract_available === true || supplier.contract_available === 'Y') {
    lines.push(`Contract: ✅ Available`);
  } else if (supplier.contract_available === 'Under negotiation') {
    lines.push(`Contract: 🔄 Under negotiation`);
  } else {
    lines.push(`Contract: ❌ No contract`);
  }

  // HSE provider
  if (supplier.hse_training_provider === 'x') {
    lines.push(`HSE Provider: ✅ Yes`);
  }

  // Contact
  if (supplier.valmet_contact_person) {
    lines.push(`Valmet Contact: ${supplier.valmet_contact_person}`);
  }

  return lines.join('\n');
}

/**
 * Search training invoices for chat
 */
export async function searchTrainingInvoicesForChat(params: InvoiceSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  invoices: string[];
  summary?: {
    totalAmount: number;
    suppliers: string[];
  };
  tableData?: any;
  error?: string;
}> {
  console.log('📥 searchTrainingInvoicesForChat called with params:', JSON.stringify(params, null, 2));

  try {
    const result = await searchTrainingInvoices(params);

    if (!result.success) {
      return {
        success: false,
        totalFound: 0,
        invoices: [],
        error: result.error
      };
    }

    // Calculate summary
    const totalAmount = result.records.reduce((sum, inv) => sum + (inv.Net_Amount || 0), 0);
    const suppliers = [...new Set(result.records
      .map(inv => inv.Business_Partner)
      .filter(Boolean))];

    // Format invoices for chat
    const formattedInvoices = result.records.map(formatInvoiceForChat);

    return {
      success: true,
      totalFound: result.totalFound,
      invoices: formattedInvoices,
      summary: {
        totalAmount,
        suppliers
      },
      tableData: formatInvoicesAsTable(result.records)
    };
  } catch (error) {
    console.error('Error in searchTrainingInvoicesForChat:', error);
    return {
      success: false,
      totalFound: 0,
      invoices: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Search iPRO contracts for chat
 */
export async function searchContractsForChat(params: ContractSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  contracts: string[];
  summary?: {
    activeCount: number;
    suppliers: string[];
  };
  tableData?: any;
  error?: string;
}> {
  console.log('📥 searchContractsForChat called with params:', JSON.stringify(params, null, 2));

  try {
    const result = await searchIproContracts(params);

    if (!result.success) {
      return {
        success: false,
        totalFound: 0,
        contracts: [],
        error: result.error
      };
    }

    // Calculate active contracts
    const now = new Date();
    const activeCount = result.records.filter(contract => {
      if (!contract.End_Date) return true;
      const endDate = contract.End_Date.toDate ?
        contract.End_Date.toDate() :
        new Date(contract.End_Date as string);
      return endDate >= now;
    }).length;

    // Get unique suppliers from Contract_Party_Branch field
    const suppliers = [...new Set(result.records
      .map(c => {
        const partyFull = c.Contract_Party_Branch ||
                         c['Contract Party Branch'] ||
                         c.Contract_party_branch;

        if (partyFull && typeof partyFull === 'string') {
          // Extract company name from full string
          return partyFull.split('/')[0]?.trim() || partyFull;
        }
        return null;
      })
      .filter(Boolean))];

    // Format contracts for chat
    const formattedContracts = result.records.map(formatContractForChat);

    return {
      success: true,
      totalFound: result.totalFound,
      contracts: formattedContracts,
      summary: {
        activeCount,
        suppliers
      },
      tableData: formatContractsAsTable(result.records)
    };
  } catch (error) {
    console.error('Error in searchContractsForChat:', error);
    return {
      success: false,
      totalFound: 0,
      contracts: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Search training suppliers for chat
 */
export async function searchTrainingSuppliersForChat(params: TrainingSupplierSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  suppliers: string[];
  summary?: {
    preferredCount: number;
    withContract: number;
    classifications: { A: number, B: number, C: number };
  };
  tableData?: any;
  error?: string;
}> {
  console.log('📥 searchTrainingSuppliersForChat called with params:', JSON.stringify(params, null, 2));

  try {
    const result = await searchTrainingSuppliers(params);

    if (!result.success) {
      return {
        success: false,
        totalFound: 0,
        suppliers: [],
        error: result.error
      };
    }

    // Calculate summary stats
    const preferredCount = result.records.filter(s => s.preferred_supplier === true).length;
    const withContract = result.records.filter(s =>
      s.contract_available === true || s.contract_available === 'Y'
    ).length;

    const classifications = {
      A: result.records.filter(s => s.classification === 'A').length,
      B: result.records.filter(s => s.classification === 'B').length,
      C: result.records.filter(s => s.classification === 'C').length
    };

    // Format suppliers for chat
    const formattedSuppliers = result.records.map(formatTrainingSupplierForChat);

    return {
      success: true,
      totalFound: result.totalFound,
      suppliers: formattedSuppliers,
      summary: {
        preferredCount,
        withContract,
        classifications
      },
      tableData: formatTrainingSuppliersAsTable(result.records)
    };
  } catch (error) {
    console.error('Error in searchTrainingSuppliersForChat:', error);
    return {
      success: false,
      totalFound: 0,
      suppliers: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper functions for formatting
function formatCurrency(amount: number | undefined, currency: string | undefined): string {
  if (!amount) return 'N/A';
  const curr = currency || 'EUR';
  const symbol = curr === 'EUR' ? '€' : curr === 'USD' ? '$' : curr;
  return `${symbol}${amount.toLocaleString()}`;
}

function formatDate(date: any): string {
  if (!date) return 'N/A';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString();
  }
  return 'N/A';
}

/**
 * Format search results as table JSON for rendering
 */
export function formatInvoicesAsTable(invoices: InvoiceRecord[]): any {
  if (invoices.length === 0) return null;

  const rows = invoices.map(invoice => ({
    'Invoice #': invoice.Invoice_Number || invoice.id || 'N/A',
    'Business Partner': invoice.Business_Partner_Name || invoice.Business_Partner || 'N/A',
    'Amount': formatCurrency(
      invoice.Amount_Approved_Invoice_Currency || invoice.Net_Amount,
      invoice.Invoice_Currency
    ),
    'Currency': invoice.Invoice_Currency || 'EUR',
    'Invoice Date': formatDate(invoice.Invoice_Date),
    'Due Date': formatDate(invoice.Due_Date),
    'Payment Date': formatDate(invoice.Cleared_Date),
    'Status': invoice.Document_Status || invoice.Status || 'N/A'
  }));

  return {
    type: 'data_table',
    title: 'Training Invoices 2023',
    description: `Found ${rows.length} invoices`,
    columns: ['Invoice #', 'Business Partner', 'Amount', 'Currency', 'Invoice Date', 'Due Date', 'Payment Date', 'Status'],
    rows: rows,
    format: 'table'
  };
}

export function formatContractsAsTable(contracts: ContractRecord[]): any {
  if (contracts.length === 0) return null;

  const rows = contracts.map(contract => {
    // Get party/supplier info
    const partyFull = contract.Contract_Party_Branch ||
                     contract['Contract Party Branch'] ||
                     contract.Contract_party_branch ||
                     'Unknown';

    // Extract company name from full string (format: "Company / Branch / Location (ID)")
    const partyName = partyFull.split('/')[0]?.trim() || partyFull;

    // Get contract title (truncated for table)
    const title = contract.Name_or_title ||
                 contract['Name or title'] ||
                 contract.id ||
                 'N/A';
    const shortTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;

    // Get contract type
    const contractType = contract.Contract_type ||
                        contract['Contract type'] ||
                        'N/A';

    // Get state
    const state = contract.State || contract.state || 'N/A';

    // Get dates - format as date range
    const startDate = formatDate(contract.Start_Date || contract['Start Date']);
    const endDate = formatDate(contract.End_Date || contract['End Date']);
    const validity = startDate !== 'N/A' || endDate !== 'N/A'
      ? `${startDate} - ${endDate}`
      : contract.Terms_of_Validity || contract['Terms of Validity'] || 'N/A';

    // Get category
    const category = contract.VCS_Category || contract.VCS_Family || 'N/A';

    // Get contact/manager
    const contact = contract.Contract_Responsible ||
                   contract['Contract Responsible'] ||
                   contract.Valmet_Contact ||
                   contract['Valmet Contact'] ||
                   'N/A';

    return {
      'Contract Title': shortTitle,
      'Party/Supplier': partyName,
      'Type': contractType,
      'State': state,
      'Validity': validity,
      'Category': category,
      'Responsible': contact
    };
  });

  return {
    type: 'data_table',
    title: 'iPRO Contracts',
    description: `Found ${rows.length} contracts`,
    columns: ['Contract Title', 'Party/Supplier', 'Type', 'State', 'Validity', 'Category', 'Responsible'],
    rows: rows,
    format: 'table'
  };
}

export function formatTrainingSuppliersAsTable(suppliers: TrainingSupplierRecord[]): any {
  if (suppliers.length === 0) return null;

  const rows = suppliers.map(supplier => ({
    'Company': supplier.company_name || 'N/A',
    'Code': supplier.supplier_code || 'N/A',
    'Classification': supplier.classification || 'N/A',
    'Country': supplier.country || 'N/A',
    'Service Type': supplier.nature_of_service || 'N/A',
    'Training Area': supplier.training_area || 'N/A',
    'Price/Day': supplier.pricing_per_day_eur ?
      `€${supplier.pricing_per_day_eur}` :
      supplier.pricing_per_day_eur_text || 'N/A',
    'Contract': supplier.contract_available === true || supplier.contract_available === 'Y' ? '✅' : '❌',
    'Preferred': supplier.preferred_supplier === true ? '✅' : '❌',
    'HSE Provider': supplier.hse_training_provider === 'x' ? '✅' : '❌'
  }));

  return {
    type: 'data_table',
    title: 'Training Suppliers',
    description: `Found ${rows.length} suppliers`,
    columns: ['Company', 'Code', 'Classification', 'Country', 'Service Type', 'Training Area', 'Price/Day', 'Contract', 'Preferred', 'HSE Provider'],
    rows: rows,
    format: 'table'
  };
}