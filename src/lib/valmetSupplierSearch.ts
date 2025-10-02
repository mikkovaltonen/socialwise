/**
 * Unified Suppliers Search Functions
 *
 * Search and filter functions for the suppliers_complete collection
 * Contains all supplier data in a unified structure
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
  // Filter 1: Main Category (exact match from LOV)
  mainCategory?: string;

  // Filter 2: Training Nature of Service (fuzzy search)
  trainingNatureOfService?: string;

  // Filter 3: Country - supports multiple countries (pipe-separated)
  country?: string;

  // Filter 4: Vendor name (fuzzy search in Company, Branch, Corporation)
  vendorName?: string;

  // Filter 5: Max results limit
  maxResults?: number;

  // EXACTLY 5 filters - no other parameters allowed
}

export interface SupplierDocument {
  documentId: string;
  importIndex?: number;
  importedAt?: string;
  sourceFile?: string;
  // New flattened fields (from suppliers_complete)
  id?: string;
  company?: string;
  companyId?: string;
  mainCategory?: string;
  categories?: string;
  country?: string;
  city?: string;
  preferredSupplier?: boolean | string;
  natureOfService?: string;
  trainingNatureOfService?: string;
  mainContact?: string;
  mainContactEmail?: string;
  paymentTerms?: string;
  hasInvoices?: boolean;
  hasPurchaseOrders?: boolean;
  isTrainingSupplier?: boolean;
  sustainabilityPolicySigned?: boolean;
  _uploadedBy?: string;
  _lastUpdated?: string;
  _migratedAt?: string;
  // Allow any additional fields
  [key: string]: any;
  // Original nested structure (for backward compatibility)
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
    const supplierRef = collection(db, 'suppliers_complete');

    // Get all documents (we'll filter in memory for fuzzy matching)
    const querySnapshot = await getDocs(supplierRef);

    console.log(`📊 Total documents in database: ${querySnapshot.size}`);

    const suppliers: SupplierDocument[] = [];
    const categoriesSet = new Set<string>();
    const countriesSet = new Set<string>();

    // Debug: Count documents per main category
    const categoryCount: { [key: string]: number } = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // New data structure: fields are at root level
      const category = data.mainCategory || data.original?.['Supplier Main Category'];

      if (category) {
        // Trim the category to ensure consistent counting
        const trimmedCategory = category.trim();
        categoryCount[trimmedCategory] = (categoryCount[trimmedCategory] || 0) + 1;
      }
    });

    if (filters.mainCategory) {
      console.log(`🎯 Searching for Main Category: "${filters.mainCategory}"`);
      const sortedCategories = Object.keys(categoryCount).sort();
      console.log(`📋 Available categories in DB (${sortedCategories.length} unique):`, sortedCategories);

      // Show detailed category list for debugging
      console.log('📊 Category counts:');
      sortedCategories.forEach(cat => {
        console.log(`   - "${cat}": ${categoryCount[cat]} suppliers`);
      });

      if (categoryCount[filters.mainCategory]) {
        console.log(`✅ Found ${categoryCount[filters.mainCategory]} suppliers with exact category "${filters.mainCategory}"`);
      } else {
        console.log(`⚠️ No exact match found for "${filters.mainCategory}"`);

        // Try to find similar categories
        const similar = sortedCategories.filter(cat =>
          cat.toLowerCase().includes('business') ||
          cat.toLowerCase().includes('consulting')
        );
        if (similar.length > 0) {
          console.log(`💡 Similar categories found:`, similar);
        }
      }
    }
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as SupplierDocument;
      const original = data.original || {};

      // Apply filters
      let matches = true;

      // Main Category filter - EXACT match for LOV field
      if (filters.mainCategory && filters.mainCategory !== 'all' && filters.mainCategory !== '') {
        // Check both new and old data structure
        const rawCategory = data.mainCategory || original['Supplier Main Category'];
        const supplierCategory = rawCategory?.trim();
        const searchCategory = filters.mainCategory.trim();

        // Debug: Show exact comparison
        if (searchCategory === 'Leased workforce') {
          console.log(`🔎 Checking doc ${doc.id}:`, {
            raw: rawCategory,
            trimmed: supplierCategory,
            search: searchCategory,
            matches: supplierCategory === searchCategory,
            rawLength: rawCategory?.length,
            trimmedLength: supplierCategory?.length,
            searchLength: searchCategory.length
          });
        }

        matches = matches && (supplierCategory === searchCategory);

        // Debug logging for mismatches
        if (!matches && supplierCategory && searchCategory === 'Leased workforce') {
          console.log(`❌ Category mismatch for "${original['Company']}": Has "${supplierCategory}" (length: ${supplierCategory.length}), searching for "${searchCategory}" (length: ${searchCategory.length})`);
        }
      }
      
      // Removed supplierCategories filter - not in the 5 allowed filters

      // Country filter - supports multiple countries separated by pipe
      if (filters.country && filters.country !== 'all' && filters.country !== '') {
        const country = data.country || original['Country/Region (Street Address)'] || '';

        // Check if we have multiple countries (pipe-separated)
        if (filters.country.includes('|')) {
          const countries = filters.country.split('|');
          const countryMatches = countries.some(c => fuzzyMatch(country, c.trim()));
          matches = matches && countryMatches;
        } else {
          matches = matches && fuzzyMatch(country, filters.country);
        }
      }

      // City filter removed - using country filter instead

      // Vendor name filter (fuzzy search in Company, Branch, Corporation)
      if (filters.vendorName && filters.vendorName !== '') {
        const vendorNameMatch =
          fuzzyMatch(data.company, filters.vendorName) ||
          fuzzyMatch(original['Company'], filters.vendorName) ||
          fuzzyMatch(original['Branch'], filters.vendorName) ||
          fuzzyMatch(original['Corporation'], filters.vendorName);

        matches = matches && vendorNameMatch;
      }

      // Training Nature of Service filter (fuzzy search)
      if (filters.trainingNatureOfService && filters.trainingNatureOfService !== '') {
        const natureOfService = data.natureOfService || data.trainingNatureOfService || original['Nature of Service'] || original['Training Nature of Service'] || '';

        // Handle # for empty/undefined data
        if (filters.trainingNatureOfService === '#') {
          matches = matches && (!natureOfService || natureOfService === '');
        } else {
          matches = matches && fuzzyMatch(natureOfService, filters.trainingNatureOfService);
        }
      }

      // Removed preferredSupplier filter - not in the 5 allowed filters

      if (matches) {
        // Include full document with all fields
        // Spread all data fields and ensure documentId is the doc.id
        suppliers.push({
          ...data,
          documentId: doc.id
        });
        
        // Collect unique categories and countries
        const mainCat = data.mainCategory || original['Supplier Main Category'];
        if (mainCat) {
          categoriesSet.add(mainCat);
        }
        const country = data.country || original['Country/Region (Street Address)'];
        if (country) {
          countriesSet.add(country);
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

    console.log(`✅ Found ${suppliers.length} matching suppliers`);

    // Debug: Show results summary
    if (filters.mainCategory && suppliers.length > 0) {
      console.log('🔎 Sample matches:');
      suppliers.slice(0, 3).forEach((s, i) => {
        const company = s.company || s.original?.['Company'] || 'Unknown';
        const category = s.mainCategory || s.original?.['Supplier Main Category'] || 'N/A';
        console.log(`  ${i + 1}. ${company} - Category: "${category}"`);
      });
    } else if (filters.mainCategory && suppliers.length === 0) {
      console.log(`❌ No suppliers found for Main Category: "${filters.mainCategory}"`);
    }

    // Debug for vendor name search
    if (filters.vendorName) {
      if (suppliers.length === 0) {
        console.log(`❌ No suppliers found with vendor name containing: "${filters.vendorName}"`);
        console.log(`💡 Tip: The search looks for "${filters.vendorName}" in Company, Branch, or Corporation fields (case-insensitive partial match)`);
      } else {
        console.log(`✅ Found ${suppliers.length} suppliers matching vendor name: "${filters.vendorName}"`);
      }
    }

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
    const docRef = doc(db, 'suppliers_complete', supplierId);
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
    const supplierRef = collection(db, 'suppliers_complete');
    const querySnapshot = await getDocs(supplierRef);
    
    const categoriesSet = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const mainCategory = data.mainCategory || data.original?.['Supplier Main Category'];
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
    const supplierRef = collection(db, 'suppliers_complete');
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
    const supplierRef = collection(db, 'suppliers_complete');
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