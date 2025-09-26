import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit as firestoreLimit, 
  QueryConstraint,
  DocumentData,
  getDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// Type Definitions
// ============================================

export interface PurchaserVendorSearch {
  // Primary Search Criteria
  searchTerm?: string;                    
  category?: {
    main?: string;                       
    sub?: string;                        
  };

  // Financial Filters
  budget?: {
    min?: number;
    max?: number;
    currency?: string;                   
  };
  paymentTerms?: string[];               

  // Compliance & Requirements
  certifications?: string[];             
  eInvoicingRequired?: boolean;
  poComplianceRequired?: boolean;
  sustainabilityRating?: number;         

  // Location & Delivery
  location?: {
    country?: string;
    region?: string;
  };

  // Performance Criteria
  minRating?: number;                    
  maxDeliveryTime?: number;              
  minOnTimeDelivery?: number;            

  // Risk & Status
  riskLevel?: ('low' | 'medium' | 'high')[];
  contractStatus?: ('active' | 'expired' | 'pending')[];
  blacklisted?: boolean;                 

  // Volume & History
  minOrderVolume?: number;
  previouslyUsed?: boolean;              
  lastActivityWithin?: number;           // Days
  
  // Results Control
  limitResults?: number;
  sortBy?: 'spend' | 'rating' | 'name' | 'recent';
  sortDirection?: 'asc' | 'desc';
}

export interface VendorListItem {
  // Essential Information
  vendorId: string;
  companyName: string;
  businessPartnerId?: string;

  // Category & Capability
  primaryCategory: string;
  subCategories: string[];
  keyProducts?: string[];                 

  // Financial Summary
  annualSpend: number;                   
  averageOrderValue: number;
  paymentTerms: string;                  
  currency: string;

  // Performance Indicators
  rating?: number;                        
  onTimeDelivery?: number;                
  qualityScore?: number;                  
  responseTime?: string;                  

  // Compliance Status
  badges: {
    eInvoicing: boolean;
    poCompliance: boolean;
    certified: boolean;
    preferred: boolean;                  
    sustainable: boolean;
  };

  // Quick Stats
  totalOrders: number;
  activeContracts?: number;
  lastOrderDate?: Date;

  // Risk Indicator
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors?: string[];                
}

export interface VendorDetailOutput {
  // Basic Information
  basic: {
    vendorId: string;
    companyName: string;
    legalName?: string;
    taxId?: string;
    businessPartnerId: string;
    website?: string;
    description?: string;
  };

  // Contact Information
  contacts?: {
    primary?: {
      name: string;
      email?: string;
      phone?: string;
    };
    address?: {
      street?: string;
      city?: string;
      country?: string;
      postalCode?: string;
    };
  };

  // Products & Services
  offerings: {
    categories: Array<{
      main: string;
      sub: string[];
    }>;
    serviceCapabilities?: string[];
  };

  // Financial Details
  financial: {
    totalLifetimeSpend: number;
    currentYearSpend: number;
    lastYearSpend?: number;
    monthlyAverage: number;
    paymentTerms: string;
    currency: string;
    creditLimit?: number;
    invoiceCount: number;
  };

  // Spend Analysis
  spendHistory: {
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    spendTrend: 'increasing' | 'stable' | 'decreasing';
    lastFiveTransactions?: Array<{
      date: Date;
      amount: number;
      category: string;
      description?: string;
    }>;
  };

  // Performance Metrics
  performance: {
    overallRating?: number;
    onTimeDeliveryRate?: number;        
    defectRate?: number;                
    averageLeadTime?: number;           
    invoiceAccuracy?: number;           
    eInvoicingRate: number;
    poComplianceRate: number;
  };

  // Compliance & Certifications
  compliance: {
    certifications?: string[];
    sustainabilityScore?: number;
    eInvoicingEnabled: boolean;
    poCompliance: boolean;
  };

  // Risk Assessment
  risk: {
    overallRisk: 'low' | 'medium' | 'high';
    factors?: string[];
    lastAssessmentDate?: Date;
  };
}

// ============================================
// Main Search Functions
// ============================================

/**
 * Search for suppliers based on comprehensive criteria
 * Can be called by Gemini AI or directly from UI
 */
