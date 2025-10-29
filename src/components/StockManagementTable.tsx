import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, ChevronUp, ChevronDown, Package, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StockItem {
  id: string;
  material_id?: string;
  supplier_keyword?: string;
  keyword?: string;
  width?: string;
  length?: string;
  ref_at_supplier?: string;
  description?: string;
  lead_time?: string;
  safety_stock?: number | string;
  total_stock?: number | string;
  reservations?: number | string;
  final_stock?: number | string;
  expected_date?: string;
  historical_slit?: string;
  [key: string]: any;
}

export function StockManagementTable() {
  const [allData, setAllData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof StockItem | null>('keyword');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [substrateFamilyFilter, setSubstrateFamilyFilter] = useState('');

  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async () => {
    setLoading(true);
    setError('');

    try {
      const stockRef = collection(db, 'stock_management');
      const snapshot = await getDocs(stockRef);

      const items: StockItem[] = [];

      // New structure: Each document represents a substrate family with nested materials array
      snapshot.forEach((doc) => {
        const data = doc.data();
        const keyword = data.keyword || doc.id; // Substrate family identifier

        // Check if materials array exists (new structure)
        if (data.materials && Array.isArray(data.materials)) {
          // Flatten the materials array
          data.materials.forEach((material: any, index: number) => {
            items.push({
              id: `${doc.id}_${index}`, // Create unique ID combining doc ID and index
              keyword: keyword, // Add the substrate family keyword
              ...material
            } as StockItem);
          });
        } else {
          // Fallback for old structure (flat documents)
          items.push({
            id: doc.id,
            ...data
          } as StockItem);
        }
      });

      setAllData(items);

      if (items.length === 0) {
        setError('No stock management data found in database');
      }
    } catch (err) {
      console.error('Error loading stock management:', err);
      setError('Failed to load stock management data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Process data with sorting and filtering
  const processedData = useMemo(() => {
    let filtered = [...allData];

    // Apply substrate family filter
    if (substrateFamilyFilter) {
      filtered = filtered.filter(item => {
        const value = item.keyword;
        return value && String(value).toLowerCase().includes(substrateFamilyFilter.toLowerCase());
      });
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

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
  }, [allData, substrateFamilyFilter, sortColumn, sortDirection]);

  const handleSort = (column: keyof StockItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const columns: Array<{ key: keyof StockItem; label: string; width?: string }> = [
    { key: 'keyword', label: 'Substrate Family', width: 'w-40' },
    { key: 'material_id', label: 'Material ID', width: 'w-28' },
    { key: 'description', label: 'Description', width: 'min-w-[250px]' },
    { key: 'supplier_keyword', label: 'Supplier', width: 'w-32' },
    { key: 'width', label: 'Width', width: 'w-24' },
    { key: 'length', label: 'Length', width: 'w-24' },
    { key: 'ref_at_supplier', label: 'Ref at Supplier', width: 'w-36' },
    { key: 'lead_time', label: 'Lead Time', width: 'w-24' },
    { key: 'safety_stock', label: 'Safety Stock', width: 'w-28' },
    { key: 'total_stock', label: 'Total Stock', width: 'w-28' },
    { key: 'reservations', label: 'Reservations', width: 'w-28' },
    { key: 'final_stock', label: 'Final Stock', width: 'w-28' },
    { key: 'expected_date', label: 'Expected Date', width: 'w-32' },
    { key: 'historical_slit', label: 'Historical Slit', width: 'w-32' },
  ];

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600">Loading stock management data...</p>
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
    <div className="h-full flex flex-col space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Stock Management</CardTitle>
                <CardDescription>
                  {allData.length} materials in inventory
                </CardDescription>
              </div>
            </div>
          </div>

          {/* Substrate Family Filter */}
          <div className="mt-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Filter by Substrate Family..."
                value={substrateFamilyFilter}
                onChange={(e) => setSubstrateFamilyFilter(e.target.value)}
                className="w-full pr-8"
              />
              {substrateFamilyFilter && (
                <button
                  onClick={() => setSubstrateFamilyFilter('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-500">
            Showing {processedData.length} of {allData.length} items
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
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="font-semibold text-xs">{col.label}</span>
                        {sortColumn === col.key && (
                          <span className="ml-auto">
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
                      let value = item[col.key] || '-';

                      // Format expected_date to remove time
                      if (col.key === 'expected_date' && value !== '-') {
                        // Handle various date formats and extract just the date part
                        const dateStr = String(value);
                        // If it contains time (space followed by time), extract just date part
                        if (dateStr.includes(' ')) {
                          value = dateStr.split(' ')[0];
                        }
                      }

                      return (
                        <TableCell key={col.key} className="text-xs py-2">
                          {value}
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
  );
}
