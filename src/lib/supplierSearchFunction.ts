/**
 * Supplier Search Function for AI Chat
 * 
 * This function replicates the ValmetSupplierSearchSimple functionality
 * for use by the AI chatbot to search suppliers programmatically.
 */

import { searchSuppliers, SupplierSearchFilters, SupplierDocument } from './valmetSupplierSearch';

export interface ChatSupplierSearchParams {
  mainCategory?: string;
  supplierCategories?: string;
  country?: string;
  city?: string;
  limit?: number;
}

/**
 * Main Category List of Values (LOV)
 * Numbers in parentheses indicate supplier count
 * Categories are stored as hierarchical paths in the database
 */
export const MAIN_CATEGORY_LOV = [
  { value: 'Indirect procurement iPRO, Professional services, Business consulting', label: 'Business consulting', count: 131 },
  { value: 'Indirect procurement iPRO, Office IT, IT consulting', label: 'IT consulting', count: 103 },
  { value: 'Indirect procurement iPRO, Professional services, Training & people development', label: 'Training & people development', count: 100 },
  { value: 'Indirect procurement iPRO, Professional services, R&D services & materials', label: 'R&D services & materials', count: 55 },
  { value: 'Indirect procurement iPRO, Professional services, Legal services', label: 'Legal services', count: 45 },
  { value: 'Indirect procurement iPRO, Professional services, Certification, standardization & audits', label: 'Certification, standardization & audits', count: 26 },
  { value: 'Indirect procurement iPRO, Professional services, Patent services', label: 'Patent services', count: 26 },
  { value: 'Indirect procurement iPRO, Personnel, Leased workforce', label: 'Leased workforce', count: 14 },
  { value: 'Indirect procurement iPRO, Office IT, IT Services', label: 'IT Services', count: 8 },
  { value: 'Indirect procurement iPRO, Professional services, Measurement & inspection', label: 'Measurement & inspection', count: 2 },
  { value: 'Indirect procurement iPRO, Facility investments', label: 'Facility investments', count: 1 }
];

/**
 * Format supplier data for chat display
 */
function formatSupplierForChat(supplier: SupplierDocument): string {
  const o = supplier.original || {};
  const lines: string[] = [];
  
  // Company info
  lines.push(`**${o['Company'] || o['Branch'] || o['Corporation'] || 'Unknown'}**`);
  if (o['Company ID']) lines.push(`ID: ${o['Company ID']}`);
  
  // Categories
  if (o['Supplier Main Category']) {
    lines.push(`Main Category: ${o['Supplier Main Category']}`);
  }
  if (o['Supplier Categories']) {
    lines.push(`Categories: ${o['Supplier Categories']}`);
  }
  
  // Location
  if (o['City (Street Address)'] || o['Country/Region (Street Address)']) {
    lines.push(`Location: ${[o['City (Street Address)'], o['Country/Region (Street Address)']].filter(Boolean).join(', ')}`);
  }
  
  // Contact
  if (o['Supplier Main Contact']) {
    lines.push(`Contact: ${o['Supplier Main Contact']}`);
  }
  if (o['Supplier Main Contact eMail']) {
    lines.push(`Email: ${o['Supplier Main Contact eMail']}`);
  }
  
  // Status indicators
  const status: string[] = [];
  if (o['Preferred Supplier'] === 'X') status.push('✓ Preferred');
  if (o['Valmet Supplier Code of Conduct signed'] === 'X') status.push('✓ Code of Conduct');
  if (o['Supplier sustainability policy signed'] === 'X') status.push('✓ Sustainability');
  if (o['Is supplier engaged to Valmet climate program?'] === 'X' || 
      o['Is supplier engaged to Valmet climate program?'] === 'Yes') status.push('✓ Climate Program');
  
  if (status.length > 0) {
    lines.push(`Status: ${status.join(', ')}`);
  }
  
  // Spend data
  if (o['Finland spend?']) {
    lines.push(`Finland Spend: ${o['Finland spend?']}`);
  }
  
  return lines.join('\n');
}

/**
 * Search suppliers for chat interface
 * Returns formatted results suitable for chat display
 */
export async function searchSuppliersForChat(params: ChatSupplierSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  suppliers: string[];
  error?: string;
}> {
  console.log('📥 searchSuppliersForChat called with params:', JSON.stringify(params, null, 2));

  try {
    // Validate main category against LOV if provided
    if (params.mainCategory) {
      // First try exact match (case-insensitive)
      let validCategory = MAIN_CATEGORY_LOV.find(cat =>
        cat.value.toLowerCase() === params.mainCategory!.toLowerCase()
      );

      // If no exact match, try to find if the param exactly matches the beginning of a category
      if (!validCategory) {
        validCategory = MAIN_CATEGORY_LOV.find(cat =>
          cat.value.toLowerCase().startsWith(params.mainCategory!.toLowerCase())
        );
      }

      // Log what we're searching for
      console.log(`🔍 Category validation: Input="${params.mainCategory}", Found="${validCategory?.value || 'none'}"`);

      if (!validCategory && params.mainCategory.toLowerCase() !== 'all') {
        console.log(`❌ Invalid category "${params.mainCategory}". Valid options:`, MAIN_CATEGORY_LOV.map(c => c.value));
        return {
          success: false,
          totalFound: 0,
          suppliers: [],
          error: `Invalid main category. Valid options are: ${MAIN_CATEGORY_LOV.map(c => c.value).join(', ')}`
        };
      }

      // Use the exact category value for search
      if (validCategory) {
        params.mainCategory = validCategory.value;
        console.log(`✅ Using exact category for search: "${validCategory.value}"`);
      }
    }
    
    const filters: SupplierSearchFilters = {
      mainCategory: params.mainCategory,
      supplierCategories: params.supplierCategories,
      country: params.country,
      city: params.city,
      maxResults: params.limit || 10
    };
    
    const results = await searchSuppliers(filters);
    
    // Format results for chat
    const formattedSuppliers = results.suppliers.map(formatSupplierForChat);
    
    return {
      success: true,
      totalFound: results.totalCount,
      suppliers: formattedSuppliers
    };
  } catch (error) {
    console.error('Error in searchSuppliersForChat:', error);
    return {
      success: false,
      totalFound: 0,
      suppliers: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get main categories list for chat
 */
export function getMainCategoriesForChat(): string {
  return MAIN_CATEGORY_LOV
    .map(cat => `- ${cat.value} (${cat.count} suppliers)`)
    .join('\n');
}

/**
 * Example usage for AI integration:
 * 
 * // Search for IT consulting suppliers in Finland
 * const results = await searchSuppliersForChat({
 *   mainCategory: 'IT consulting',
 *   country: 'Finland',
 *   limit: 5
 * });
 * 
 * // Get all categories
 * const categories = getMainCategoriesForChat();
 */