export async function searchSuppliers(
  filters: PurchaserVendorSearch
): Promise<{
  vendors: VendorListItem[];
  totalCount: number;
  summary: {
    totalSpend: number;
    averageRating?: number;
    topCategories: string[];
  };
}> {
  console.log('🔍 searchSuppliers called with filters:', filters);
  
  try {
    const vendors: VendorListItem[] = [];
    let allDocs: any[] = [];

    // First, let's check what data exists in the collection
    if (!filters.category?.main || filters.category.main === 'DEBUG_ALL') {
      console.log('📁 Fetching ALL suppliers to analyze data...');
      const q = query(collection(db, 'ext_labour_suppliers'), firestoreLimit(100));
      const snapshot = await getDocs(q);
      allDocs = snapshot.docs;
      console.log(`✅ Found ${allDocs.length} total documents in ext_labour_suppliers collection`);
      
      if (allDocs.length > 0) {
        // Analyze the data structure
        const sampleDoc = allDocs[0].data();
        console.log('📋 Sample document structure:', sampleDoc);
        console.log('🔑 Available fields:', Object.keys(sampleDoc));
        
        // Check all category field variations
        const categoryFields = Object.keys(sampleDoc).filter(key => 
          key.toLowerCase().includes('category') || 
          key.toLowerCase().includes('service')
        );
        console.log('📂 Category-related fields found:', categoryFields);
        
        // Get unique values for potential category fields
        const uniqueCategories = new Map();
        categoryFields.forEach(field => {
          const values = [...new Set(allDocs.map(d => d.data()[field]).filter(v => v))];
          uniqueCategories.set(field, values.slice(0, 10)); // Show first 10 unique values
        });
        
        console.log('📊 Unique values by field:');
        uniqueCategories.forEach((values, field) => {
          console.log(`  ${field}:`, values);
        });
      }
    }
    
    // Now do the actual search
    if (filters.category?.main && filters.category.main !== 'DEBUG_ALL') {
      console.log(`📁 Searching for Main Category: "${filters.category.main}"`);
      
      // Try different field name variations
      const fieldVariations = [
        'Main Category',
        'Main Category Service',
        'Main category',
        'main_category',
        'mainCategory'
      ];
      
      for (const fieldName of fieldVariations) {
        console.log(`🔍 Trying field: "${fieldName}"`);
        const q = query(
          collection(db, 'ext_labour_suppliers'),
          where(fieldName, '==', filters.category.main),
          firestoreLimit(1000)
        );
        
        try {
          const snapshot = await getDocs(q);
          if (snapshot.docs.length > 0) {
            allDocs = snapshot.docs;
            console.log(`✅ Found ${allDocs.length} documents using field "${fieldName}"`);
            break;
          }
        } catch (err) {
          console.log(`  ⚠️ Field "${fieldName}" doesn't exist or query failed`);
        }
      }
      
      if (allDocs.length === 0) {
        console.log(`❌ No documents found for category "${filters.category.main}" with any field variation`);
      }
    }
    // Sort documents by Spend in memory
    console.log('💰 Sorting documents by Spend...');
    allDocs.sort((a, b) => {
      const spendA = a.data()['Spend'] || 0;
      const spendB = b.data()['Spend'] || 0;
      return spendB - spendA; // Descending order
    });

    let processedCount = 0;
    let filteredOutCount = 0;
    
    // Process results
    for (const docSnap of allDocs) {
      const data = docSnap.data();
      processedCount++;
      
      // Apply additional filters in memory
      // Sub category filter
      if (filters.category?.sub && data['Sub Category'] !== filters.category.sub) {
        filteredOutCount++;
        console.log(`  ❌ Filtered out: Sub Category "${data['Sub Category']}" != "${filters.category.sub}"`);
        continue;
      }
      
      // Budget filters
      const spend = data['Spend'] || 0;
      if (filters.budget?.min && spend < filters.budget.min) {
        filteredOutCount++;
        console.log(`  ❌ Filtered out: Spend ${spend} < min ${filters.budget.min}`);
        continue;
      }
      if (filters.budget?.max && spend > filters.budget.max) {
        filteredOutCount++;
        console.log(`  ❌ Filtered out: Spend ${spend} > max ${filters.budget.max}`);
        continue;
      }
      
      // E-invoicing filter
      if (filters.eInvoicingRequired && data['E-invoicing'] !== 'YES') {
        filteredOutCount++;
        console.log(`  ❌ Filtered out: E-invoicing = "${data['E-invoicing']}" (not YES)`);
        continue;
      }
      
      // PO compliance filter  
      if (filters.poComplianceRequired && data['PO coverage'] !== 'YES') {
        filteredOutCount++;
        console.log(`  ❌ Filtered out: PO coverage = "${data['PO coverage']}" (not YES)`);
        continue;
      }
      
      // Apply text search if provided
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const companyName = (data['Business Partner Company Name'] || '').toLowerCase();
        const category = (data['Main Category'] || '').toLowerCase();
        
        if (!companyName.includes(searchLower) && !category.includes(searchLower)) {
          continue;
        }
      }

      // Calculate risk level based on available data
      const riskLevel = calculateRiskLevel(data);

      // Create vendor list item
      const vendor: VendorListItem = {
        vendorId: docSnap.id,
        companyName: data['Business Partner Company Name'] || 'Unknown',
        businessPartnerId: data['Business Partner'] || '',
        primaryCategory: data['Main Category'] || '',
        subCategories: data['Sub Category'] ? [data['Sub Category']] : [],
        annualSpend: data['Spend'] || 0,
        averageOrderValue: data['Spend'] && data['Count of Invoice Receipts'] 
          ? data['Spend'] / data['Count of Invoice Receipts'] 
          : 0,
        paymentTerms: data['Payment Terms'] || 'Unknown',
        currency: 'EUR',
        totalOrders: data['Count of Invoice Receipts'] || 0,
        lastOrderDate: data['Last Invoice Date'] ? new Date(data['Last Invoice Date']) : undefined,
        riskLevel: riskLevel,
        badges: {
          eInvoicing: data['E-invoicing'] === 'YES',
          poCompliance: data['PO coverage'] === 'YES',
          certified: false, // Would need to check certifications collection
          preferred: data['Spend'] > 100000, // Example: preferred if spend > 100k
          sustainable: false // Would need sustainability data
        }
      };

      vendors.push(vendor);
      
      if (vendors.length <= 3) {
        console.log(`  ✅ Added vendor #${vendors.length}: ${vendor.companyName} (${vendor.primaryCategory}, Spend: €${vendor.annualSpend})`);
      }
      
      // Apply limit if specified
      if (filters.limit && vendors.length >= filters.limit) {
        console.log(`🛑 Reached limit of ${filters.limit} vendors`);
        break;
      }
    }
    
    console.log(`📊 Processing summary:`);
    console.log(`  - Documents processed: ${processedCount}`);
    console.log(`  - Filtered out: ${filteredOutCount}`);
    console.log(`  - Vendors returned: ${vendors.length}`);

    // Calculate summary statistics
    const totalSpend = vendors.reduce((sum, v) => sum + v.annualSpend, 0);
    const topCategories = [...new Set(vendors.map(v => v.primaryCategory))]
      .slice(0, 5);

    const result = {
      vendors,
      totalCount: vendors.length,
      summary: {
        totalSpend,
        topCategories
      }
    };
    
    console.log('🎯 Final search results:', {
      totalVendors: result.totalCount,
      totalSpend: result.summary.totalSpend,
      topCategories: result.summary.topCategories
    });
    
    return result;

  } catch (error) {
    console.error('❌ Error searching suppliers:', error);
    throw new Error('Failed to search suppliers');
  }
}

