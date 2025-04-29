import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: keyof T;
    cell?: (row: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
}

export function DataTable<T>({ 
  data, 
  columns, 
  searchable = false, 
  searchKeys = [] 
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key: keyof T) => {
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Apply sorting
  let sortedData = [...data];
  if (sortConfig.key) {
    sortedData.sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === bValue) return 0;
      
      // Handle strings, numbers and dates differently
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime();
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue < bValue ? -1 : 1) 
        : (bValue < aValue ? -1 : 1);
    });
  }

  // Apply search filtering
  const filteredData = searchTerm && searchable
    ? sortedData.filter(row => {
        return searchKeys.some(key => {
          const value = row[key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchTerm);
          }
          return false;
        });
      })
    : sortedData;

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className="font-medium">
                  {column.sortable ? (
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort(column.accessorKey)}
                      className="p-0 h-auto font-medium flex items-center"
                    >
                      {column.header}
                      {sortConfig.key === column.accessorKey && (
                        sortConfig.direction === 'asc' 
                          ? <ChevronUp className="ml-1 h-4 w-4" /> 
                          : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell ? column.cell(row) : row[column.accessorKey] as React.ReactNode}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {filteredData.length} of {data.length} results
      </div>
    </div>
  );
}
