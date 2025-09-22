/**
 * Valmet Supplier Spend Data Search Functions
 * 
 * Search and filter functions for the supplier_spend collection
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

export interface SupplierSearchFilters {
  // Category filters (fuzzy search)
  mainCategory?: string;
  supplierCategories?: string;
  
  // Location filters (fuzzy search)
  country?: string;
  city?: string;
  
  // Limit
  maxResults?: number;
}

export interface SupplierDocument {
  documentId: string;
  importIndex?: number;
  importedAt?: string;
  sourceFile?: string;
  original?: {
    'Branch'?: string;
    'Company'?: string;
    'Corporation'?: string;
    'Company ID'?: string;
    'ValmetID'?: string;
    'MillID'?: string;
    'Company VAT number'?: string;
    'Supplier Main Category'?: string;
    'Supplier Categories'?: string;
    'Corporation Category'?: string;
    'City (Street Address)'?: string;
    'Country/Region (Street Address)'?: string;
    'e-Mail'?: string;
    'Supplier Main Contact'?: string;
    'Supplier Main Contact eMail'?: string;
    'Preferred Supplier'?: string;
    'Valmet Supplier Code of Conduct signed'?: string;
    'Supplier sustainability policy signed'?: string;
    'Is supplier engaged to Valmet climate program?'?: string;
    'Purchase orders last three years'?: string;
    'Invoices last three years'?: string;
    'Finland spend?'?: string;
    'Terms Of Payment'?: string;
    'Valmet Supplier Manager'?: string;
    'Buyer'?: string;
    'Category Manager'?: string;
    'Created'?: string;
    'Created By'?: string;
    'Latest Approval'?: string;
    [key: string]: any;
  };
}

export interface SearchResults {
  suppliers: SupplierDocument[];
  totalCount: number;
  categories: string[];
  countries: string[];
}

/**
 * Fuzzy match helper - case insensitive partial matching
 */
function fuzzyMatch(text: string | undefined, searchTerm: string): boolean {
  if (!text || !searchTerm) return false;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}

/**
 * Search suppliers with fuzzy, case-insensitive filters
 */
export async function searchSuppliers(filters: SupplierSearchFilters = {}): Promise<SearchResults> {
  console.log('🔍 Searching suppliers with filters:', filters);
  
  try {
    const supplierRef = collection(db, 'supplier_spend');
    
    // Get all documents (we'll filter in memory for fuzzy matching)
    const querySnapshot = await getDocs(supplierRef);
    
    const suppliers: SupplierDocument[] = [];
    const categoriesSet = new Set<string>();
    const countriesSet = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as SupplierDocument;
      const original = data.original || {};
      
      // Apply fuzzy filters
      let matches = true;
      
      // Main Category filter (fuzzy)
      if (filters.mainCategory && filters.mainCategory !== 'all' && filters.mainCategory !== '') {
        matches = matches && fuzzyMatch(original['Supplier Main Category'], filters.mainCategory);
      }
      
      // Supplier Categories filter (fuzzy)
      if (filters.supplierCategories && filters.supplierCategories !== '') {
        matches = matches && fuzzyMatch(original['Supplier Categories'], filters.supplierCategories);
      }
      
      // Country filter (fuzzy)
      if (filters.country && filters.country !== 'all' && filters.country !== '') {
        matches = matches && fuzzyMatch(original['Country/Region (Street Address)'], filters.country);
      }
      
      // City filter (fuzzy)
      if (filters.city && filters.city !== '') {
        matches = matches && fuzzyMatch(original['City (Street Address)'], filters.city);
      }
      
      if (matches) {
        // Include full document with all original fields
        suppliers.push({
          documentId: doc.id,
          importIndex: data.importIndex,
          importedAt: data.importedAt,
          sourceFile: data.sourceFile,
          original: original
        });
        
        // Collect unique categories and countries
        if (original['Supplier Main Category']) {
          categoriesSet.add(original['Supplier Main Category']);
        }
        if (original['Country/Region (Street Address)']) {
          countriesSet.add(original['Country/Region (Street Address)']);
        }
      }
    });
    
    console.log(`✅ Found ${suppliers.length} suppliers`);
    
    // Sort by company name
    suppliers.sort((a, b) => {
      const nameA = a.original?.['Company'] || a.original?.['Branch'] || a.original?.['Corporation'] || '';
      const nameB = b.original?.['Company'] || b.original?.['Branch'] || b.original?.['Corporation'] || '';
      return nameA.localeCompare(nameB);
    });
    
    // Apply limit after filtering
    const maxResults = filters.maxResults || 200;
    const limitedSuppliers = suppliers.slice(0, maxResults);
    
    return {
      suppliers: limitedSuppliers,
      totalCount: suppliers.length,
      categories: Array.from(categoriesSet).sort(),
      countries: Array.from(countriesSet).sort()
    };
    
  } catch (error) {
    console.error('❌ Error searching suppliers:', error);
    throw error;
  }
}