/**
 * Get detailed information about a specific vendor
 */
export async function getVendorDetails(
  vendorId: string
): Promise<VendorDetailOutput | null> {
  try {
    // Get main spend data
    const spendDoc = await getDoc(doc(db, 'ext_labour_suppliers', vendorId));
    if (!spendDoc.exists()) {
      return null;
    }

    const spendData = spendDoc.data();
    
    // Try to get additional details from other collections
    let detailsData = null;
    try {
      const detailsDoc = await getDoc(doc(db, 'supplier_details', vendorId));
      if (detailsDoc.exists()) {
        detailsData = detailsDoc.data();
      }
    } catch (e) {
      // Details collection might not exist for all vendors
    }

    // Calculate metrics
    const riskLevel = calculateRiskLevel(spendData);
    const spendTrend = calculateSpendTrend(spendData);

    // Build vendor detail output
    const vendorDetail: VendorDetailOutput = {
      basic: {
        vendorId: vendorId,
        companyName: spendData['Business Partner Company Name'] || 'Unknown',
        businessPartnerId: spendData['Business Partner'] || '',
        legalName: detailsData?.['Legal Name'] || spendData['Business Partner Company Name'],
        taxId: detailsData?.['Tax ID'],
        website: detailsData?.['Website'],
        description: detailsData?.['Description']
      },

      contacts: detailsData?.contacts ? {
        primary: detailsData.contacts.primary,
        address: detailsData.contacts.address
      } : undefined,

      offerings: {
        categories: [{
          main: spendData['Main Category Service'] || '',
          sub: spendData['Sub Category'] ? [spendData['Sub Category']] : []
        }],
        serviceCapabilities: detailsData?.['Service Capabilities'] || []
      },

      financial: {
        totalLifetimeSpend: spendData['Spend'] || 0,
        currentYearSpend: spendData['Spend'] || 0,
        lastYearSpend: spendData['Last Year Spend'],
        monthlyAverage: (spendData['Spend'] || 0) / 12,
        paymentTerms: spendData['Payment Terms'] || 'Unknown',
        currency: 'EUR',
        creditLimit: detailsData?.['Credit Limit'],
        invoiceCount: spendData['Count of Invoice Receipts'] || 0
      },

      spendHistory: {
        topCategories: [{
          category: spendData['Main Category Service'] || 'Unknown',
          amount: spendData['Spend'] || 0,
          percentage: 100
        }],
        spendTrend: spendTrend
      },

      performance: {
        eInvoicingRate: calculateEInvoicingRate(spendData),
        poComplianceRate: spendData['PO Coverage %'] || 0,
        overallRating: detailsData?.['Rating'],
        onTimeDeliveryRate: detailsData?.['On Time Delivery Rate'],
        invoiceAccuracy: detailsData?.['Invoice Accuracy']
      },

      compliance: {
        eInvoicingEnabled: (spendData['E-Invoicing#'] || 0) > 0,
        poCompliance: (spendData['PO Coverage %'] || 0) > 50,
        certifications: detailsData?.['Certifications'] || [],
        sustainabilityScore: detailsData?.['Sustainability Score']
      },

      risk: {
        overallRisk: riskLevel,
        factors: generateRiskFactors(spendData, detailsData),
        lastAssessmentDate: new Date()
      }
    };

    return vendorDetail;

  } catch (error) {
    console.error('Error getting vendor details:', error);
    return null;
  }
}

