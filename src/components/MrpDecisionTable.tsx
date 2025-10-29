import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Info } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MrpFieldValue {
  value?: any;
  explanation?: string;
  'example value'?: any;
  'excampme value'?: any;
}

interface MrpDecisionRow {
  [key: string]: MrpFieldValue | any;
}

interface MrpDecisionTableProps {
  data: MrpDecisionRow[] | string;
  title?: string;
  description?: string;
  substrateFamilyKeyword?: string;
  enableExport?: boolean;
  enableSort?: boolean;
  compact?: boolean;
}

export const MrpDecisionTable: React.FC<MrpDecisionTableProps> = ({
  data,
  title = 'Purchase - Transfer - Wait - DECISION Table',
  description = 'MRP calculation results with material stock data',
  substrateFamilyKeyword,
  enableExport = true,
  enableSort = true,
  compact = false,
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Parse data if it's a string
  const tableData = useMemo(() => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as MrpDecisionRow[];
      } catch (e) {
        console.error('Failed to parse MRP table data:', e);
        return [];
      }
    }
    return Array.isArray(data) ? data : [];
  }, [data]);

  // Extract column headers from the first row, excluding Description
  const columns = useMemo(() => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]).filter(col => col.toLowerCase() !== 'description');
  }, [tableData]);

  // Extract cell value (handles nested value/explanation structure)
  const getCellValue = (row: MrpDecisionRow, column: string): any => {
    const field = row[column];

    if (field === null || field === undefined) return null;

    // Handle nested structure with value/explanation
    if (typeof field === 'object' && !Array.isArray(field)) {
      return field.value !== undefined ? field.value :
             field['example value'] !== undefined ? field['example value'] :
             field['excampme value'] !== undefined ? field['excampme value'] :
             null;
    }

    return field;
  };

  // Get explanation if available
  const getExplanation = (row: MrpDecisionRow, column: string): string | null => {
    const field = row[column];
    if (field && typeof field === 'object' && !Array.isArray(field) && field.explanation) {
      return field.explanation;
    }
    return null;
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return tableData;

    return [...tableData].sort((a, b) => {
      const aVal = getCellValue(a, sortColumn);
      const bVal = getCellValue(b, sortColumn);

      // Handle null values
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      // Try numeric comparison
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // String comparison
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tableData, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (!enableSort) return;

    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = columns;
    const rows = sortedData.map(row =>
      columns.map(col => {
        const value = getCellValue(row, col);
        return value !== null ? value : '';
      })
    );

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
    link.download = `mrp_decision_table_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderCellContent = (row: MrpDecisionRow, column: string) => {
    const value = getCellValue(row, column);
    let displayValue = value !== null ? String(value) : '—';

    // Format expected_date to remove time
    if (column.toLowerCase().includes('expected') && column.toLowerCase().includes('date') && displayValue !== '—') {
      // Handle ISO format (2025-12-02T00:00:00)
      if (displayValue.includes('T')) {
        displayValue = displayValue.split('T')[0];
      }
      // Handle space-separated format (2025-12-02 00:00:00)
      else if (displayValue.includes(' ')) {
        displayValue = displayValue.split(' ')[0];
      }
    }

    // Apply formatting based on column type
    let cellClass = '';

    // Numeric columns
    if (!isNaN(Number(value)) && value !== null && value !== '') {
      cellClass = 'font-mono';
    }

    // Special highlighting for stock levels
    if (column.toLowerCase().includes('stock') || column.toLowerCase().includes('final')) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        if (numValue < 0) {
          cellClass += ' text-red-600 font-semibold';
        } else if (numValue === 0) {
          cellClass += ' text-yellow-600';
        } else if (numValue > 0) {
          cellClass += ' text-green-600';
        }
      }
    }

    // Special handling for Material ID - show description on hover
    if (column.toLowerCase().includes('material') && column.toLowerCase().includes('id')) {
      const description = getCellValue(row, 'Description') || getCellValue(row, 'description');
      if (description) {
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <span className={cellClass}>{displayValue}</span>
                  <Info className="h-3 w-3 text-gray-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm font-semibold mb-1">Description:</p>
                <p className="text-sm">{String(description)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    }

    return <span className={cellClass}>{displayValue}</span>;
  };

  if (tableData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>
            Unable to parse MRP decision table data.
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
            <CardTitle className={compact ? "text-lg" : ""}>
              {title}
              {substrateFamilyKeyword && (
                <span className="ml-3 text-blue-600 font-mono text-base">
                  {substrateFamilyKeyword}
                </span>
              )}
            </CardTitle>
            <CardDescription className={compact ? "text-xs mt-1" : ""}>
              {description}
            </CardDescription>
          </div>
          {/* Buttons removed per user request */}
        </div>

        <div className={cn("text-sm text-gray-500", compact ? "mt-2" : "mt-3")}>
          Showing {sortedData.length} material{sortedData.length !== 1 ? 's' : ''}
        </div>
      </CardHeader>

      <CardContent className={compact ? "pt-0" : ""}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col}
                    className={cn(
                      "text-center whitespace-nowrap",
                      enableSort && "cursor-pointer hover:bg-gray-50",
                      compact && "py-2 text-xs"
                    )}
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-semibold">{col}</span>
                      {enableSort && sortColumn === col && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, rowIdx) => (
                <TableRow key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className={cn("text-center", compact && "py-2 text-xs")}
                    >
                      {renderCellContent(row, col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {sortedData.length === 0 && tableData.length > 0 && (
          <div className={cn(
            "text-center text-gray-500",
            compact ? "py-4" : "py-8"
          )}>
            No materials match your search criteria
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MrpDecisionTable;
