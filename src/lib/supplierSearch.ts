import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  QueryConstraint,
  DocumentData,
  startAfter,
  endBefore,
  getFirestore
} from 'firebase/firestore';
import { db } from './firebase';

export interface SearchFilters {
  mainCategory?: string;
  subCategory?: string;
  companyName?: string;
  minSpend?: number;
  maxSpend?: number;
  hasEInvoicing?: boolean;
  hasPOCoverage?: boolean;
  limitResults?: number;
  orderByField?: 'Spend' | 'Business Partner Company Name' | 'Count of Invoice Receipts';
  orderDirection?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  data: DocumentData;
  collection: string;
}

/**
 * Versatile search function for supplier data
 * Can be called by Gemini LLM or directly from UI
 */
export async function searchSupplierData(filters: SearchFilters): Promise<{
  results: SearchResult[];
  summary: {
    totalResults: number;
    totalSpend: number;
    categories: string[];
    subCategories: string[];
  };
}> {
  const results: SearchResult[] = [];
  const constraints: QueryConstraint[] = [];
  
  // Build query constraints based on filters
  if (filters.mainCategory) {
    constraints.push(where('Main Category', '==', filters.mainCategory));
  }
  
  if (filters.subCategory) {
    constraints.push(where('Sub Category', '==', filters.subCategory));
  }
  
  if (filters.companyName) {
    // For partial matching, we'd need to use Algolia or similar
    // For now, exact match
    constraints.push(where('Business Partner Company Name', '==', filters.companyName));
  }
  
  if (filters.minSpend !== undefined) {
    constraints.push(where('Spend', '>=', filters.minSpend));
  }
  
  if (filters.maxSpend !== undefined) {
    constraints.push(where('Spend', '<=', filters.maxSpend));
  }
  
  if (filters.hasEInvoicing !== undefined) {
    constraints.push(where('E-invoicing', '==', filters.hasEInvoicing ? 'YES' : 'NO'));
  }
  
  if (filters.hasPOCoverage !== undefined) {
    constraints.push(where('PO coverage', '==', filters.hasPOCoverage ? 'YES' : 'NO'));
  }
  
  // Add ordering
  const orderField = filters.orderByField || 'Spend';
  const orderDir = filters.orderDirection || 'desc';
  constraints.push(orderBy(orderField, orderDir));
  
  // Add limit if specified
  if (filters.limitResults) {
    constraints.push(limit(filters.limitResults));
  }
  
  // Execute query on supplier_spend collection
  const spendQuery = query(collection(db, 'ext_labour_suppliers'), ...constraints);
  const spendSnapshot = await getDocs(spendQuery);
  
  spendSnapshot.forEach((doc) => {
    results.push({
      id: doc.id,
      data: doc.data(),
      collection: 'ext_labour_suppliers'
    });
  });
  
  // Calculate summary statistics
  const totalSpend = results.reduce((sum, r) => sum + (r.data.Spend || 0), 0);
  const categories = [...new Set(results.map(r => r.data['Main Category']).filter(Boolean))];
  const subCategories = [...new Set(results.map(r => r.data['Sub Category']).filter(Boolean))];
  
  return {
    results,
    summary: {
      totalResults: results.length,
      totalSpend,
      categories,
      subCategories
    }
  };
}

/**
 * Get all unique categories from the database
 */
export async function getCategories(): Promise<{
  mainCategories: string[];
  subCategories: string[];
}> {
  const spendSnapshot = await getDocs(collection(db, 'ext_labour_suppliers'));
  const mainCategories = new Set<string>();
  const subCategories = new Set<string>();
  
  spendSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data['Main Category']) mainCategories.add(data['Main Category']);
    if (data['Sub Category']) subCategories.add(data['Sub Category']);
  });
  
  return {
    mainCategories: Array.from(mainCategories).sort(),
    subCategories: Array.from(subCategories).sort()
  };
}

/**
 * Get supplier details by company name
 */
export async function getSupplierDetails(companyName: string): Promise<DocumentData | null> {
  const q = query(
    collection(db, 'supplier_details'),
    where('Business Partner Company Name', '==', companyName),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    return snapshot.docs[0].data();
  }
  
  return null;
}

/**
 * Search function specifically formatted for Gemini LLM context
 */
export async function searchForGemini(
  mainCategory?: string,
  subCategory?: string,
  topN: number = 10
): Promise<string> {
  const filters: SearchFilters = {
    mainCategory,
    subCategory,
    limitResults: topN,
    orderByField: 'Spend',
    orderDirection: 'desc'
  };
  
  const { results, summary } = await searchSupplierData(filters);
  
  // Format as text for LLM context
  let output = `Supplier Search Results\n`;
  output += `========================\n\n`;
  
  if (mainCategory || subCategory) {
    output += `Filters Applied:\n`;
    if (mainCategory) output += `- Main Category: ${mainCategory}\n`;
    if (subCategory) output += `- Sub Category: ${subCategory}\n`;
    output += `\n`;
  }
  
  output += `Summary:\n`;
  output += `- Total Results: ${summary.totalResults}\n`;
  output += `- Total Spend: €${summary.totalSpend.toLocaleString('fi-FI', { minimumFractionDigits: 2 })}\n\n`;
  
  output += `Top Suppliers:\n`;
  output += `--------------\n`;
  
  results.forEach((result, index) => {
    const data = result.data;
    output += `\n${index + 1}. ${data['Business Partner Company Name']}\n`;
    output += `   Spend: €${data.Spend?.toLocaleString('fi-FI', { minimumFractionDigits: 2 }) || '0'}\n`;
    output += `   Category: ${data['Main Category']} / ${data['Sub Category']}\n`;
    output += `   E-Invoicing: ${data['E-invoicing'] || 'N/A'}\n`;
    output += `   PO Coverage: ${data['PO coverage'] || 'N/A'}\n`;
    output += `   Invoice Count: ${data['Count of Invoice Receipts'] || 0}\n`;
  });
  
  return output;
}

/**
 * Get spending trends by category
 */
export async function getCategorySpendAnalysis(): Promise<{
  byMainCategory: Map<string, number>;
  bySubCategory: Map<string, number>;
  total: number;
}> {
  const snapshot = await getDocs(collection(db, 'ext_labour_suppliers'));
  const byMainCategory = new Map<string, number>();
  const bySubCategory = new Map<string, number>();
  let total = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    const spend = data.Spend || 0;
    total += spend;
    
    if (data['Main Category']) {
      const current = byMainCategory.get(data['Main Category']) || 0;
      byMainCategory.set(data['Main Category'], current + spend);
    }
    
    if (data['Sub Category']) {
      const current = bySubCategory.get(data['Sub Category']) || 0;
      bySubCategory.set(data['Sub Category'], current + spend);
    }
  });
  
  return {
    byMainCategory,
    bySubCategory,
    total
  };
}