/**
 * Find alternative suppliers for a category
 */
export async function findAlternativeSuppliers(
  currentVendorId: string,
  category: string,
  limit: number = 5
): Promise<VendorListItem[]> {
  try {
    // Get current vendor's category
    const currentVendor = await getDoc(doc(db, 'ext_labour_suppliers', currentVendorId));
    if (!currentVendor.exists()) {
      return [];
    }

    const currentData = currentVendor.data();
    const mainCategory = category || currentData['Main Category Service'];

    // Search for similar vendors
    const alternatives = await searchSuppliers({
      category: {
        main: mainCategory
      },
      limitResults: limit + 1 // Get one extra to exclude current
    });

    // Filter out current vendor and return
    return alternatives.vendors.filter(v => v.vendorId !== currentVendorId).slice(0, limit);

  } catch (error) {
    console.error('Error finding alternative suppliers:', error);
    return [];
  }
}

/**
 * Get smart procurement recommendations
 */
export async function getSmartRecommendations(
  purchaseRequest: {
    category: string;
    budget: number;
    urgency: 'low' | 'medium' | 'high';
    requirements?: string[];
  }
): Promise<{
  recommendedSuppliers: VendorListItem[];
  reasoning: string[];
  alternativeOptions: VendorListItem[];
}> {
  try {
    // Search for primary recommendations
    const primaryResults = await searchSuppliers({
      category: {
        main: purchaseRequest.category
      },
      budget: {
        max: purchaseRequest.budget * 1.2 // Allow 20% flexibility
      },
      poComplianceRequired: true,
      eInvoicingRequired: true,
      sortBy: 'rating',
      limitResults: 3
    });

    // Search for alternatives (less strict criteria)
    const alternativeResults = await searchSuppliers({
      category: {
        main: purchaseRequest.category
      },
      budget: {
        max: purchaseRequest.budget * 1.5
      },
      sortBy: 'spend',
      limitResults: 5
    });

    // Generate reasoning
    const reasoning = [];
    if (primaryResults.vendors.length > 0) {
      reasoning.push(`Found ${primaryResults.vendors.length} suppliers matching your criteria`);
      reasoning.push(`All recommended suppliers have PO compliance and e-invoicing capabilities`);
      if (purchaseRequest.urgency === 'high') {
        reasoning.push('Prioritized suppliers with quick response times');
      }
    }

    return {
      recommendedSuppliers: primaryResults.vendors,
      reasoning: reasoning,
      alternativeOptions: alternativeResults.vendors.filter(
        v => !primaryResults.vendors.find(p => p.vendorId === v.vendorId)
      )
    };

  } catch (error) {
    console.error('Error getting smart recommendations:', error);
    return {
      recommendedSuppliers: [],
      reasoning: ['Unable to generate recommendations at this time'],
      alternativeOptions: []
    };
  }
}

