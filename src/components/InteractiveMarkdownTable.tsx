import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Download, Filter, X } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TableData {
  headers: string[];
  rows: string[][];
}

interface InteractiveMarkdownTableProps {
  markdownContent: string;
  title?: string;
  description?: string;
  enableExport?: boolean;
  enableSearch?: boolean;
  enableSort?: boolean;
  highlightFirstColumn?: boolean;
}

export const InteractiveMarkdownTable: React.FC<InteractiveMarkdownTableProps> = ({
  markdownContent,
  title = 'Data Table',
  description,
  enableExport = true,
  enableSearch = true,
  enableSort = true,
  highlightFirstColumn = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<number, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Parse Markdown table
  const parseMarkdownTable = (markdown: string): TableData | null => {
    const lines = markdown.trim().split('\n').filter(line => line.trim());

    // Find table lines (lines containing |)
    const tableLines = [];
    let inTable = false;

    for (const line of lines) {
      if (line.includes('|')) {
        inTable = true;
        tableLines.push(line);
      } else if (inTable && !line.includes('|')) {
        break; // End of table
      }
    }

    if (tableLines.length < 3) return null; // Need at least header, separator, and one row

    // Parse headers
    const headerLine = tableLines[0];
    const headers = headerLine
      .split('|')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    // Skip separator line (index 1)

    // Parse rows
    const rows = [];
    for (let i = 2; i < tableLines.length; i++) {
      const cells = tableLines[i]
        .split('|')
        .map(c => c.trim())
        .filter((c, idx) => idx > 0 && idx <= headers.length); // Match header count

      if (cells.length === headers.length) {
        rows.push(cells);
      }
    }

    return { headers, rows };
  };

  const tableData = useMemo(() => {
    return parseMarkdownTable(markdownContent);
  }, [markdownContent]);

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!tableData) return null;

    let filteredRows = [...tableData.rows];

    // Apply search filter
    if (searchTerm) {
      filteredRows = filteredRows.filter(row =>
        row.some(cell =>
          cell.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([colIndex, filterValue]) => {
      if (filterValue) {
        filteredRows = filteredRows.filter(row =>
          row[parseInt(colIndex)]?.toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortColumn !== null && enableSort) {
      filteredRows.sort((a, b) => {
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';

        // Try to parse as numbers first
        const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // Fall back to string comparison
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return { ...tableData, rows: filteredRows };
  }, [tableData, searchTerm, columnFilters, sortColumn, sortDirection, enableSort]);

  const handleSort = (columnIndex: number) => {
    if (!enableSort) return;

    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    if (!processedData) return;

    const csvContent = [
      processedData.headers.join(','),
      ...processedData.rows.map(row =>
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderCellContent = (content: string) => {
    // Check for special formatting
    if (content.includes('✅') || content.includes('✓')) {
      return <Badge variant="default" className="bg-green-500">{content}</Badge>;
    }
    if (content.includes('❌')) {
      return <Badge variant="destructive">{content}</Badge>;
    }
    if (content.includes('🟢')) {
      return <Badge variant="default" className="bg-green-500">Low Risk</Badge>;
    }
    if (content.includes('🟡')) {
      return <Badge variant="default" className="bg-yellow-500">Medium Risk</Badge>;
    }
    if (content.includes('🔴')) {
      return <Badge variant="destructive">High Risk</Badge>;
    }
    if (content.includes('⭐')) {
      return <span className="text-yellow-500">{content}</span>;
    }
    if (content.startsWith('**') && content.endsWith('**')) {
      return <strong>{content.slice(2, -2)}</strong>;
    }
    if (content.startsWith('€')) {
      return <span className="font-mono text-green-600">{content}</span>;
    }

    return content;
  };

  if (!processedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Table Data Found</CardTitle>
          <CardDescription>
            Could not parse a valid Markdown table from the provided content.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            {enableSearch && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            )}
            {enableExport && (
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
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
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {processedData.headers.map((header, idx) => (
                  <div key={idx} className="relative">
                    <Input
                      type="text"
                      placeholder={`Filter ${header}...`}
                      value={columnFilters[idx] || ''}
                      onChange={(e) => setColumnFilters({
                        ...columnFilters,
                        [idx]: e.target.value
                      })}
                      className="pr-8 text-sm"
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

        <div className="mt-2 text-sm text-gray-500">
          Showing {processedData.rows.length} of {tableData?.rows.length || 0} rows
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {processedData.headers.map((header, idx) => (
                  <TableHead
                    key={idx}
                    className={`${enableSort ? 'cursor-pointer hover:bg-gray-50' : ''} ${
                      highlightFirstColumn && idx === 0 ? 'font-bold bg-gray-50' : ''
                    }`}
                    onClick={() => handleSort(idx)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{header}</span>
                      {enableSort && sortColumn === idx && (
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
              {processedData.rows.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <TableCell
                      key={cellIdx}
                      className={highlightFirstColumn && cellIdx === 0 ? 'font-semibold bg-gray-50' : ''}
                    >
                      {renderCellContent(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {processedData.rows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No data matches your search criteria
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMarkdownTable;