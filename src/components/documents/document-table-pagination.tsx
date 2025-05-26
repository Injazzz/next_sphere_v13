import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";

interface DocumentTablePaginationProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>;
  pagination: {
    pageIndex: number;
    pageSize: number;
    totalCount: number;
  };
  sortOption: {
    field: "remainingTime" | "createdAt";
    order: "asc" | "desc";
  };
  onPageSizeChange: (value: string) => void;
  onSortOptionChange: (value: {
    field: "remainingTime" | "createdAt";
    order: "asc" | "desc";
  }) => void;
}

export function DocumentTablePagination({
  table,
  pagination,
  sortOption,
  onPageSizeChange,
  onSortOptionChange,
}: DocumentTablePaginationProps) {
  return (
    <div className='flex items-center justify-between space-x-2 py-4'>
      <div className='flex items-center space-x-2'>
        <Select
          value={sortOption.field}
          onValueChange={(value) =>
            onSortOptionChange({
              ...sortOption,
              field: value as "remainingTime" | "createdAt",
            })
          }
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='remainingTime'>Remaining Time</SelectItem>
            <SelectItem value='createdAt'>Creation Date</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            onSortOptionChange({
              ...sortOption,
              order: sortOption.order === "asc" ? "desc" : "asc",
            })
          }
        >
          {sortOption.order === "asc" ? (
            <ArrowUp className='h-4 w-4' />
          ) : (
            <ArrowDown className='h-4 w-4' />
          )}
        </Button>
      </div>
      <div className='flex items-center space-x-2'>
        <div className='flex items-center space-x-2'>
          <p className='text-sm font-medium hidden md:block'>Rows per page</p>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={onPageSizeChange}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={pagination.pageSize.toString()} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
          Page {pagination.pageIndex + 1} of{" "}
          {Math.ceil(pagination.totalCount / pagination.pageSize)}
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
