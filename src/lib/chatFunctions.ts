/**
 * Chat Functions for AI Assistant
 * These functions are designed to be called by the AI chat interface
 */

import {
  searchTrainingInvoices,
  searchIproContracts,
  searchTrainingSuppliers,
  InvoiceSearchParams,
  ContractSearchParams,
  TrainingSupplierSearchParams,
  InvoiceRecord,
  ContractRecord,
  TrainingSupplierRecord
} from './firestoreDataService';

/**
 * Format invoice record for chat display
 */
function formatInvoiceForChat(invoice: InvoiceRecord): string {
  const amount = invoice.Net_Amount ? `€${invoice.Net_Amount.toLocaleString()}` : 'N/A';
  const date = invoice.Invoice_Date ?
    (invoice.Invoice_Date instanceof Object && 'toDate' in invoice.Invoice_Date ?
      invoice.Invoice_Date.toDate().toLocaleDateString() :
      new Date(invoice.Invoice_Date as string).toLocaleDateString()) :
    'N/A';

  return `• **${invoice.Business_Partner || 'Unknown Supplier'}**
  - Invoice: ${invoice.Invoice_ID || 'N/A'}
  - Amount: ${amount} ${invoice.Reporting_Currency || 'EUR'}
  - Date: ${date}
  - Status: ${invoice.Status || 'Unknown'}
  - Type: ${invoice.Type_Description || 'Standard'}
  - Approver: ${invoice.Approver || 'N/A'}
  - Reviewer: ${invoice.Reviewer || 'N/A'}`;
}

/**
 * Format contract record for chat display
 */
function formatContractForChat(contract: ContractRecord): string {
  const value = contract.Value ? `€${contract.Value.toLocaleString()}` : 'N/A';
  const startDate = contract.Start_Date ?
    (contract.Start_Date instanceof Object && 'toDate' in contract.Start_Date ?
      contract.Start_Date.toDate().toLocaleDateString() :
      new Date(contract.Start_Date as string).toLocaleDateString()) :
    'N/A';
  const endDate = contract.End_Date ?
    (contract.End_Date instanceof Object && 'toDate' in contract.End_Date ?
      contract.End_Date.toDate().toLocaleDateString() :
      new Date(contract.End_Date as string).toLocaleDateString()) :
    'N/A';

  // Extract supplier from various possible fields
  const supplier = contract.Contract_Party_Branch ||
                  contract['Contract Party Branch'] ||
                  contract.Contract_party_branch ||
                  contract.Supplier ||
                  'Unknown Supplier';

  const title = contract.Name_or_title ||
               contract.Title ||
               contract.Contract_Title ||
               contract.Description ||
               'No description';

  return `• **${supplier}**
  - Contract: ${contract.Contract_Number || 'N/A'}
  - Title: ${title}
  - Value: ${value} ${contract.Currency || 'EUR'}
  - Period: ${startDate} to ${endDate}
  - Status: ${contract.Contract_State || contract.Status || 'Unknown'}`;
}

/**
 * Format training supplier record for chat display
 */
function formatTrainingSupplierForChat(supplier: TrainingSupplierRecord): string {
  const pricing = supplier.pricing_per_day_eur ?
    `€${supplier.pricing_per_day_eur}/day` :
    supplier.pricing_per_day_eur_text || 'Contact for pricing';

  const classification = supplier.classification ? `Class ${supplier.classification}` : '';
  const preferred = supplier.preferred_supplier ? '⭐ Preferred' : '';
  const contract = supplier.contract_available ? '📄 Contract Available' : '';
  const hse = supplier.hse_training_provider === 'Yes' ? '🛡️ HSE Provider' : '';

  const badges = [classification, preferred, contract, hse].filter(b => b).join(' | ');

  return `• **${supplier.company_name || 'Unknown Supplier'}**${supplier.supplier_code ? ` (${supplier.supplier_code})` : ''}
  ${badges ? `  ${badges}` : ''}
  - Location: ${supplier.country || 'N/A'} → ${supplier.delivery_country || 'Global'}
  - Service: ${supplier.nature_of_service || 'General Training'}
  - Area: ${supplier.training_area || 'Various'}
  - Pricing: ${pricing}
  - Contact: ${supplier.valmet_contact_person || 'N/A'}
  - Basware: ${supplier.catalog_in_basware ? '✅ In Catalog' : '❌ Not in Catalog'}`;
}

/**
 * Search training invoices from 2023 for chat
 * Collection: invoices_training_2023
 */
