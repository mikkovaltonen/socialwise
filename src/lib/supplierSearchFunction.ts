/**
 * Unified Supplier Search Function for AI Chat
 *
 * This function provides AI chatbot access to search the unified suppliers database
 * containing all supplier data in a single collection.
 */

import { searchSuppliers, SupplierSearchFilters, SupplierDocument } from './valmetSupplierSearch';

export interface ChatSupplierSearchParams {
  mainCategory?: string;              // Filter 1: Exact match from LOV
  trainingNatureOfService?: string;    // Filter 2: Exact match from LOV
  country?: string | string[];         // Filter 3: Single or multiple countries from LOV
  vendorName?: string;                 // Filter 4: Fuzzy text search
  limit?: number;                      // Filter 5: Max results (default: 20)
  // EXACTLY 5 filters - no other parameters allowed
}

/**
 * Main Category List of Values (LOV)
 * Numbers in parentheses indicate supplier count
 * Categories are stored as hierarchical paths in the database
 */
export const MAIN_CATEGORY_LOV = [
  { value: '#', label: '# (data empty or not defined)', count: 0 },
  { value: 'Indirect procurement iPRO, Professional services, Business consulting', label: 'Business consulting', count: 131 },
  { value: 'Indirect procurement iPRO, Personnel, Training & people development', label: 'Training & people development', count: 100 },
  { value: 'Indirect procurement iPRO, Professional services, R&D services & materials', label: 'R&D services & materials', count: 52 },
  { value: 'Indirect procurement iPRO, Professional services, Legal services', label: 'Legal services', count: 45 },
  { value: 'Indirect procurement iPRO, Professional services, Certification, standardization & audits', label: 'Certification, standardization & audits', count: 26 },
  { value: 'Indirect procurement iPRO, Professional services, Patent services', label: 'Patent services', count: 26 },
  { value: 'Indirect procurement iPRO, Personnel, Leased workforce', label: 'Leased workforce', count: 14 },
  { value: 'Indirect procurement iPRO, Professional services, Testing, measurement & inspection', label: 'Testing, measurement & inspection', count: 2 },
  { value: 'Indirect procurement iPRO, Facilities, Facility investments', label: 'Facility investments', count: 1 }
];

/**
 * Country List of Values (LOV)
 * Complete list of countries in supplier database
 */
export const COUNTRY_LOV = [
  { value: '#', label: '# (data empty or not defined)', count: 0 },
  { value: 'Austria', label: 'Austria', count: 1 },
  { value: 'Belgium', label: 'Belgium', count: 2 },
  { value: 'Brazil', label: 'Brazil', count: 1 },
  { value: 'Canada', label: 'Canada', count: 3 },
  { value: 'Chile', label: 'Chile', count: 1 },
  { value: 'China', label: 'China', count: 4 },
  { value: 'Colombia', label: 'Colombia', count: 1 },
  { value: 'Costa Rica', label: 'Costa Rica', count: 1 },
  { value: 'Croatia (Hrvatska)', label: 'Croatia (Hrvatska)', count: 1 },
  { value: 'Czech Republic', label: 'Czech Republic', count: 2 },
  { value: 'Denmark', label: 'Denmark', count: 5 },
  { value: 'Egypt', label: 'Egypt', count: 1 },
  { value: 'Estonia', label: 'Estonia', count: 2 },
  { value: 'Finland', label: 'Finland', count: 254 },
  { value: 'France', label: 'France', count: 6 },
  { value: 'Germany', label: 'Germany', count: 26 },
  { value: 'Greece', label: 'Greece', count: 1 },
  { value: 'Hungary', label: 'Hungary', count: 1 },
  { value: 'India', label: 'India', count: 10 },
  { value: 'Ireland', label: 'Ireland', count: 2 },
  { value: 'Italy', label: 'Italy', count: 4 },
  { value: 'Japan', label: 'Japan', count: 2 },
  { value: 'Korea, Republic of', label: 'Korea, Republic of', count: 1 },
  { value: 'Lithuania', label: 'Lithuania', count: 1 },
  { value: 'Luxembourg', label: 'Luxembourg', count: 2 },
  { value: 'Netherlands', label: 'Netherlands', count: 8 },
  { value: 'Norway', label: 'Norway', count: 4 },
  { value: 'Panama', label: 'Panama', count: 1 },
  { value: 'Peru', label: 'Peru', count: 1 },
  { value: 'Poland', label: 'Poland', count: 5 },
  { value: 'Singapore', label: 'Singapore', count: 2 },
  { value: 'Spain', label: 'Spain', count: 3 },
  { value: 'Sweden', label: 'Sweden', count: 19 },
  { value: 'Switzerland', label: 'Switzerland', count: 6 },
  { value: 'Tunisia', label: 'Tunisia', count: 1 },
  { value: 'United Arab Emirates', label: 'United Arab Emirates', count: 2 },
  { value: 'United Kingdom', label: 'United Kingdom', count: 15 },
  { value: 'United States', label: 'United States', count: 23 },
  { value: 'Uruguay', label: 'Uruguay', count: 1 }
];