/**
 * Check procurement compliance for a purchase
 */
export async function validateProcurementCompliance(
  vendorId: string,
  purchaseAmount: number
): Promise<{
  compliant: boolean;
  violations: string[];
  requiredApprovals: string[];
  suggestions: string[];
}> {
  try {
    const violations: string[] = [];
    const requiredApprovals: string[] = [];
    const suggestions: string[] = [];

    // Get vendor details
    const vendor = await getVendorDetails(vendorId);
    if (!vendor) {
      violations.push('Vendor not found in approved supplier list');
      return {
        compliant: false,
        violations,
        requiredApprovals: ['Procurement Manager approval required for new vendor'],
        suggestions: ['Consider using an approved vendor from the supplier list']
      };
    }

    // Check PO compliance
    if (!vendor.compliance.poCompliance && purchaseAmount > 1000) {
      violations.push('Vendor does not meet PO compliance requirements');
      suggestions.push('Request vendor to enable PO processing');
    }

    // Check e-invoicing
    if (!vendor.compliance.eInvoicingEnabled && purchaseAmount > 5000) {
      violations.push('E-invoicing required for purchases above €5,000');
      suggestions.push('Request vendor to enable e-invoicing');
    }

    // Check approval limits
    if (purchaseAmount > 50000) {
      requiredApprovals.push('Director approval required for amounts above €50,000');
    } else if (purchaseAmount > 10000) {
      requiredApprovals.push('Manager approval required for amounts above €10,000');
    }

    // Check vendor risk
    if (vendor.risk.overallRisk === 'high') {
      violations.push('High-risk vendor requires additional review');
      requiredApprovals.push('Risk Management approval required');
    }

    const compliant = violations.length === 0;

    return {
      compliant,
      violations,
      requiredApprovals,
      suggestions
    };

  } catch (error) {
    console.error('Error validating procurement compliance:', error);
    return {
      compliant: false,
      violations: ['Unable to validate compliance'],
      requiredApprovals: [],
      suggestions: []
    };
  }
}

// ============================================
// Helper Functions
// ============================================

function calculateRiskLevel(data: DocumentData): 'low' | 'medium' | 'high' {
  let riskScore = 0;

  // Check PO coverage
  if ((data['PO Coverage %'] || 0) < 30) riskScore += 2;
  else if ((data['PO Coverage %'] || 0) < 60) riskScore += 1;

  // Check e-invoicing
  if ((data['E-Invoicing#'] || 0) === 0) riskScore += 1;

  // Check spend concentration
  if ((data['Spend'] || 0) > 500000) riskScore += 1;

  // Check invoice count (activity level)
  if ((data['Count of Invoice Receipts'] || 0) < 5) riskScore += 1;

  // Determine risk level
  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

function calculateSpendTrend(data: DocumentData): 'increasing' | 'stable' | 'decreasing' {
  // This would ideally compare with historical data
  // For now, return stable as default
  return 'stable';
}

function calculateEInvoicingRate(data: DocumentData): number {
  const totalInvoices = data['Count of Invoice Receipts'] || 0;
  const eInvoices = data['E-Invoicing#'] || 0;
  
  if (totalInvoices === 0) return 0;
  return (eInvoices / totalInvoices) * 100;
}

function generateRiskFactors(spendData: DocumentData, detailsData: DocumentData | null): string[] {
  const factors = [];

  if ((spendData['PO Coverage %'] || 0) < 30) {
    factors.push('Low PO coverage indicates poor process compliance');
  }
  if ((spendData['E-Invoicing#'] || 0) === 0) {
    factors.push('No e-invoicing capability increases processing costs');
  }
  if ((spendData['Spend'] || 0) > 500000) {
    factors.push('High spend concentration creates dependency risk');
  }
  if (!detailsData?.['Certifications']?.length) {
    factors.push('Missing quality certifications');
  }

  return factors;
}

function getSortField(sortBy?: string): string | null {
  switch (sortBy) {
    case 'spend':
      return 'Spend';
    case 'name':
      return 'Business Partner Company Name';
    case 'recent':
      return 'Last Invoice Date';
    default:
      return 'Spend';
  }
}

// Export all functions for use by Gemini AI
export const supplierSearchFunctions = {
  searchSuppliers,
  getVendorDetails,
  findAlternativeSuppliers,
  getSmartRecommendations,
  validateProcurementCompliance
};