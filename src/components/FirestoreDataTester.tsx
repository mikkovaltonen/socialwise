import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { DataTable } from './DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  FileText,
  Receipt,
  Users,
  BarChart,
  AlertCircle,
  Loader2,
  Building2,
  Download
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  searchTrainingInvoicesForChat,
  searchContractsForChat,
  searchTrainingSuppliersForChat
} from '../lib/firestoreSearchFunctions';
import { searchSuppliersForChat, MAIN_CATEGORY_LOV } from '../lib/supplierSearchFunction';

export const FirestoreDataTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [tableData, setTableData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('valmet-suppliers');

  // Invoice search parameters
  const [invoiceParams, setInvoiceParams] = useState({
    businessPartner: '',
    status: '',
    minAmount: '',
    maxAmount: '',
    approver: '',
    reviewer: '',
    limit: '10'
  });

  // Contract search parameters
  const [contractParams, setContractParams] = useState({
    supplier: '',
    searchText: '',
    activeOnly: false,
    limit: '10'
  });

  // Training supplier parameters
  const [supplierParams, setSupplierParams] = useState({
    companyName: '',
    country: '',
    deliveryCountry: '',
    natureOfService: '',
    trainingArea: '',
    classification: '',
    preferredOnly: false,
    hasContract: false,
    hseProvider: false,
    limit: '10'
  });

  // External labour supplier parameters
  const [valmetSupplierParams, setValmetSupplierParams] = useState({
    mainCategory: '',
    supplierCategories: '',
    country: '',
    city: '',
    vendorName: '',
    limit: '20'
  });

  const searchInvoices = async () => {
    setLoading(true);
    setResponse('');
    setTableData(null);
    try {
      const params = {
        businessPartner: invoiceParams.businessPartner || undefined,
        status: invoiceParams.status || undefined,
        minAmount: invoiceParams.minAmount ? Number(invoiceParams.minAmount) : undefined,
        maxAmount: invoiceParams.maxAmount ? Number(invoiceParams.maxAmount) : undefined,
        approver: invoiceParams.approver || undefined,
        reviewer: invoiceParams.reviewer || undefined,
        limit: Number(invoiceParams.limit)
      };

      const result = await searchTrainingInvoicesForChat(params);

      if (result.success) {
        let response = `Found ${result.totalFound} training invoices\n\n`;
        if (result.summary) {
          response += `📊 Summary:\n`;
          response += `• Total Amount: €${result.summary.totalAmount.toLocaleString()}\n`;
          response += `• Unique Suppliers: ${result.summary.suppliers.length}\n\n`;
        }
        setResponse(response);
        setTableData(result.tableData);
      } else {
        setResponse(`Error: ${result.error}`);
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const searchContracts = async () => {
    setLoading(true);
    setResponse('');
    setTableData(null);
    try {
      const params = {
        supplier: contractParams.supplier || undefined,
        searchText: contractParams.searchText || undefined,
        activeOnly: contractParams.activeOnly,
        limit: Number(contractParams.limit)
      };

      const result = await searchContractsForChat(params);

      if (result.success) {
        let response = `Found ${result.totalFound} contracts\n\n`;
        if (result.summary) {
          response += `📊 Summary:\n`;
          response += `• Active Contracts: ${result.summary.activeCount}\n`;
          response += `• Unique Suppliers: ${result.summary.suppliers.length}\n\n`;
        }
        setResponse(response);
        setTableData(result.tableData);
      } else {
        setResponse(`Error: ${result.error}`);
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const searchSuppliers = async () => {
    setLoading(true);
    setResponse('');
    setTableData(null);
    try {
      const params = {
        companyName: supplierParams.companyName || undefined,
        country: supplierParams.country || undefined,
        deliveryCountry: supplierParams.deliveryCountry || undefined,
        natureOfService: supplierParams.natureOfService || undefined,
        trainingArea: supplierParams.trainingArea || undefined,
        classification: supplierParams.classification || undefined,
        preferredOnly: supplierParams.preferredOnly,
        hasContract: supplierParams.hasContract,
        hseProvider: supplierParams.hseProvider,
        limit: Number(supplierParams.limit)
      };

      const result = await searchTrainingSuppliersForChat(params);

      if (result.success) {
        let response = `Found ${result.totalFound} training suppliers\n\n`;
        if (result.summary) {
          response += `📊 Summary:\n`;
          response += `• Preferred Suppliers: ${result.summary.preferredCount}\n`;
          response += `• With Contract: ${result.summary.withContract}\n`;
          response += `• Classifications - A: ${result.summary.classifications.A}, B: ${result.summary.classifications.B}, C: ${result.summary.classifications.C}\n\n`;
        }
        setResponse(response);
        setTableData(result.tableData);
      } else {
        setResponse(`Error: ${result.error}`);
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const searchExternalLabourSuppliers = async () => {
    setLoading(true);
    setResponse('');
    setTableData(null);
    try {
      const params = {
        mainCategory: valmetSupplierParams.mainCategory || undefined,
        supplierCategories: valmetSupplierParams.supplierCategories || undefined,
        country: valmetSupplierParams.country || undefined,
        city: valmetSupplierParams.city || undefined,
        vendorName: valmetSupplierParams.vendorName || undefined,
        limit: Number(valmetSupplierParams.limit)
      };

      const result = await searchSuppliersForChat(params);

      if (result.success) {
        let response = `Found ${result.totalFound} external labour suppliers\n\n`;
        setResponse(response);
        setTableData(result.tableData);
      } else {
        setResponse(`Error: ${result.error}`);
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Procurement Data Search & Testing
          </CardTitle>
          <CardDescription>
            Search and test all procurement data: External Labour Suppliers (410+), Training Invoices, iPRO Contracts, and Training Suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="valmet-suppliers">
                <Building2 className="w-4 h-4 mr-2" />
                External Labour
              </TabsTrigger>
              <TabsTrigger value="invoices">
                <Receipt className="w-4 h-4 mr-2" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="contracts">
                <FileText className="w-4 h-4 mr-2" />
                Contracts
              </TabsTrigger>
              <TabsTrigger value="suppliers">
                <Users className="w-4 h-4 mr-2" />
                Training
              </TabsTrigger>
            </TabsList>

            {/* External Labour Suppliers Tab (Main 410+ suppliers) */}
            <TabsContent value="valmet-suppliers" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Search External Labour Suppliers (410+ suppliers)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Main Category</Label>
                    <Select
                      value={valmetSupplierParams.mainCategory || "all"}
                      onValueChange={(value) => setValmetSupplierParams({...valmetSupplierParams, mainCategory: value === "all" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select main category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Business consulting">Business consulting (131)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Personnel, Training & people development">Training & people development (100)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, R&D services & materials">R&D services & materials (52)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Legal services">Legal services (45)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Certification, standardization & audits">Certification & audits (26)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Patent services">Patent services (26)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Personnel, Leased workforce">Leased workforce (14)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Professional services, Testing, measurement & inspection">Testing & inspection (2)</SelectItem>
                        <SelectItem value="Indirect procurement iPRO, Facilities, Facility investments">Facility investments (1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Supplier Categories</Label>
                    <Input
                      placeholder="e.g., Testing, Training, Patent..."
                      value={valmetSupplierParams.supplierCategories}
                      onChange={(e) => setValmetSupplierParams({...valmetSupplierParams, supplierCategories: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Country/Region</Label>
                    <Input
                      placeholder="e.g., Finland, Germany, United..."
                      value={valmetSupplierParams.country}
                      onChange={(e) => setValmetSupplierParams({...valmetSupplierParams, country: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="e.g., Helsinki, Espoo, Stockholm..."
                      value={valmetSupplierParams.city}
                      onChange={(e) => setValmetSupplierParams({...valmetSupplierParams, city: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Vendor Name</Label>
                    <Input
                      placeholder="e.g., Accenture, IBM, Nokia..."
                      value={valmetSupplierParams.vendorName}
                      onChange={(e) => setValmetSupplierParams({...valmetSupplierParams, vendorName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input
                      type="number"
                      value={valmetSupplierParams.limit}
                      onChange={(e) => setValmetSupplierParams({...valmetSupplierParams, limit: e.target.value})}
                    />
                  </div>
                </div>

                <Button
                  onClick={searchExternalLabourSuppliers}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search External Labour Suppliers
                    </>
                  )}
                </Button>

                {/* Sample Test Buttons */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Quick Tests:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setValmetSupplierParams({
                          mainCategory: 'Indirect procurement iPRO, Professional services, Business consulting',
                          supplierCategories: '',
                          country: '',
                          city: '',
                          vendorName: '',
                          limit: '10'
                        });
                        setTimeout(searchExternalLabourSuppliers, 100);
                      }}
                    >
                      Test: Business Consulting
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setValmetSupplierParams({
                          mainCategory: '',
                          supplierCategories: '',
                          country: 'Finland',
                          city: '',
                          vendorName: '',
                          limit: '10'
                        });
                        setTimeout(searchExternalLabourSuppliers, 100);
                      }}
                    >
                      Test: Finland Suppliers
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setValmetSupplierParams({
                          mainCategory: '',
                          supplierCategories: '',
                          country: '',
                          city: '',
                          vendorName: 'Accenture',
                          limit: '5'
                        });
                        setTimeout(searchExternalLabourSuppliers, 100);
                      }}
                    >
                      Test: Search Accenture
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setValmetSupplierParams({
                          mainCategory: 'Indirect procurement iPRO, Personnel, Training & people development',
                          supplierCategories: '',
                          country: '',
                          city: 'Helsinki',
                          vendorName: '',
                          limit: '10'
                        });
                        setTimeout(searchExternalLabourSuppliers, 100);
                      }}
                    >
                      Test: Training in Helsinki
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Training Invoices Tab */}
            <TabsContent value="invoices" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Search Training Invoices (2023)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Partner</Label>
                    <Input
                      placeholder="e.g., Accenture, IBM..."
                      value={invoiceParams.businessPartner}
                      onChange={(e) => setInvoiceParams({...invoiceParams, businessPartner: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={invoiceParams.status || "all"}
                      onValueChange={(value) => setInvoiceParams({...invoiceParams, status: value === "all" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Min Amount (€)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={invoiceParams.minAmount}
                      onChange={(e) => setInvoiceParams({...invoiceParams, minAmount: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Amount (€)</Label>
                    <Input
                      type="number"
                      placeholder="100000"
                      value={invoiceParams.maxAmount}
                      onChange={(e) => setInvoiceParams({...invoiceParams, maxAmount: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Approver</Label>
                    <Input
                      placeholder="Name of approver"
                      value={invoiceParams.approver}
                      onChange={(e) => setInvoiceParams({...invoiceParams, approver: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reviewer</Label>
                    <Input
                      placeholder="Name of reviewer"
                      value={invoiceParams.reviewer}
                      onChange={(e) => setInvoiceParams({...invoiceParams, reviewer: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input
                      type="number"
                      value={invoiceParams.limit}
                      onChange={(e) => setInvoiceParams({...invoiceParams, limit: e.target.value})}
                    />
                  </div>
                </div>

                <Button
                  onClick={searchInvoices}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Training Invoices
                    </>
                  )}
                </Button>

                {/* Sample Test Buttons */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Quick Tests:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setInvoiceParams({
                          businessPartner: 'Accenture',
                          status: '',
                          minAmount: '',
                          maxAmount: '',
                          approver: '',
                          reviewer: '',
                          limit: '5'
                        });
                        setTimeout(searchInvoices, 100);
                      }}
                    >
                      Test: Accenture Invoices
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setInvoiceParams({
                          businessPartner: '',
                          status: 'Completed',
                          minAmount: '50000',
                          maxAmount: '',
                          approver: '',
                          reviewer: '',
                          limit: '10'
                        });
                        setTimeout(searchInvoices, 100);
                      }}
                    >
                      Test: High-Value Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setInvoiceParams({
                          businessPartner: '',
                          status: '',
                          minAmount: '',
                          maxAmount: '',
                          approver: '',
                          reviewer: '',
                          limit: '20'
                        });
                        setTimeout(searchInvoices, 100);
                      }}
                    >
                      Test: All Invoices (Top 20)
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* iPRO Contracts Tab */}
            <TabsContent value="contracts" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Search iPRO Contracts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier Name</Label>
                    <Input
                      placeholder="e.g., Accenture, IBM..."
                      value={contractParams.supplier}
                      onChange={(e) => setContractParams({...contractParams, supplier: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Search Text</Label>
                    <Input
                      placeholder="Any text to search for..."
                      value={contractParams.searchText}
                      onChange={(e) => setContractParams({...contractParams, searchText: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={contractParams.activeOnly}
                        onChange={(e) => setContractParams({...contractParams, activeOnly: e.target.checked})}
                        className="rounded"
                      />
                      Active Contracts Only
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input
                      type="number"
                      value={contractParams.limit}
                      onChange={(e) => setContractParams({...contractParams, limit: e.target.value})}
                    />
                  </div>
                </div>

                <Button
                  onClick={searchContracts}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Contracts
                    </>
                  )}
                </Button>

                {/* Sample Test Buttons */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Quick Tests:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setContractParams({
                          supplier: 'IBM',
                          searchText: '',
                          activeOnly: true,
                          limit: '5'
                        });
                        setTimeout(searchContracts, 100);
                      }}
                    >
                      Test: IBM Active Contracts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setContractParams({
                          supplier: '',
                          searchText: 'training',
                          activeOnly: false,
                          limit: '10'
                        });
                        setTimeout(searchContracts, 100);
                      }}
                    >
                      Test: Training Contracts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setContractParams({
                          supplier: '',
                          searchText: '',
                          activeOnly: true,
                          limit: '15'
                        });
                        setTimeout(searchContracts, 100);
                      }}
                    >
                      Test: All Active Contracts
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Training Suppliers Tab */}
            <TabsContent value="suppliers" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Search Training Suppliers</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      placeholder="e.g., Accenture, IBM..."
                      value={supplierParams.companyName}
                      onChange={(e) => setSupplierParams({...supplierParams, companyName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      placeholder="e.g., Finland, Germany..."
                      value={supplierParams.country}
                      onChange={(e) => setSupplierParams({...supplierParams, country: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Country</Label>
                    <Input
                      placeholder="e.g., Finland, Sweden..."
                      value={supplierParams.deliveryCountry}
                      onChange={(e) => setSupplierParams({...supplierParams, deliveryCountry: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nature of Service</Label>
                    <Input
                      placeholder="e.g., Training, Consulting..."
                      value={supplierParams.natureOfService}
                      onChange={(e) => setSupplierParams({...supplierParams, natureOfService: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Training Area</Label>
                    <Input
                      placeholder="e.g., Safety, Technical..."
                      value={supplierParams.trainingArea}
                      onChange={(e) => setSupplierParams({...supplierParams, trainingArea: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Classification</Label>
                    <Select
                      value={supplierParams.classification || "all"}
                      onValueChange={(value) => setSupplierParams({...supplierParams, classification: value === "all" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All classifications" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All classifications</SelectItem>
                        <SelectItem value="A">Class A</SelectItem>
                        <SelectItem value="B">Class B</SelectItem>
                        <SelectItem value="C">Class C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={supplierParams.preferredOnly}
                          onChange={(e) => setSupplierParams({...supplierParams, preferredOnly: e.target.checked})}
                          className="rounded"
                        />
                        Preferred Only
                      </Label>
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={supplierParams.hasContract}
                          onChange={(e) => setSupplierParams({...supplierParams, hasContract: e.target.checked})}
                          className="rounded"
                        />
                        Has Contract
                      </Label>
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={supplierParams.hseProvider}
                          onChange={(e) => setSupplierParams({...supplierParams, hseProvider: e.target.checked})}
                          className="rounded"
                        />
                        HSE Provider
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input
                      type="number"
                      value={supplierParams.limit}
                      onChange={(e) => setSupplierParams({...supplierParams, limit: e.target.value})}
                    />
                  </div>
                </div>

                <Button
                  onClick={searchSuppliers}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Training Suppliers
                    </>
                  )}
                </Button>

                {/* Sample Test Buttons */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Quick Tests:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSupplierParams({
                          companyName: '',
                          country: 'Finland',
                          deliveryCountry: '',
                          natureOfService: '',
                          trainingArea: '',
                          classification: 'A',
                          preferredOnly: true,
                          hasContract: false,
                          hseProvider: false,
                          limit: '10'
                        });
                        setTimeout(searchSuppliers, 100);
                      }}
                    >
                      Test: Finland Class A Preferred
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSupplierParams({
                          companyName: '',
                          country: '',
                          deliveryCountry: '',
                          natureOfService: '',
                          trainingArea: '',
                          classification: '',
                          preferredOnly: false,
                          hasContract: true,
                          hseProvider: true,
                          limit: '10'
                        });
                        setTimeout(searchSuppliers, 100);
                      }}
                    >
                      Test: HSE Providers with Contract
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSupplierParams({
                          companyName: 'Accenture',
                          country: '',
                          deliveryCountry: '',
                          natureOfService: '',
                          trainingArea: '',
                          classification: '',
                          preferredOnly: false,
                          hasContract: false,
                          hseProvider: false,
                          limit: '5'
                        });
                        setTimeout(searchSuppliers, 100);
                      }}
                    >
                      Test: Search Accenture
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

          </Tabs>

          {/* Response Display */}
          {response && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Search Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-[200px]">
                    {response}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Table Display */}
          {tableData && (
            <div className="mt-6">
              <DataTable tableData={tableData} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};