/**
 * Get supplier details by ID
 */
export async function getSupplierDetails(supplierId: string): Promise<SupplierDocument | null> {
  console.log('📋 Getting supplier details for:', supplierId);
  
  try {
    const docRef = doc(db, 'supplier_spend', supplierId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as SupplierDocument;
      console.log('✅ Found supplier:', data.companyName);
      return {
        ...data,
        documentId: docSnap.id
      };
    } else {
      console.log('❌ Supplier not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting supplier details:', error);
    throw error;
  }
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<string[]> {
  console.log('📂 Getting all categories...');
  
  try {
    const supplierRef = collection(db, 'supplier_spend');
    const querySnapshot = await getDocs(supplierRef);
    
    const categoriesSet = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const mainCategory = data.original?.['Supplier Main Category'];
      if (mainCategory) {
        categoriesSet.add(mainCategory);
      }
    });
    
    const categories = Array.from(categoriesSet).sort();
    console.log(`✅ Found ${categories.length} unique categories`);
    
    return categories;
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    throw error;
  }
}

/**
 * Get all unique countries
 */
export async function getAllCountries(): Promise<string[]> {
  console.log('🌍 Getting all countries...');
  
  try {
    const supplierRef = collection(db, 'supplier_spend');
    const querySnapshot = await getDocs(supplierRef);
    
    const countriesSet = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const country = data.original?.['Country/Region (Street Address)'];
      if (country) {
        countriesSet.add(country);
      }
    });
    
    const countries = Array.from(countriesSet).sort();
    console.log(`✅ Found ${countries.length} unique countries`);
    
    return countries;
  } catch (error) {
    console.error('❌ Error getting countries:', error);
    throw error;
  }
}

/**
 * Get supplier statistics
 */
export async function getSupplierStats(): Promise<{
  totalSuppliers: number;
  preferredSuppliers: number;
  withConductCode: number;
  withSustainability: number;
  inClimateProgram: number;
  byCountry: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  console.log('📊 Getting supplier statistics...');
  
  try {
    const supplierRef = collection(db, 'supplier_spend');
    const querySnapshot = await getDocs(supplierRef);
    
    let totalSuppliers = 0;
    let preferredSuppliers = 0;
    let withConductCode = 0;
    let withSustainability = 0;
    let inClimateProgram = 0;
    const byCountry: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const original = data.original || {};
      totalSuppliers++;
      
      if (original['Preferred Supplier'] === 'X') preferredSuppliers++;
      if (original['Valmet Supplier Code of Conduct signed'] === 'X') withConductCode++;
      if (original['Supplier sustainability policy signed'] === 'X') withSustainability++;
      if (original['Is supplier engaged to Valmet climate program?'] === 'X' || 
          original['Is supplier engaged to Valmet climate program?'] === 'Yes') inClimateProgram++;
      
      const country = original['Country/Region (Street Address)'];
      if (country) {
        byCountry[country] = (byCountry[country] || 0) + 1;
      }
      
      const category = original['Supplier Main Category'];
      if (category) {
        // Extract just the last part of the category for cleaner display
        const cleanCategory = category.split(',').pop()?.trim() || category;
        byCategory[cleanCategory] = (byCategory[cleanCategory] || 0) + 1;
      }
    });
    
    console.log(`✅ Calculated stats for ${totalSuppliers} suppliers`);
    
    return {
      totalSuppliers,
      preferredSuppliers,
      withConductCode,
      withSustainability,
      inClimateProgram,
      byCountry,
      byCategory
    };
  } catch (error) {
    console.error('❌ Error getting supplier stats:', error);
    throw error;
  }
}