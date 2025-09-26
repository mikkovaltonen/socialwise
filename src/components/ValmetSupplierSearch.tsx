import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
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
  Calendar,
  FileText,
  Filter,
  Download,
  BarChart
} from 'lucide-react';
import { 
  searchSuppliers, 
  getSupplierDetails, 
  getAllCategories, 
  getAllCountries,
  getSupplierStats,
  type SupplierDocument,
  type SupplierSearchFilters 
} from '../lib/valmetSupplierSearch';

export const ValmetSupplierSearch: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierDocument[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDocument | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Search filters
  const [mainCategory, setMainCategory] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [conductCodeSigned, setConductCodeSigned] = useState(false);
  const [sustainabilitySigned, setSustainabilitySigned] = useState(false);
  const [climateProgram, setClimateProgram] = useState(false);
  const [finlandSpend, setFinlandSpend] = useState(false);
  const [hasRecentActivity, setHasRecentActivity] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, countriesData, statsData] = await Promise.all([
        getAllCategories(),
        getAllCountries(),
        getSupplierStats()
      ]);
      setCategories(categoriesData);
      setCountries(countriesData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    console.log('🔍 Starting supplier search...');
    setLoading(true);
    setError(null);
    
    try {
      const filters: SupplierSearchFilters = {
        mainCategory: mainCategory || undefined,
        country: country || undefined,
        city: city || undefined,
        preferredSupplier: preferredOnly || undefined,
        conductCodeSigned: conductCodeSigned || undefined,
        sustainabilityPolicySigned: sustainabilitySigned || undefined,
        climateProgram: climateProgram || undefined,
        finlandSpend: finlandSpend || undefined,
        hasRecentPurchaseOrders: hasRecentActivity || undefined,
        hasRecentInvoices: hasRecentActivity || undefined,
        maxResults: 200
      };

      const results = await searchSuppliers(filters);
      setSuppliers(results.suppliers);
      
      console.log(`✅ Found ${results.suppliers.length} suppliers`);
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (supplier: SupplierDocument) => {
    console.log('👁️ Loading supplier details:', supplier.companyName);
    setSelectedSupplier(supplier);
  };

  const handleReset = () => {
    setMainCategory('');
    setCountry('');
    setCity('');
    setPreferredOnly(false);
    setConductCodeSigned(false);
    setSustainabilitySigned(false);
    setClimateProgram(false);
    setFinlandSpend(false);
    setHasRecentActivity(false);
    setSuppliers([]);
    setSelectedSupplier(null);
    setError(null);
  };

  const exportResults = () => {
    const csv = [
      ['Company', 'Category', 'Country', 'City', 'Contact', 'Email', 'Preferred', 'Compliance'].join(','),
      ...suppliers.map(s => [
        s.companyName,
        s.mainCategory || '',
        s.country || '',
        s.city || '',
        s.supplierMainContact || '',
        s.supplierMainContactEmail || '',
        s.preferredSupplier ? 'Yes' : 'No',
        s.conductCodeSigned ? 'Yes' : 'No'
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valmet-suppliers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Valmet Supplier Spend Data Search
          </CardTitle>
          <CardDescription>
            Search and filter Valmet's supplier database with 520+ verified suppliers
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
              {/* Search Form */}
              <div className="space-y-4">
                {/* Main Search Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Main Category</Label>
                    <Select value={mainCategory} onValueChange={setMainCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat.split(',').pop()?.trim() || cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {countries.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="Enter city name..."
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={handleSearch} 
                      className="bg-green-600 hover:bg-green-700 w-full"
                      disabled={loading}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {loading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>

                {/* Compliance Filters */}
                <div className="space-y-2">
                  <Label>Compliance & Preferences</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="preferred"
                        checked={preferredOnly}
                        onCheckedChange={(checked) => setPreferredOnly(checked as boolean)}
                      />
                      <label htmlFor="preferred" className="text-sm">Preferred Suppliers Only</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduct"
                        checked={conductCodeSigned}
                        onCheckedChange={(checked) => setConductCodeSigned(checked as boolean)}
                      />
                      <label htmlFor="conduct" className="text-sm">Code of Conduct Signed</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sustainability"
                        checked={sustainabilitySigned}
                        onCheckedChange={(checked) => setSustainabilitySigned(checked as boolean)}
                      />
                      <label htmlFor="sustainability" className="text-sm">Sustainability Policy</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="climate"
                        checked={climateProgram}
                        onCheckedChange={(checked) => setClimateProgram(checked as boolean)}
                      />
                      <label htmlFor="climate" className="text-sm">Climate Program</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="finland"
                        checked={finlandSpend}
                        onCheckedChange={(checked) => setFinlandSpend(checked as boolean)}
                      />
                      <label htmlFor="finland" className="text-sm">Finland Spend</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="activity"
                        checked={hasRecentActivity}
                        onCheckedChange={(checked) => setHasRecentActivity(checked as boolean)}
                      />
                      <label htmlFor="activity" className="text-sm">Recent Activity (3 years)</label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="outline">
                    Reset Filters
                  </Button>
                  {suppliers.length > 0 && (
                    <Button onClick={exportResults} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Found {suppliers.length} Suppliers
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {suppliers.map((supplier) => (
                      <div 
                        key={supplier.documentId}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleViewDetails(supplier)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-lg">
                                {supplier.companyName}
                              </h4>
                              {supplier.preferredSupplier && (
                                <Badge className="bg-green-100 text-green-800">
                                  Preferred
                                </Badge>
                              )}
                              {supplier.corporationCategory && (
                                <Badge variant="outline">
                                  {supplier.corporationCategory}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {supplier.mainCategory?.split(',').pop()?.trim() || 'Uncategorized'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {supplier.country || 'Unknown'} {supplier.city && `- ${supplier.city}`}
                              </span>
                              {supplier.valmetId && (
                                <span>ID: {supplier.valmetId}</span>
                              )}
                            </div>

                            <div className="flex gap-3 mt-2">
                              {supplier.conductCodeSigned && (
                                <span className="flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Code of Conduct
                                </span>
                              )}
                              {supplier.sustainabilityPolicySigned && (
                                <span className="flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Sustainability
                                </span>
                              )}
                              {supplier.climateProgram && (
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
                              handleViewDetails(supplier);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suppliers.length === 0 && !loading && !error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No suppliers found. Try adjusting your search criteria or click Search without filters to see all suppliers.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-4">
              {stats && (
                <div className="space-y-6">
                  {/* Overview Cards */}
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
                        <CardTitle className="text-sm">Preferred Suppliers</CardTitle>
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
                          {((stats.withConductCode / stats.totalSuppliers) * 100).toFixed(1)}% signed
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
                          {((stats.inClimateProgram / stats.totalSuppliers) * 100).toFixed(1)}% engaged
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Countries */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Top Countries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.byCountry)
                          .sort((a, b) => b[1] - a[1])
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

                  {/* Top Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Top Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.byCategory)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 10)
                          .map(([category, count]) => (
                            <div key={category} className="flex justify-between items-center">
                              <span className="text-sm text-ellipsis overflow-hidden">
                                {category.split(',').pop()?.trim() || category}
                              </span>
                              <Badge variant="secondary">{count as number}</Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Supplier Details Modal */}
      {selectedSupplier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Supplier Details: {selectedSupplier.companyName}</span>
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
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-semibold mb-3">Company Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-600">Company Name</Label>
                    <p>{selectedSupplier.companyName}</p>
                  </div>
                  {selectedSupplier.corporation && (
                    <div>
                      <Label className="text-gray-600">Corporation</Label>
                      <p>{selectedSupplier.corporation}</p>
                    </div>
                  )}
                  {selectedSupplier.valmetId && (
                    <div>
                      <Label className="text-gray-600">Valmet ID</Label>
                      <p>{selectedSupplier.valmetId}</p>
                    </div>
                  )}
                  {selectedSupplier.vatNumber && (
                    <div>
                      <Label className="text-gray-600">VAT Number</Label>
                      <p>{selectedSupplier.vatNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div>
                <h4 className="font-semibold mb-3">Location</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-600">Country</Label>
                    <p>{selectedSupplier.country || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">City</Label>
                    <p>{selectedSupplier.city || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact */}
              {(selectedSupplier.supplierMainContact || selectedSupplier.email) && (
                <>
                  <div>
                    <h4 className="font-semibold mb-3">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedSupplier.supplierMainContact && (
                        <div>
                          <Label className="text-gray-600">Main Contact</Label>
                          <p className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {selectedSupplier.supplierMainContact}
                          </p>
                        </div>
                      )}
                      {selectedSupplier.supplierMainContactEmail && (
                        <div>
                          <Label className="text-gray-600">Contact Email</Label>
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedSupplier.supplierMainContactEmail}
                          </p>
                        </div>
                      )}
                      {selectedSupplier.email && (
                        <div>
                          <Label className="text-gray-600">Company Email</Label>
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedSupplier.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Compliance Status */}
              <div>
                <h4 className="font-semibold mb-3">Compliance & Certifications</h4>
                <div className="flex flex-wrap gap-3">
                  <Badge variant={selectedSupplier.preferredSupplier ? 'default' : 'secondary'}>
                    {selectedSupplier.preferredSupplier ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    Preferred Supplier
                  </Badge>
                  <Badge variant={selectedSupplier.conductCodeSigned ? 'default' : 'secondary'}>
                    {selectedSupplier.conductCodeSigned ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    Code of Conduct
                  </Badge>
                  <Badge variant={selectedSupplier.sustainabilityPolicySigned ? 'default' : 'secondary'}>
                    {selectedSupplier.sustainabilityPolicySigned ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    Sustainability Policy
                  </Badge>
                  <Badge variant={selectedSupplier.climateProgram ? 'default' : 'secondary'}>
                    {selectedSupplier.climateProgram ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    Climate Program
                  </Badge>
                  {selectedSupplier.finlandSpend && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Finland Spend
                    </Badge>
                  )}
                </div>
              </div>

              {/* Activity */}
              <div>
                <h4 className="font-semibold mb-3">Recent Activity</h4>
                <div className="flex gap-4">
                  <Badge variant={selectedSupplier.purchaseOrdersLastThreeYears ? 'default' : 'secondary'}>
                    {selectedSupplier.purchaseOrdersLastThreeYears ? 
                      'Has Recent Purchase Orders' : 'No Recent Purchase Orders'}
                  </Badge>
                  <Badge variant={selectedSupplier.invoicesLastThreeYears ? 'default' : 'secondary'}>
                    {selectedSupplier.invoicesLastThreeYears ? 
                      'Has Recent Invoices' : 'No Recent Invoices'}
                  </Badge>
                </div>
              </div>

              {/* Management */}
              {selectedSupplier.valmetSupplierManager && (
                <div>
                  <h4 className="font-semibold mb-3">Management</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Valmet Supplier Manager</Label>
                      <p>{selectedSupplier.valmetSupplierManager}</p>
                    </div>
                    {selectedSupplier.categoryManager && (
                      <div>
                        <Label className="text-gray-600">Category Manager</Label>
                        <p>{selectedSupplier.categoryManager}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedSupplier.latestApproval && (
                <div>
                  <h4 className="font-semibold mb-3">Approval Information</h4>
                  <p className="text-sm">{selectedSupplier.latestApproval}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};