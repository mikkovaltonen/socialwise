import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Download, Filter, X, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface JsonTableRow {
  feature: string;
  values: string[];
  highlight?: boolean;
  format?: 'currency' | 'score' | 'percentage';
}

interface JsonTableData {
  type: 'supplier_comparison_table';
  title: string;
  description?: string;
  columns: string[];
  rows: JsonTableRow[];
}

interface InteractiveJsonTableProps {
  data: JsonTableData | string;
  enableExport?: boolean;
  enableSearch?: boolean;
  enableSort?: boolean;
  compact?: boolean;
}

export const InteractiveJsonTable: React.FC<InteractiveJsonTableProps> = ({
  data,
  enableExport = false, // Disabled by default
  enableSearch = false, // Disabled by default
  enableSort = true,
  compact = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<number, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Parse data if it's a string
  const tableData = useMemo(() => {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'supplier_comparison_table') {
          return parsed as JsonTableData;
        }
      } catch (e) {
        console.error('Failed to parse JSON table data:', e);
        return null;
      }
    }
    return data as JsonTableData;
  }, [data]);

  // Process and filter data
  const processedData = useMemo(() => {
    if (!tableData) return null;

    let filteredRows = [...tableData.rows];

    // Apply search filter
    if (searchTerm) {
      filteredRows = filteredRows.filter(row =>
        row.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.values.some(val => val.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([colIndex, filterValue]) => {
      if (filterValue) {
        filteredRows = filteredRows.filter(row => {
          const value = row.values[parseInt(colIndex)];
          return value?.toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    return { ...tableData, rows: filteredRows };
  }, [tableData, searchTerm, columnFilters]);

  const handleSort = (columnIndex: number) => {
    if (!enableSort) return;

    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  // Sort rows by column
  const sortedData = useMemo(() => {
    if (!processedData || sortColumn === null) return processedData;

    const sorted = [...processedData.rows].sort((a, b) => {
      const aVal = a.values[sortColumn] || '';
      const bVal = b.values[sortColumn] || '';

      // Handle special formats
      if (a.format === 'currency' || b.format === 'currency') {
        const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
      }

      if (a.format === 'score' || b.format === 'score') {
        const aNum = parseFloat(aVal.split('/')[0]);
        const bNum = parseFloat(bVal.split('/')[0]);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
      }

      // String comparison
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return { ...processedData, rows: sorted };
  }, [processedData, sortColumn, sortDirection]);

  const exportToCSV = () => {
    if (!sortedData) return;

    const headers = ['Feature/Criteria', ...sortedData.columns];
    const rows = sortedData.rows.map(row => [row.feature, ...row.values]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sortedData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderCellContent = (content: string, format?: string, highlight?: boolean) => {
    const baseClass = cn(
      'px-2 py-1',
      compact && 'text-sm'
    );

    // Check for special indicators
    if (content.includes('✅')) {
      return (
        <Badge variant="default" className={cn(baseClass, "bg-green-500 hover:bg-green-600")}>
          {content}
        </Badge>
      );
    }
    if (content.includes('❌')) {
      return (
        <Badge variant="destructive" className={baseClass}>
          {content}
        </Badge>
      );
    }
    if (content.includes('🟢')) {
      return (
        <Badge variant="default" className={cn(baseClass, "bg-green-500 hover:bg-green-600")}>
          {content}
        </Badge>
      );
    }
    if (content.includes('🟡')) {
      return (
        <Badge variant="default" className={cn(baseClass, "bg-yellow-500 hover:bg-yellow-600")}>
          {content}
        </Badge>
      );
    }
    if (content.includes('🔴')) {
      return (
        <Badge variant="destructive" className={baseClass}>
          {content}
        </Badge>
      );
    }

    // Format specific handling
    if (format === 'currency') {
      return <span className={cn(baseClass, "font-mono text-green-600 font-semibold")}>{content}</span>;
    }
    if (format === 'score') {
      const [score, total] = content.split('/');
      const percentage = (parseFloat(score) / parseFloat(total)) * 100;
      const color = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
      return (
        <span className={cn(baseClass, "font-bold", color)}>
          {content}
        </span>
      );
    }
    if (content.includes('⭐')) {
      return <span className={cn(baseClass, "text-yellow-500 font-semibold")}>{content}</span>;
    }

    // Highlight if specified
    if (highlight) {
      return <span className={cn(baseClass, "font-semibold")}>{content}</span>;
    }

    return <span className={baseClass}>{content}</span>;
  };

  if (!sortedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Table Data</CardTitle>
          <CardDescription>
            Could not parse the JSON table data. Please ensure the data follows the correct format.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", compact && "text-sm")}>
      <CardHeader className={compact ? "pb-3" : ""}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={compact ? "text-lg" : ""}>{sortedData.title}</CardTitle>
            {sortedData.description && (
              <CardDescription className={compact ? "text-xs mt-1" : ""}>
                {sortedData.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {enableSearch && (
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            )}
          </div>
        </div>

        {enableSearch && (
          <div className="mt-4 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("pl-10", compact && "h-8 text-sm")}
              />
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sortedData.columns.map((col, idx) => (
                  <div key={idx} className="relative">
                    <Input
                      type="text"
                      placeholder={`Filter ${col}...`}
                      value={columnFilters[idx] || ''}
                      onChange={(e) => setColumnFilters({
                        ...columnFilters,
                        [idx]: e.target.value
                      })}
                      className={cn("pr-8", compact && "h-8 text-xs")}
                    />
                    {columnFilters[idx] && (
                      <button
                        onClick={() => {
                          const newFilters = { ...columnFilters };
                          delete newFilters[idx];
                          setColumnFilters(newFilters);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={cn("text-sm text-gray-500", compact ? "mt-2" : "mt-3")}>
          Showing {sortedData.rows.length} of {tableData?.rows.length || 0} criteria
        </div>
      </CardHeader>

      <CardContent className={compact ? "pt-0" : ""}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={cn("font-bold", compact && "py-2 text-xs")}>
                  Feature/Criteria
                </TableHead>
                {sortedData.columns.map((col, idx) => (
                  <TableHead
                    key={idx}
                    className={cn(
                      "text-center",
                      enableSort && "cursor-pointer hover:bg-gray-50",
                      compact && "py-2 text-xs"
                    )}
                    onClick={() => handleSort(idx)}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-semibold">{col}</span>
                      {enableSort && (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.rows.map((row, rowIdx) => (
                <TableRow key={rowIdx} className={row.highlight ? "bg-gray-50" : ""}>
                  <TableCell className={cn("font-medium", compact && "py-2 text-xs")}>
                    {row.feature}
                  </TableCell>
                  {row.values.map((value, colIdx) => (
                    <TableCell
                      key={colIdx}
                      className={cn("text-center", compact && "py-2 text-xs")}
                    >
                      {renderCellContent(value, row.format, row.highlight)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {sortedData.rows.length === 0 && (
          <div className={cn(
            "text-center text-gray-500",
            compact ? "py-4" : "py-8"
          )}>
            No data matches your search criteria
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveJsonTable;