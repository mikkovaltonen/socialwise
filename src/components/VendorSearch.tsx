import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Search, Building2, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { searchSupplierData, getCategories, getSupplierDetails } from '../lib/supplierSearch';
import { searchSuppliers, getVendorDetails } from '../lib/comprehensiveSupplierSearch';

interface SearchResults {
  vendors: any[];
  totalCount: number;
  summary: {
    totalSpend: number;
    categories: string[];
  };
}

// Categories from actual Valmet supplier data
const MAIN_CATEGORIES = {
  'Professional Services': [
    'Business consulting',
    'R&D services & materials',
    'Legal services',
    'Patent services',
    'Certification, standardization & audits'
  ],
  'IT Services': [
    'IT consulting',
    'Application management, IT consulting',
    'Software licenses, IT consulting'
  ],
  'Personnel Services': [
    'Training & people development',
    'Leased workforce'
  ]
};

export const VendorSearch: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  
  // Search form state - focused on category selection
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [location, setLocation] = useState('all');
  const [companySize, setCompanySize] = useState('all');
  const [certificationRequired, setCertificationRequired] = useState(false);
  const [eInvoicingRequired, setEInvoicingRequired] = useState(false);
  const [poComplianceRequired, setPoComplianceRequired] = useState(false);
  const [minRating, setMinRating] = useState('');

  const handleSearch = async () => {
    console.log('🔍 Starting vendor search...');
    console.log('Search parameters:', {
      mainCategory,
      subCategory,
      minBudget,
      maxBudget,
      eInvoicingRequired,
      poComplianceRequired,
      minRating
    });

    if (!mainCategory) {
      setError('Please select a Main Category');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Search suppliers by category
      const results = await searchSuppliers({
        category: {
          main: mainCategory,
          sub: subCategory || undefined
        },
        budget: {
          min: minBudget ? parseFloat(minBudget) : undefined,
          max: maxBudget ? parseFloat(maxBudget) : undefined
        },
        eInvoicingRequired: eInvoicingRequired || undefined,
        poComplianceRequired: poComplianceRequired || undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        limit: 100
      });
      
      console.log('✅ Search completed. Results:', {
        vendorCount: results.vendors.length,
        totalSpend: results.summary.totalSpend
      });

      // Results are already sorted by spend from the query
      const sortedVendors = results.vendors;

      setSearchResults({
        vendors: sortedVendors,
        totalCount: results.totalCount,
        summary: {
          totalSpend: results.summary.totalSpend,
          categories: results.summary.topCategories || []
        }
      });
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (vendor: any) => {
    console.log('👁️ Loading details for vendor:', vendor.companyName || vendor['Business Partner Company Name']);
    setLoading(true);
    try {
      const details = await getVendorDetails(vendor.id || vendor['Business Partner Company Name']);
      setSelectedVendor({ ...vendor, ...details });
    } catch (err) {
      // If details not found, use the vendor data we have
      console.log('ℹ️ Using cached vendor data');
      setSelectedVendor(vendor);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    console.log('🔄 Resetting search form');
    setMainCategory('');
    setSubCategory('');
    setMinBudget('');
    setMaxBudget('');
    setLocation('all');
    setCompanySize('all');
    setCertificationRequired(false);
    setEInvoicingRequired(false);
    setPoComplianceRequired(false);
    setMinRating('');
    setSearchResults(null);
    setSelectedVendor(null);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRiskLevel = (vendor: any) => {
    // Use risk level from vendor object if available, otherwise calculate
    if (vendor.riskLevel) {
      const colorMap = {
        'low': 'text-green-600',
        'medium': 'text-yellow-600',
        'high': 'text-red-600'
      };
      return { level: vendor.riskLevel.charAt(0).toUpperCase() + vendor.riskLevel.slice(1), color: colorMap[vendor.riskLevel] || 'text-gray-600' };
    }
    
    // Fallback to simple risk assessment
    const hasEInvoicing = vendor.badges?.eInvoicing || vendor['E-invoicing'] === 'YES';
    const hasPOCoverage = vendor.badges?.poCompliance || vendor['PO coverage'] === 'YES';
    const spend = vendor.annualSpend || vendor.Spend || 0;
    
    if (hasEInvoicing && hasPOCoverage) return { level: 'Low', color: 'text-green-600' };
    if (hasEInvoicing || hasPOCoverage) return { level: 'Medium', color: 'text-yellow-600' };
    if (spend > 100000) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'High', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Vendors by Service Category
          </CardTitle>
          <CardDescription>
            Search for vendors by selecting the service category you need. Results are sorted by total spend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Form */}
          <div className="space-y-4">
            {/* Main and Sub Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Main Category *</Label>
                <Select value={mainCategory} onValueChange={(value) => {
                  console.log('📂 Main category selected:', value);
                  setMainCategory(value);
                  setSubCategory(''); // Reset sub category
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(MAIN_CATEGORIES).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sub Category</Label>
                <Select value={subCategory} onValueChange={(value) => {
                  console.log('📁 Sub category selected:', value);
                  setSubCategory(value);
                }} disabled={!mainCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specific service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {mainCategory && MAIN_CATEGORIES[mainCategory as keyof typeof MAIN_CATEGORIES]?.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget Range (EUR)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min budget"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max budget"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Minimum Vendor Rating</Label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Rating</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Compliance Requirements */}
            <div className="space-y-2">
              <Label>Compliance Requirements</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="cert"
                    checked={certificationRequired}
                    onCheckedChange={(checked) => {
                      console.log('🏅 ISO Certification filter:', checked);
                      setCertificationRequired(checked as boolean);
                    }}
                  />
                  <label htmlFor="cert" className="text-sm">ISO Certified</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="einv"
                    checked={eInvoicingRequired}
                    onCheckedChange={(checked) => {
                      console.log('📧 E-Invoicing filter:', checked);
                      setEInvoicingRequired(checked as boolean);
                    }}
                  />
                  <label htmlFor="einv" className="text-sm">E-Invoicing Enabled</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="po"
                    checked={poComplianceRequired}
                    onCheckedChange={(checked) => {
                      console.log('📋 PO Compliance filter:', checked);
                      setPoComplianceRequired(checked as boolean);
                    }}
                  />
                  <label htmlFor="po" className="text-sm">PO Compliance</label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSearch} 
              className="bg-green-600 hover:bg-green-700"
              disabled={loading || !mainCategory}
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Searching...' : 'Search Vendors'}
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset Filters
            </Button>
            <Button 
              onClick={async () => {
                console.log('🐛 DEBUG: Analyzing database structure...');
                setLoading(true);
                try {
                  // Call search with no category to trigger debug mode
                  await searchSuppliers({
                    category: { main: 'DEBUG_ALL' },
                    limit: 100
                  });
                } catch (err) {
                  console.error('Debug failed:', err);
                } finally {
                  setLoading(false);
                }
              }} 
              variant="outline"
              className="text-blue-600"
            >
              Debug DB
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    {searchResults.totalCount} Vendors Found
                  </h3>
                  <p className="text-sm text-gray-600">
                    Category: {mainCategory} {subCategory && subCategory !== 'all' && `> ${subCategory}`}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  Total Spend: {formatCurrency(searchResults.summary.totalSpend)}
                </Badge>
              </div>

              {searchResults.totalCount === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No vendors found matching your criteria. Try adjusting your filters or selecting a different category.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {searchResults.vendors.map((vendor, idx) => {
                    const risk = getRiskLevel(vendor);
                    return (
                      <div 
                        key={idx}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleViewDetails(vendor)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-lg">
                                {vendor.companyName || vendor['Business Partner Company Name']}
                              </h4>
                              <Badge variant="outline" className={risk.color}>
                                Risk: {risk.level}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {vendor.primaryCategory || vendor['Main Category']} / {vendor.subCategories?.[0] || vendor['Sub Category']}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {vendor.totalOrders || vendor['Count of Invoice Receipts'] || 0} invoices
                              </span>
                              {(vendor.badges?.eInvoicing || vendor['E-invoicing'] === 'YES') && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  E-Invoice
                                </span>
                              )}
                              {(vendor.badges?.poCompliance || vendor['PO coverage'] === 'YES') && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  PO Compliant
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              {formatCurrency(vendor.annualSpend || vendor.Spend || 0)}
                            </div>
                            <div className="text-sm text-gray-500">Annual Spend</div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(vendor);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Vendor Details: {selectedVendor.companyName || selectedVendor['Business Partner Company Name']}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedVendor(null)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VendorDetailsComponent vendor={selectedVendor} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Vendor Details Component
const VendorDetailsComponent: React.FC<{ vendor: any }> = ({ vendor }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-gray-600">Annual Spend</Label>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(vendor.annualSpend || vendor.Spend || 0)}
          </p>
        </div>
        <div>
          <Label className="text-gray-600">Invoice Count</Label>
          <p className="text-xl font-bold">{vendor.totalOrders || vendor['Count of Invoice Receipts'] || 0}</p>
        </div>
        <div>
          <Label className="text-gray-600">Avg Invoice Value</Label>
          <p className="text-xl font-bold">
            {(vendor.totalOrders || vendor['Count of Invoice Receipts']) && (vendor.annualSpend || vendor.Spend)
              ? formatCurrency((vendor.annualSpend || vendor.Spend) / (vendor.totalOrders || vendor['Count of Invoice Receipts']))
              : 'N/A'}
          </p>
        </div>
        <div>
          <Label className="text-gray-600">Risk Level</Label>
          <p className="text-xl font-bold">
            {vendor.riskLevel ? (
              <span className={`${
                vendor.riskLevel === 'low' ? 'text-green-600' : 
                vendor.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {vendor.riskLevel.charAt(0).toUpperCase() + vendor.riskLevel.slice(1)}
              </span>
            ) : (
              (vendor.badges?.eInvoicing || vendor['E-invoicing'] === 'YES') && (vendor.badges?.poCompliance || vendor['PO coverage'] === 'YES') ? (
                <span className="text-green-600">Low</span>
              ) : (vendor.badges?.eInvoicing || vendor['E-invoicing'] === 'YES') || (vendor.badges?.poCompliance || vendor['PO coverage'] === 'YES') ? (
                <span className="text-yellow-600">Medium</span>
              ) : (
                <span className="text-red-600">High</span>
              )
            )}
          </p>
        </div>
      </div>

      <Separator />

      {/* Service Information */}
      <div>
        <h4 className="font-semibold mb-3">Service Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-600">Main Category</Label>
            <p>{vendor.primaryCategory || vendor['Main Category'] || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Sub Category</Label>
            <p>{vendor.subCategories?.[0] || vendor['Sub Category'] || 'N/A'}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Compliance Status */}
      <div>
        <h4 className="font-semibold mb-3">Compliance & Systems</h4>
        <div className="flex flex-wrap gap-3">
          <Badge variant={(vendor.badges?.eInvoicing || vendor['E-invoicing'] === 'YES') ? 'default' : 'secondary'}>
            E-Invoicing: {vendor.badges?.eInvoicing ? 'YES' : vendor['E-invoicing'] || 'N/A'}
          </Badge>
          <Badge variant={(vendor.badges?.poCompliance || vendor['PO coverage'] === 'YES') ? 'default' : 'secondary'}>
            PO Coverage: {vendor.badges?.poCompliance ? 'YES' : vendor['PO coverage'] || 'N/A'}
          </Badge>
          {vendor.paymentTerms && (
            <Badge variant="outline">
              Payment Terms: {vendor.paymentTerms}
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <Separator />
      <div className="flex gap-3">
        <Button className="bg-green-600 hover:bg-green-700">
          Create Purchase Request
        </Button>
        <Button variant="outline">
          Request More Information
        </Button>
        <Button variant="outline">
          View Historical Orders
        </Button>
      </div>
    </div>
  );
};