/**
 * Training Nature of Service List of Values (LOV)
 * Exact values from database for training suppliers
 */
export const TRAINING_NATURE_OF_SERVICE_LOV = [
  { value: '#', label: '# (data empty or not defined)', count: 0 },
  { value: 'General Training', label: 'General Training', count: 8 },
  { value: 'Product, Service & Technology Training', label: 'Product, Service & Technology Training', count: 7 },
  { value: 'Business Culture & Language Training', label: 'Business Culture & Language Training', count: 6 },
  { value: 'Various/Other Skills', label: 'Various/Other Skills', count: 6 },
  { value: 'Leadership, Management & Team Development', label: 'Leadership, Management & Team Development', count: 5 },
  { value: 'Coaching & Work Counselling', label: 'Coaching & Work Counselling', count: 5 },
  { value: 'HSE, Quality & Work Wellbeing', label: 'HSE, Quality & Work Wellbeing', count: 4 },
  { value: 'E-learning & Digital Learning Solutions', label: 'E-learning & Digital Learning Solutions', count: 3 },
  { value: 'Global Training Programs', label: 'Global Training Programs', count: 3 },
  { value: 'Communication Skills Training', label: 'Communication Skills Training', count: 2 },
  { value: 'Combined Leadership Programs', label: 'Combined Leadership Programs', count: 2 }
];


// Mapping from UI values to actual database values
const TRAINING_NATURE_MAPPING: Record<string, string> = {
  'General Training': 'Training',
  'Product, Service & Technology Training': 'Product, service or technology trainings',
  'Business Culture & Language Training': 'Business culture and language training',
  'Various/Other Skills': 'Various/other skills',
  'Leadership, Management & Team Development': 'Leadership, management and team development',
  'Coaching & Work Counselling': 'Coaching and work counselling',
  'HSE, Quality & Work Wellbeing': 'HSE, quality and work wellbeing',
  'E-learning & Digital Learning Solutions': 'Elearnings and digital learning solutions',
  'Global Training Programs': 'Global training programs',
  'Communication Skills Training': 'Interaction/ presentation/ communication/ influencing',
  'Combined Leadership Programs': 'Leadership, management and team development, project management'
};

export async function search_suppliers(params: ChatSupplierSearchParams): Promise<{
  success: boolean;
  totalFound: number;
  suppliers: any[];
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
    
    // Handle country as array or string
    let countryFilter: string | undefined;
    if (params.country) {
      if (Array.isArray(params.country)) {
        // For multiple countries, we'll need to handle this in the search function
        countryFilter = params.country.join('|'); // Use pipe separator for multiple values
      } else {
        countryFilter = params.country;
      }
    }

    // Map training nature from UI value to database value
    let trainingNatureFilter = params.trainingNatureOfService;
    if (trainingNatureFilter && trainingNatureFilter !== '#') {
      const mappedValue = TRAINING_NATURE_MAPPING[trainingNatureFilter];
      if (mappedValue) {
        console.log(`🔄 Mapping training nature: "${trainingNatureFilter}" -> "${mappedValue}"`);
        trainingNatureFilter = mappedValue;
      }
    }

    const filters: SupplierSearchFilters = {
      mainCategory: params.mainCategory,
      trainingNatureOfService: trainingNatureFilter,
      country: countryFilter,
      vendorName: params.vendorName,
      maxResults: params.limit || 10
      // EXACTLY 5 filters - no other parameters
    };
    
    const results = await searchSuppliers(filters);

    // Return raw suppliers data as JSON
    return {
      success: true,
      totalFound: results.totalCount,
      suppliers: results.suppliers
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
 * Alias for UI compatibility - both UI and LLM use the same function
 */
export const searchSuppliersForChat = search_suppliers;

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
 * // Search for suppliers in Finland
 * const results = await search_suppliers({
 *   mainCategory: 'Business consulting',
 *   country: 'Finland',
 *   limit: 5
 * });
 *
 * // Get all categories
 * const categories = getMainCategoriesForChat();
 */

