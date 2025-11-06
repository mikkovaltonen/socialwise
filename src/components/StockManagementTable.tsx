import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, ChevronUp, ChevronDown, Package, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Calendar, FileText } from 'lucide-react';

interface CRMCustomer {
  id: string;
  tampuurinumero?: string;
  customerInfo?: {
    tampuuri_tunnus?: string;
    account_name?: string;
    ytunnus?: string;
    katuosoite?: string;
    postal_code?: string;
    city?: string;
    isannoitsija?: string;
    primary_email_isannoitsija_user?: string;
    huoneistojen_lukumaara?: number | string;
    rakennusten_lukumaara?: number | string;
    kayttoonottoppaiva?: string;
    asiakkuus_alkanut?: string;
    [key: string]: any;
  };
  serviceHistory?: Record<string, any>;
  mergedAt?: string;
  [key: string]: any;
}

interface StockManagementTableProps {
  onCustomerClick?: (tampuurinumero: string) => void;
}

export function StockManagementTable({ onCustomerClick }: StockManagementTableProps = {}) {
  const { user, loading: authLoading } = useAuth();
  const [allData, setAllData] = useState<CRMCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>('tampuurinumero');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    // Wait for auth to be ready before loading data
    if (!authLoading) {
      loadStockData();
    }
  }, [authLoading]);

  const loadStockData = async () => {
    setLoading(true);
    setError('');

    try {
      const collectionName = 'crm_asikkaat_ja_palveluhistoria';
      console.log(`📊 StockManagementTable - Loading CRM customers from collection: ${collectionName}`);
      const crmRef = collection(db, collectionName);
      const snapshot = await getDocs(crmRef);

      const items: CRMCustomer[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          tampuurinumero: data.tampuurinumero || doc.id,
          customerInfo: data.customerInfo || {},
          serviceHistory: data.serviceHistory || {},
          mergedAt: data.mergedAt,
        } as CRMCustomer);
      });

      setAllData(items);

      if (items.length === 0) {
        setError('No CRM customer data found in database');
      }
    } catch (err) {
      console.error('Error loading CRM customers:', err);
      setError('Failed to load CRM customer data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Process data with sorting and filtering
  const processedData = useMemo(() => {
    let filtered = [...allData];

    // Apply search filter across multiple fields
    if (searchFilter) {
      filtered = filtered.filter(item => {
        const searchLower = searchFilter.toLowerCase();
        return (
          item.tampuurinumero?.toLowerCase().includes(searchLower) ||
          item.customerInfo?.account_name?.toLowerCase().includes(searchLower) ||
          item.customerInfo?.ytunnus?.toLowerCase().includes(searchLower) ||
          item.customerInfo?.city?.toLowerCase().includes(searchLower) ||
          item.customerInfo?.isannoitsija?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        // Handle nested customerInfo fields
        if (sortColumn.startsWith('customerInfo.')) {
          const field = sortColumn.replace('customerInfo.', '');
          aVal = a.customerInfo?.[field];
          bVal = b.customerInfo?.[field];
        } else {
          aVal = (a as any)[sortColumn];
          bVal = (b as any)[sortColumn];
        }

        // Handle null/undefined
        if (!aVal && !bVal) return 0;
        if (!aVal) return 1;
        if (!bVal) return -1;

        // Try numeric comparison first
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // Fall back to string comparison
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [allData, searchFilter, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render service history records
  const renderServiceHistory = (serviceHistory: Record<string, any>) => {
    if (!serviceHistory || Object.keys(serviceHistory).length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          No service history available
        </div>
      );
    }

    // Convert serviceHistory object to array for display
    const historyEntries = Object.entries(serviceHistory);

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm">Service History ({historyEntries.length} records)</span>
        </div>
        <div className="space-y-2">
          {historyEntries.map(([key, value], idx) => {
            // Parse the value if it's an object
            const record = typeof value === 'object' ? value : { note: value };

            return (
              <div key={idx} className="border-l-2 border-blue-200 pl-3 py-2 bg-gray-50 rounded-r">
                <div className="space-y-1">
                  {record.service_date && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{record.service_date}</span>
                    </div>
                  )}
                  {record.service_type && (
                    <div className="text-xs font-semibold text-gray-700">
                      {record.service_type}
                    </div>
                  )}
                  {record.description && (
                    <div className="text-xs text-gray-600">
                      {record.description}
                    </div>
                  )}
                  {record.status && (
                    <div className="text-xs">
                      <span className={`inline-block px-2 py-0.5 rounded ${
                        record.status === 'completed' ? 'bg-green-100 text-green-700' :
                        record.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  )}
                  {/* Display any other fields */}
                  {Object.entries(record).filter(([k]) =>
                    !['service_date', 'service_type', 'description', 'status'].includes(k)
                  ).map(([k, v]) => (
                    <div key={k} className="text-xs text-gray-500">
                      <span className="font-medium">{k}:</span> {String(v)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const columns: Array<{ key: string; label: string; width?: string }> = [
    { key: 'tampuurinumero', label: 'Tampuuri #', width: 'w-28' },
    { key: 'customerInfo.account_name', label: 'Account Name', width: 'w-48' },
    { key: 'customerInfo.ytunnus', label: 'Y-tunnus', width: 'w-32' },
    { key: 'customerInfo.katuosoite', label: 'Address', width: 'w-40' },
    { key: 'customerInfo.postal_code', label: 'Postal Code', width: 'w-24' },
    { key: 'customerInfo.city', label: 'City', width: 'w-32' },
    { key: 'customerInfo.isannoitsija', label: 'Isännöitsijä', width: 'w-40' },
    { key: 'customerInfo.primary_email_isannoitsija_user', label: 'Email', width: 'w-48' },
    { key: 'customerInfo.huoneistojen_lukumaara', label: 'Apartments', width: 'w-24' },
    { key: 'customerInfo.rakennusten_lukumaara', label: 'Buildings', width: 'w-24' },
  ];

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600">Loading CRM customer data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col space-y-2">
        <Card>
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle>CRM Customers</CardTitle>
                  <CardDescription>
                    {allData.length} customers in database
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={loadStockData}
                disabled={loading}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                size="sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Table
              </Button>
            </div>

            {/* Filters Section */}
            <div className="mt-4 space-y-3">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search by customer name, Y-tunnus, city, or property manager..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pr-8"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Showing {processedData.length} of {allData.length} customers
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="bg-gray-50">
                    {columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className={`cursor-pointer hover:bg-gray-100 ${col.width || ''}`}
                        onClick={() => handleSort(col.key)}
                      >
                        <div className="flex items-start gap-1">
                          <span className="font-semibold text-xs break-words leading-tight">{col.label}</span>
                          {sortColumn === col.key && (
                            <span className="flex-shrink-0 mt-0.5">
                              {sortDirection === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.map((item, idx) => (
                    <TableRow key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {columns.map((col) => {
                        let value: any;

                        // Handle nested customerInfo fields
                        if (col.key.startsWith('customerInfo.')) {
                          const field = col.key.replace('customerInfo.', '');
                          value = item.customerInfo?.[field];
                        } else if (col.key === 'tampuurinumero') {
                          value = item.tampuurinumero;
                        } else {
                          value = (item as any)[col.key];
                        }

                        // Show dash for null, undefined, or empty string
                        const displayValue = value !== null && value !== undefined && value !== '' ? String(value) : '-';

                        // Special handling for tampuurinumero - make it clickable
                        if (col.key === 'tampuurinumero' && onCustomerClick && displayValue !== '-') {
                          return (
                            <TableCell key={col.key} className="text-xs py-2">
                              <button
                                onClick={() => onCustomerClick(displayValue)}
                                className="text-blue-600 hover:text-blue-800 underline decoration-dotted cursor-pointer font-medium"
                              >
                                {displayValue}
                              </button>
                            </TableCell>
                          );
                        }

                        // Special handling for Y-tunnus - show service history on hover
                        if (col.key === 'customerInfo.ytunnus' && displayValue !== '-') {
                          const hasHistory = item.serviceHistory && Object.keys(item.serviceHistory).length > 0;
                          return (
                            <TableCell key={col.key} className="text-xs py-2">
                              <HoverCard openDelay={200}>
                                <HoverCardTrigger asChild>
                                  <span className={`cursor-help ${hasHistory ? 'text-blue-700 font-medium underline decoration-dotted' : ''}`}>
                                    {displayValue}
                                    {hasHistory && (
                                      <span className="ml-1 text-blue-500 text-[10px]">
                                        ({Object.keys(item.serviceHistory).length})
                                      </span>
                                    )}
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-[500px] p-4" side="right">
                                  <div className="space-y-2">
                                    <div className="border-b pb-2">
                                      <h4 className="font-semibold text-sm text-gray-900">
                                        {item.customerInfo?.account_name || 'Customer'}
                                      </h4>
                                      <p className="text-xs text-gray-500">Y-tunnus: {displayValue}</p>
                                      <p className="text-xs text-gray-500">Tampuuri: {item.tampuurinumero}</p>
                                    </div>
                                    {renderServiceHistory(item.serviceHistory || {})}
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell key={col.key} className="text-xs py-2">
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {processedData.length === 0 && allData.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                No data matches your search criteria
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
