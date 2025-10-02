import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  Building2,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  User,
  Download,
  BarChart
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  searchSuppliers,
  getSupplierDetails,
  getAllCategories,
  getAllCountries,
  getSupplierStats,
  type SupplierDocument,
  type SupplierSearchFilters
} from '../lib/valmetSupplierSearch';
import { searchSuppliersForChat, MAIN_CATEGORY_LOV, COUNTRY_LOV, TRAINING_NATURE_OF_SERVICE_LOV } from '../lib/supplierSearchFunction';

export const ValmetSupplierSearchSimple: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierDocument[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDocument | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Search filters - EXACTLY 5 as requested
  const [mainCategory, setMainCategory] = useState('');
  const [trainingNatureOfService, setTrainingNatureOfService] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [vendorName, setVendorName] = useState('');
  const [limit, setLimit] = useState(20);

  // Load statistics on mount
  useEffect(() => {
    loadStats();
    loadAllCategories();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getSupplierStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadAllCategories = async () => {
    try {
      const categories = await getAllCategories();
      setAllCategories(categories);
      console.log('🎯 ALL MAIN CATEGORIES FROM DATABASE:', categories);
      console.log('📊 Total unique categories:', categories.length);

      // Compare with LOV
      console.log('🔍 LOV vs Database comparison:');
      MAIN_CATEGORY_LOV.forEach(lov => {
        const found = categories.includes(lov.value);
        console.log(`   ${found ? '✅' : '❌'} LOV: "${lov.value}" - ${found ? 'FOUND' : 'NOT FOUND'} in database`);
      });

      // Show categories in DB but not in LOV
      const notInLOV = categories.filter(cat => !MAIN_CATEGORY_LOV.some(lov => lov.value === cat));
      if (notInLOV.length > 0) {
        console.log('⚠️ Categories in DB but not in LOV:', notInLOV);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleSearch = async () => {
    console.log('🔍 Testing searchSuppliersForChat function...');
    setLoading(true);
    setError(null);

    try {
      // Use the same function that AI uses
      const result = await searchSuppliersForChat({
        mainCategory: mainCategory || undefined,
        trainingNatureOfService: trainingNatureOfService || undefined,
        country: selectedCountries.length > 0 ? selectedCountries : undefined,
        vendorName: vendorName || undefined,
        limit: limit
      });

      console.log('📊 searchSuppliersForChat result:', result);

      if (!result.success) {
        setError(result.error || 'Search failed');
        setSuppliers([]);
      } else {
        // Parse the formatted supplier strings back to documents for display
        // For now, just show the count and raw results
        console.log(`✅ Found ${result.totalFound} suppliers`);
        console.log('📝 Formatted results:', result.suppliers);

        // Since searchSuppliersForChat returns formatted strings,
        // we need to also get the raw data for the table display
        const filters: SupplierSearchFilters = {
          mainCategory: mainCategory || undefined,
          trainingNatureOfService: trainingNatureOfService || undefined,
          country: selectedCountries.length > 0 ? selectedCountries.join('|') : undefined,
          vendorName: vendorName || undefined,
          maxResults: limit
        };
        const rawResults = await searchSuppliers(filters);
        setSuppliers(rawResults.suppliers);
      }
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMainCategory('');
    setTrainingNatureOfService('');
    setSelectedCountries([]);
    setVendorName('');
    setLimit(20);
    setSuppliers([]);
    setSelectedSupplier(null);
    setError(null);
  };

  const exportResults = () => {
    const csv = [
      // Header row with all fields
      ['Company', 'Corporation', 'Branch', 'Main Category', 'All Categories', 'Country', 'City', 'Contact', 'Email', 'VAT Number', 'Valmet ID', 'Payment Terms', 'Preferred', 'Code of Conduct', 'Sustainability', 'Climate Program'].join(','),
      // Data rows
      ...suppliers.map(s => {
        const o = s.original || {};
        return [
          o['Company'] || o['Branch'] || o['Corporation'] || '',
          o['Corporation'] || '',
          o['Branch'] || '',
          o['Supplier Main Category'] || '',
          o['Supplier Categories'] || '',
          o['Country/Region (Street Address)'] || '',
          o['City (Street Address)'] || '',
          o['Supplier Main Contact'] || '',
          o['Supplier Main Contact eMail'] || '',
          o['Company VAT number'] || '',
          o['ValmetID'] || '',
          o['Terms Of Payment'] || '',
          o['Preferred Supplier'] === 'X' ? 'Yes' : 'No',
          o['Valmet Supplier Code of Conduct signed'] === 'X' ? 'Yes' : 'No',
          o['Supplier sustainability policy signed'] === 'X' ? 'Yes' : 'No',
          o['Is supplier engaged to Valmet climate program?'] === 'X' || o['Is supplier engaged to Valmet climate program?'] === 'Yes' ? 'Yes' : 'No'
        ].map(v => `"${v}"`).join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valmet-suppliers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getCompanyName = (supplier: SupplierDocument): string => {
    const o = supplier.original || {};
    return o['Company'] || o['Branch'] || o['Corporation'] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Supplier Search Function - Tester
          </CardTitle>
          <CardDescription>
            Test searchSuppliersForChat function (same function used by AI) with 410+ suppliers database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="space-y-4">
            <TabsList className="grid grid-cols-2 w-[400px]">
              <TabsTrigger value="search">Search Suppliers</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4">
              {/* Search Form - Only 4 fields as requested */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Main Category - LOV Dropdown */}
                  <div className="space-y-2">
                    <Label>Main Category (exact match)</Label>
                    <Select value={mainCategory || "all"} onValueChange={(value) => setMainCategory(value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a main category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="#"># (data empty or not defined)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Business consulting">Business consulting (131)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Office IT, IT consulting">IT consulting (103)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Training & people development">Training & people development (100)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, R&D services & materials">R&D services & materials (55)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Legal services">Legal services (45)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Certification, standardization & audits">Certification, standardization & audits (26)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Patent services">Patent services (26)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Personnel, Leased workforce">Leased workforce (14)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Office IT, IT Services">IT Services (8)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Measurement & inspection">Measurement & inspection (2)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Facility investments">Facility investments (1)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Select exact category from list</p>
                  </div>

                  {/* Training Nature of Service - Dropdown */}
                  <div className="space-y-2">
                    <Label>Nature of Training Service</Label>
                    <Select value={trainingNatureOfService || "all"} onValueChange={(value) => setTrainingNatureOfService(value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select training nature..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Training Types</SelectItem>
                        <SelectItem value="#"># (data empty or not defined)</SelectItem>
                        <SelectItem value="General Training">General Training (8)</SelectItem>
                        <SelectItem value="Product, Service & Technology Training">Product, Service & Technology Training (7)</SelectItem>
                        <SelectItem value="Business Culture & Language Training">Business Culture & Language Training (6)</SelectItem>
                        <SelectItem value="Various/Other Skills">Various/Other Skills (6)</SelectItem>
                        <SelectItem value="Leadership, Management & Team Development">Leadership, Management & Team Development (5)</SelectItem>
                        <SelectItem value="Coaching & Work Counselling">Coaching & Work Counselling (5)</SelectItem>
                        <SelectItem value="HSE, Quality & Work Wellbeing">HSE, Quality & Work Wellbeing (4)</SelectItem>
                        <SelectItem value="E-learning & Digital Learning Solutions">E-learning & Digital Learning Solutions (3)</SelectItem>
                        <SelectItem value="Global Training Programs">Global Training Programs (3)</SelectItem>
                        <SelectItem value="Communication Skills Training">Communication Skills Training (2)</SelectItem>
                        <SelectItem value="Combined Leadership Programs">Combined Leadership Programs (2)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Filter by training type (optional)</p>
                  </div>

                  {/* Country - Multiple selection dropdown */}
                  <div className="space-y-2">
                    <Label>Country/Region (multiple selection)</Label>
                    <div className="relative">
                      <Select
                        value={selectedCountries.length === 1 ? selectedCountries[0] : ''}
                        onValueChange={(value) => {
                          if (value && !selectedCountries.includes(value)) {
                            setSelectedCountries([...selectedCountries, value]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select countries...">
                            {selectedCountries.length === 0
                              ? "Select countries..."
                              : selectedCountries.length === 1
                              ? selectedCountries[0]
                              : `${selectedCountries.length} countries selected`}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="#" disabled={selectedCountries.includes('#')}>
                            # (data empty or not defined)
                          </SelectItem>
                          {COUNTRY_LOV.filter(c => c.value !== '#').map((country) => (
                            <SelectItem
                              key={country.value}
                              value={country.value}
                              disabled={selectedCountries.includes(country.value)}
                            >
                              {country.label} ({country.count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Display selected countries as badges */}
                    {selectedCountries.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCountries.map(country => (
                          <Badge
                            key={country}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100"
                            onClick={() => setSelectedCountries(selectedCountries.filter(c => c !== country))}
                          >
                            {country} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Click badge to remove, select multiple countries</p>
                  </div>

                  {/* Vendor Name - Fuzzy text input */}
                  <div className="space-y-2">
                    <Label>Vendor Name (fuzzy search)</Label>
                    <Input
                      placeholder="e.g. Accenture, IBM, Nokia..."
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <p className="text-xs text-gray-500">Search in Company, Branch, Corporation</p>
                  </div>

                  {/* Max Results Limit */}
                  <div className="space-y-2">
                    <Label>Max Results</Label>
                    <Input
                      type="number"
                      min="1"
                      max="500"
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <p className="text-xs text-gray-500">Maximum number of results (1-500)</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSearch} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                  <Button onClick={handleReset} variant="outline">
                    Reset
                  </Button>
                  {suppliers.length > 0 && (
                    <Button onClick={exportResults} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV ({suppliers.length} results)
                    </Button>
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Search Results */}
              {suppliers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Found {suppliers.length} Suppliers
                  </h3>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {suppliers.map((supplier) => {
                      const o = supplier.original || {};
                      const companyName = getCompanyName(supplier);
                      
                      return (
                        <div 
                          key={supplier.documentId}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedSupplier(supplier)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold text-lg">
                                  {companyName}
                                </h4>
                                {o['Preferred Supplier'] === 'X' && (
                                  <Badge className="bg-green-100 text-green-800">
                                    Preferred
                                  </Badge>
                                )}
                                {o['Corporation Category'] && (
                                  <Badge variant="outline">
                                    {o['Corporation Category']}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {o['Supplier Main Category']?.split(',').pop()?.trim() || 'Uncategorized'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {o['Country/Region (Street Address)'] || 'Unknown'} 
                                  {o['City (Street Address)'] && `- ${o['City (Street Address)']}`}
                                </span>
                                {o['ValmetID'] && (
                                  <span>ID: {o['ValmetID']}</span>
                                )}
                              </div>

                              <div className="flex gap-3 mt-2">
                                {o['Valmet Supplier Code of Conduct signed'] === 'X' && (
                                  <span className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Code of Conduct
                                  </span>
                                )}
                                {o['Supplier sustainability policy signed'] === 'X' && (
                                  <span className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Sustainability
                                  </span>
                                )}
                                {(o['Is supplier engaged to Valmet climate program?'] === 'X' || 
                                  o['Is supplier engaged to Valmet climate program?'] === 'Yes') && (
                                  <span className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Climate Program
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSupplier(supplier);
                              }}
                            >
                              View All Fields
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {suppliers.length === 0 && !loading && !error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Enter search criteria and click Search. All fields support partial, case-insensitive matching.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-4">
              {stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Suppliers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Preferred</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {stats.preferredSuppliers}
                        </div>
                        <p className="text-xs text-gray-500">
                          {((stats.preferredSuppliers / stats.totalSuppliers) * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Code of Conduct</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats.withConductCode}
                        </div>
                        <p className="text-xs text-gray-500">
                          {((stats.withConductCode / stats.totalSuppliers) * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Climate Program</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats.inClimateProgram}
                        </div>
                        <p className="text-xs text-gray-500">
                          {((stats.inClimateProgram / stats.totalSuppliers) * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Top Countries</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(stats.byCountry)
                            .sort((a, b) => (b[1] as number) - (a[1] as number))
                            .slice(0, 10)
                            .map(([country, count]) => (
                              <div key={country} className="flex justify-between items-center">
                                <span className="text-sm">{country}</span>
                                <Badge variant="secondary">{count as number}</Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Top Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(stats.byCategory)
                            .sort((a, b) => (b[1] as number) - (a[1] as number))
                            .slice(0, 10)
                            .map(([category, count]) => (
                              <div key={category} className="flex justify-between items-center">
                                <span className="text-sm">{category}</span>
                                <Badge variant="secondary">{count as number}</Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Supplier Details Modal - Shows ALL fields */}
      {selectedSupplier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>All Supplier Fields: {getCompanyName(selectedSupplier)}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedSupplier(null)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(selectedSupplier.original || {}).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <Label className="text-xs text-gray-600">{key}</Label>
                  <p className="font-medium">
                    {value === 'X' ? '✓ Yes' : 
                     value === '' || value === null ? '-' : 
                     String(value)}
                  </p>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="text-xs text-gray-500">
              <p>Document ID: {selectedSupplier.documentId}</p>
              <p>Imported: {selectedSupplier.importedAt}</p>
              <p>Source: {selectedSupplier.sourceFile}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};