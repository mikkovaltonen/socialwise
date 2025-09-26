import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface DataTableProps {
  tableData?: {
    type: string;
    title: string;
    description: string;
    columns: string[];
    rows: any[];
    format: string;
  };
  fallbackText?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ tableData, fallbackText }) => {
  if (!tableData || !tableData.rows || tableData.rows.length === 0) {
    return (
      <div className="text-gray-500 p-4">
        {fallbackText || 'No data to display'}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tableData.title}</CardTitle>
        <CardDescription>{tableData.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {tableData.columns.map((column, index) => (
                  <TableHead key={index} className="whitespace-nowrap">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {tableData.columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className="whitespace-nowrap">
                      {row[column] || 'N/A'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};