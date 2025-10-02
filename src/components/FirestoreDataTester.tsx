import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Search,
  FileText,
  Loader2,
  Building2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { search_suppliers, COUNTRY_LOV } from '../lib/supplierSearchFunction';

// Training Nature of Service LOV
const TRAINING_NATURE_OF_SERVICE_LOV = [
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

export const FirestoreDataTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [tableData, setTableData] = useState<any>(null);

  // Simplified supplier search parameters
  const [supplierParams, setSupplierParams] = useState({
    mainCategory: '',
    country: [] as string[],
    trainingNatureOfService: '',
    company: '',
    preferredSupplier: '',
    limit: '20'
  });

  const searchSuppliers = async () => {
    setLoading(true);
    setResponse('');
    setTableData(null);
    try {
      const params = {
        mainCategory: supplierParams.mainCategory || undefined,
        country: supplierParams.country.length > 0 ? supplierParams.country : undefined,
        trainingNatureOfService: supplierParams.trainingNatureOfService || undefined,
        vendorName: supplierParams.company || undefined,
        preferredSupplier: supplierParams.preferredSupplier || undefined,
        limit: Number(supplierParams.limit)
      };

      const result = await search_suppliers(params);

      if (result.success) {
        const response = `Found ${result.totalFound} suppliers\n\n`;
        setResponse(response);
        setTableData(result.suppliers);
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
            Supplier Database Search
          </CardTitle>
          <CardDescription>
            Search the unified supplier database (~400 verified suppliers)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Search Suppliers (~400 verified suppliers)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Main Category</Label>
                <Select
                  value={supplierParams.mainCategory || "all"}
                  onValueChange={(value) => setSupplierParams({...supplierParams, mainCategory: value === "all" ? "" : value})}
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
                <Label>Country (Multiple Selection)</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !supplierParams.country.includes(value)) {
                      setSupplierParams({...supplierParams, country: [...supplierParams.country, value]});
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select countries...">
                      {supplierParams.country.length === 0
                        ? "Select countries..."
                        : `${supplierParams.country.length} selected`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {COUNTRY_LOV.map((country) => (
                      <SelectItem
                        key={country.value}
                        value={country.value}
                        disabled={supplierParams.country.includes(country.value)}
                      >
                        {country.label} ({country.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {supplierParams.country.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {supplierParams.country.map(c => (
                      <span
                        key={c}
                        className="px-2 py-1 bg-gray-100 rounded text-xs cursor-pointer hover:bg-red-100"
                        onClick={() => setSupplierParams({...supplierParams, country: supplierParams.country.filter(x => x !== c)})}
                      >
                        {c} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Training Nature of Service</Label>
                <Select
                  value={supplierParams.trainingNatureOfService || "all"}
                  onValueChange={(value) => setSupplierParams({...supplierParams, trainingNatureOfService: value === "all" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select training type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Training Types</SelectItem>
                    {TRAINING_NATURE_OF_SERVICE_LOV.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label} ({item.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  placeholder="e.g., Accenture, IBM, Nokia..."
                  value={supplierParams.company}
                  onChange={(e) => setSupplierParams({...supplierParams, company: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Supplier</Label>
                <Select
                  value={supplierParams.preferredSupplier || "all"}
                  onValueChange={(value) => setSupplierParams({...supplierParams, preferredSupplier: value === "all" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    <SelectItem value="true">Preferred Only</SelectItem>
                    <SelectItem value="false">Non-Preferred Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Number of Results</Label>
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
                  Search Suppliers
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
                      mainCategory: 'Indirect procurement iPRO, Professional services, Business consulting',
                      country: [],
                      trainingNatureOfService: '',
                      company: '',
                      preferredSupplier: 'true',
                      limit: '10'
                    });
                    setTimeout(searchSuppliers, 100);
                  }}
                >
                  Test: Preferred Business Consulting
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSupplierParams({
                      mainCategory: '',
                      country: ['Finland'],
                      trainingNatureOfService: '',
                      company: '',
                      preferredSupplier: '',
                      limit: '10'
                    });
                    setTimeout(searchSuppliers, 100);
                  }}
                >
                  Test: Finland Suppliers
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSupplierParams({
                      mainCategory: 'Indirect procurement iPRO, Personnel, Training & people development',
                      country: [],
                      trainingNatureOfService: 'Leadership, Management & Team Development',
                      company: '',
                      preferredSupplier: '',
                      limit: '10'
                    });
                    setTimeout(searchSuppliers, 100);
                  }}
                >
                  Test: Leadership Training
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSupplierParams({
                      mainCategory: '',
                      country: [],
                      trainingNatureOfService: 'HSE, Quality & Work Wellbeing',
                      company: '',
                      preferredSupplier: 'true',
                      limit: '5'
                    });
                    setTimeout(searchSuppliers, 100);
                  }}
                >
                  Test: Preferred HSE Training
                </Button>
              </div>
            </div>
          </div>

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

          {/* Raw JSON Display */}
          {tableData && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Raw JSON Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px]">
                    {JSON.stringify(tableData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};