export async function search_invoices_training_2023(params: InvoiceSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  invoices: string[];
  summary?: string;
  error?: string;
}> {
  try {
    console.log('🔍 Searching training invoices with params:', params);

    const result = await searchTrainingInvoices(params);

    if (!result.success) {
      return {
        success: false,
        totalFound: 0,
        invoices: [],
        error: result.error
      };
    }

    // Format records for chat display
    const formattedInvoices = result.records.map(formatInvoiceForChat);

    // Calculate summary statistics
    const totalAmount = result.records.reduce((sum, inv) => sum + (inv.Net_Amount || 0), 0);
    const avgAmount = result.records.length > 0 ? totalAmount / result.records.length : 0;

    const summary = result.records.length > 0 ?
      `Found ${result.totalFound} invoice(s). Showing ${result.records.length}. Total: €${totalAmount.toLocaleString()}, Average: €${avgAmount.toLocaleString()}` :
      'No invoices found matching the criteria';

    console.log(`✅ Invoice search complete: ${result.totalFound} found`);

    return {
      success: true,
      totalFound: result.totalFound,
      invoices: formattedInvoices,
      summary
    };
  } catch (error) {
    console.error('Error in search_invoices_training_2023:', error);
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
 * Collection: ipro_contracts
 */
export async function search_ipro_contracts(params: ContractSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  contracts: string[];
  summary?: string;
  error?: string;
}> {
  try {
    console.log('🔍 Searching contracts with params:', params);

    const result = await searchIproContracts(params);

    if (!result.success) {
      return {
        success: false,
        totalFound: 0,
        contracts: [],
        error: result.error
      };
    }

    // Format records for chat display
    const formattedContracts = result.records.map(formatContractForChat);

    // Count active contracts
    const now = new Date();
    const activeCount = result.records.filter(c => {
      if (!c.End_Date) return true;
      const endDate = c.End_Date instanceof Object && 'toDate' in c.End_Date ?
        c.End_Date.toDate() : new Date(c.End_Date as string);
      return endDate >= now;
    }).length;

    const summary = result.records.length > 0 ?
      `Found ${result.totalFound} contract(s). Showing ${result.records.length}. Active: ${activeCount}` :
      'No contracts found matching the criteria';

    console.log(`✅ Contract search complete: ${result.totalFound} found`);

    return {
      success: true,
      totalFound: result.totalFound,
      contracts: formattedContracts,
      summary
    };
  } catch (error) {
    console.error('Error in search_ipro_contracts:', error);
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
 * Collection: training_suppliers
 *
 * @param params - Search parameters limited to:
 *   - deliveryCountry: Country where training can be delivered
 *   - natureOfService: Type/nature of the training service
 *   - trainingArea: Specific area or topic of training
 *   - limit: Maximum number of results to return
 */
export async function search_training_suppliers(params: TrainingSupplierSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  companies: string[];
  countries: string[];
  services: string[];
  areas: string[];
  classifications: string[];
  preferred: boolean[];
  pricings: string[];
  contacts: string[];
  basware: boolean[];
  error?: string;
}> {
  try {
    console.log('🔍 Searching training suppliers with params:', params);

    const result = await searchTrainingSuppliers(params);

    if (!result.success) {
      return {
        success: false,
        totalFound: 0,
        companies: [],
        countries: [],
        services: [],
        areas: [],
        classifications: [],
        preferred: [],
        pricings: [],
        contacts: [],
        basware: [],
        error: result.error
      };
    }

    // Create flat arrays for each field
    const companies = result.records.map(s => s.company_name || 'Unknown');
    const countries = result.records.map(s => s.delivery_country || s.country || 'N/A');
    const services = result.records.map(s => s.nature_of_service || 'General Training');
    const areas = result.records.map(s => s.training_area || 'Various');
    const classifications = result.records.map(s => s.classification || 'N/A');
    const preferred = result.records.map(s => s.preferred_supplier || false);
    const pricings = result.records.map(s =>
      s.pricing_per_day_eur ?
        `€${s.pricing_per_day_eur}/day` :
        s.pricing_per_day_eur_text || 'Contact for pricing'
    );
    const contacts = result.records.map(s => s.valmet_contact_person || 'N/A');
    const basware = result.records.map(s => s.catalog_in_basware || false);


    console.log(`✅ Training supplier search complete: ${result.totalFound} found`);

    return {
      success: true,
      totalFound: result.totalFound,
      companies,
      countries,
      services,
      areas,
      classifications,
      preferred,
      pricings,
      contacts,
      basware
    };
  } catch (error) {
    console.error('Error in search_training_suppliers:', error);
    return {
      success: false,
      totalFound: 0,
      companies: [],
      countries: [],
      services: [],
      areas: [],
      classifications: [],
      preferred: [],
      pricings: [],
      contacts: [],
      basware: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}