import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  ai_conclusion?: string;
  ai_output_text?: string;
  ai_processed_at?: string;
  ai_model?: string;
  processing_method?: string;
  [key: string]: any;
}

export function StockManagementTable() {
  const [allData, setAllData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof StockItem | null>('keyword');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [substrateFamilyFilter, setSubstrateFamilyFilter] = useState('');
  const [showOnlyReplenishmentMaterials, setShowOnlyReplenishmentMaterials] = useState(false);
  const [showOnlyReplenishmentFamilies, setShowOnlyReplenishmentFamilies] = useState(false);

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
          // Extract header-level AI fields
          const headerAIFields = {
            ai_output_text: data.ai_output_text,
            ai_processed_at: data.ai_processed_at,
            ai_model: data.ai_model,
            processing_method: data.processing_method
          };

          // Flatten the materials array and include header-level AI fields
          data.materials.forEach((material: any, index: number) => {
            items.push({
              id: `${doc.id}_${index}`, // Create unique ID combining doc ID and index
              keyword: keyword, // Add the substrate family keyword
              ...material,
              // Include header-level AI fields for tooltip display
              ...headerAIFields
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

    // Apply replenishment material filter (show only materials that need replenishment)
    if (showOnlyReplenishmentMaterials) {
      filtered = filtered.filter(item => {
        return item.ai_conclusion === 'YES';
      });
    }

    // Apply replenishment family filter (show all materials from families where at least one needs replenishment)
    if (showOnlyReplenishmentFamilies) {
      // First, find all substrate families that have at least one material needing replenishment
      const familiesNeedingReplenishment = new Set(
        allData
          .filter(item => item.ai_conclusion === 'YES')
          .map(item => item.keyword)
          .filter(Boolean)
      );

      // Then filter to show all materials from those families
      filtered = filtered.filter(item => {
        return item.keyword && familiesNeedingReplenishment.has(item.keyword);
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
  }, [allData, substrateFamilyFilter, showOnlyReplenishmentMaterials, showOnlyReplenishmentFamilies, sortColumn, sortDirection]);

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
    { key: 'supplier_keyword', label: 'Supplier', width: 'w-32' },
    { key: 'width', label: 'Width', width: 'w-24' },
    { key: 'ref_at_supplier', label: 'Ref at Supplier', width: 'w-36' },
    { key: 'lead_time', label: 'Lead Time', width: 'w-24' },
    { key: 'safety_stock', label: 'Safety Stock', width: 'w-28' },
    { key: 'total_stock', label: 'Total Stock', width: 'w-28' },
    { key: 'reservations', label: 'Reservations', width: 'w-28' },
    { key: 'final_stock', label: 'Final Stock', width: 'w-28' },
    { key: 'expected_date', label: 'Expected Date', width: 'w-32' },
    { key: 'historical_slit', label: 'Historical Slit', width: 'w-32' },
    { key: 'ai_conclusion', label: 'Conclusion', width: 'w-28' },
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
    <TooltipProvider>
      <div className="h-full flex flex-col space-y-2">
        <Card>
          <CardHeader className="px-4 py-3">
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
              {/* Substrate Family Filter and Toggle Filters */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
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

                {/* Toggle Filter 1: Show only materials needing replenishment */}
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Switch
                    id="replenishment-materials"
                    checked={showOnlyReplenishmentMaterials}
                    onCheckedChange={setShowOnlyReplenishmentMaterials}
                  />
                  <Label htmlFor="replenishment-materials" className="text-xs text-gray-600 cursor-pointer">
                    Show Material IDs that need replenishment
                  </Label>
                </div>

                {/* Toggle Filter 2: Show only families needing replenishment */}
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Switch
                    id="replenishment-families"
                    checked={showOnlyReplenishmentFamilies}
                    onCheckedChange={setShowOnlyReplenishmentFamilies}
                  />
                  <Label htmlFor="replenishment-families" className="text-xs text-gray-600 cursor-pointer">
                    Show substrate families where one or more material needs replenishment
                  </Label>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Showing {processedData.length} of {allData.length} items
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
                          // Handle ISO format (2025-12-02T00:00:00)
                          if (dateStr.includes('T')) {
                            value = dateStr.split('T')[0];
                          }
                          // Handle space-separated format (2025-12-02 00:00:00)
                          else if (dateStr.includes(' ')) {
                            value = dateStr.split(' ')[0];
                          }
                        }

                        // Special handling for material_id with tooltip
                        if (col.key === 'material_id' && item.description) {
                          return (
                            <TableCell key={col.key} className="text-xs py-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help underline decoration-dotted">
                                    {value}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md">
                                  <p>{item.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          );
                        }

                        // Special handling for width with tooltip showing length
                        if (col.key === 'width' && item.length) {
                          return (
                            <TableCell key={col.key} className="text-xs py-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help underline decoration-dotted">
                                    {value}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md">
                                  <p>Length: {item.length}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          );
                        }

                        // Special handling for ai_conclusion with tooltip showing all AI header info
                        if (col.key === 'ai_conclusion' && (item.ai_output_text || item.ai_model || item.processing_method)) {
                          return (
                            <TableCell key={col.key} className="text-xs py-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help underline decoration-dotted font-semibold">
                                    {value}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-4xl">
                                  <div className="space-y-2">
                                    <div>
                                      <p className="font-semibold mb-1">AI Analysis for {item.keyword}</p>
                                    </div>
                                    {item.processing_method && (
                                      <div>
                                        <span className="font-medium">Method: </span>
                                        <span>{item.processing_method}</span>
                                      </div>
                                    )}
                                    {item.ai_model && (
                                      <div>
                                        <span className="font-medium">Model: </span>
                                        <span>{item.ai_model}</span>
                                      </div>
                                    )}
                                    {item.ai_processed_at && (
                                      <div>
                                        <span className="font-medium">Processed: </span>
                                        <span>
                                          {new Date(item.ai_processed_at).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    {item.ai_output_text && (
                                      <div className="pt-2 border-t">
                                        <p className="font-medium mb-1">AI Output:</p>
                                        <p className="whitespace-pre-wrap">{item.ai_output_text}</p>
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          );
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
    </TooltipProvider>
  );
}
