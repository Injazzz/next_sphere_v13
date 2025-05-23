"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings2,
  X,
} from "lucide-react";
import { getStatusColor, getTypeDisplay } from "@/lib/utils";
import { DocumentStatus, DocumentType, DocumentFlow } from "@/generated/prisma";

interface DocumentFile {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  type: DocumentType;
  flow: DocumentFlow;
  status: DocumentStatus;
  computedStatus: DocumentStatus;
  description: string | null;
  startTrackAt: Date;
  endTrackAt: Date;
  completedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  files: DocumentFile[];
  responseFile: DocumentFile[];
}

export default function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/guest/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      setDocuments(data.documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  // Define columns without columnHelper
  const columns = useMemo<ColumnDef<Document>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className='h-auto p-0 font-semibold'
          >
            Title
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className='ml-2 h-4 w-4' />
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className='font-medium ml-2'>{getValue() as string}</div>
        ),
        filterFn: "includesString",
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className='h-auto p-0 font-semibold'
          >
            Type
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className='ml-2 h-4 w-4' />
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        ),
        cell: ({ getValue }) => getTypeDisplay(getValue() as DocumentType),
        filterFn: "equals",
      },
      {
        accessorKey: "computedStatus",
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className='h-auto p-0 font-semibold'
          >
            Status
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className='ml-2 h-4 w-4' />
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <Badge
            variant='outline'
            className={getStatusColor(getValue() as DocumentStatus)}
          >
            {getValue() as string}
          </Badge>
        ),
        filterFn: "equals",
      },
      {
        accessorKey: "startTrackAt",
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className='h-auto p-0 font-semibold'
          >
            Start Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className='ml-2 h-4 w-4' />
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        ),
        cell: ({ getValue }) =>
          format(new Date(getValue() as Date), "dd MMM yyyy"),
        sortingFn: "datetime",
      },
      {
        accessorKey: "endTrackAt",
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className='h-auto p-0 font-semibold'
          >
            Due Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className='ml-2 h-4 w-4' />
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        ),
        cell: ({ getValue }) =>
          format(new Date(getValue() as Date), "dd MMM yyyy"),
        sortingFn: "datetime",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Link href={`/guest/documents/${row.original.id}`}>
              <Button
                variant='ghost'
                className='cursor-pointer'
                size='icon'
                title='View Details'
              >
                <Eye className='h-4 w-4' />
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  // Create table instance
  const table = useReactTable({
    data: documents,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter,
    },
  });

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(documents.map((doc) => doc.computedStatus)));
  }, [documents]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(documents.map((doc) => doc.type)));
  }, [documents]);

  // Filter functions
  const handleStatusFilter = (value: string) => {
    if (value === "all") {
      table.getColumn("computedStatus")?.setFilterValue(undefined);
    } else {
      table.getColumn("computedStatus")?.setFilterValue(value);
    }
  };

  const handleTypeFilter = (value: string) => {
    if (value === "all") {
      table.getColumn("type")?.setFilterValue(undefined);
    } else {
      table.getColumn("type")?.setFilterValue(value);
    }
  };

  const clearAllFilters = () => {
    table.resetColumnFilters();
    setGlobalFilter("");
  };

  if (loading) {
    return (
      <Card className='p-4'>
        <div className='space-y-4'>
          <Skeleton className='h-8 w-full' />
          <Skeleton className='h-96 w-full' />
        </div>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className='p-8 text-center'>
        <FileText className='mx-auto h-12 w-12 text-muted-foreground' />
        <h3 className='mt-4 text-xl font-medium'>No Documents Found</h3>
        <p className='mt-2 text-muted-foreground'>
          You don&apos;t have any documents associated with your account yet.
        </p>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Search and Filter Controls */}
      <Card className='p-4'>
        <div className='space-y-4'>
          {/* Top row: Search and Column Visibility */}
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='relative w-full md:w-80'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search all columns...'
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className='pl-10'
              />
            </div>

            <div className='flex items-center gap-2'>
              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Settings2 className='h-4 w-4 mr-2' />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className='capitalize'
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear Filters */}
              {(globalFilter || columnFilters.length > 0) && (
                <Button variant='outline' size='sm' onClick={clearAllFilters}>
                  <X className='h-4 w-4 mr-2' />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Filter Row */}
          <div className='flex flex-col gap-4 md:flex-row md:items-center'>
            <Select
              value={
                (table
                  .getColumn("computedStatus")
                  ?.getFilterValue() as string) || "all"
              }
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className='w-full md:w-48'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={
                (table.getColumn("type")?.getFilterValue() as string) || "all"
              }
              onValueChange={handleTypeFilter}
            >
              <SelectTrigger className='w-full md:w-48'>
                <SelectValue placeholder='Filter by type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getTypeDisplay(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className='text-sm text-muted-foreground whitespace-nowrap'>
              {table.getFilteredRowModel().rows.length} of{" "}
              {table.getCoreRowModel().rows.length} documents
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className='overflow-hidden'>
        {table.getFilteredRowModel().rows.length === 0 ? (
          <div className='p-8 text-center'>
            <FileText className='mx-auto h-12 w-12 text-muted-foreground' />
            <h3 className='mt-4 text-xl font-medium'>No Documents Found</h3>
            <p className='mt-2 text-muted-foreground'>
              No documents match your current search and filter criteria.
            </p>
            <Button
              variant='outline'
              className='mt-4'
              onClick={clearAllFilters}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className='font-semibold'>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className='flex items-center justify-between border-t px-4 py-3'>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className='h-4 w-4' />
                  Previous
                </Button>

                <div className='flex items-center gap-1'>
                  {Array.from({ length: table.getPageCount() }, (_, i) => i + 1)
                    .filter((page) => {
                      const currentPage =
                        table.getState().pagination.pageIndex + 1;
                      return (
                        page === 1 ||
                        page === table.getPageCount() ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      const currentPage =
                        table.getState().pagination.pageIndex + 1;

                      // Add ellipsis
                      if (index > 0 && page - array[index - 1] > 1) {
                        return [
                          <span key={`ellipsis-${page}`} className='px-2'>
                            ...
                          </span>,
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size='sm'
                            onClick={() => table.setPageIndex(page - 1)}
                            className='h-8 w-8 p-0'
                          >
                            {page}
                          </Button>,
                        ];
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size='sm'
                          onClick={() => table.setPageIndex(page - 1)}
                          className='h-8 w-8 p-0'
                        >
                          {page}
                        </Button>
                      );
                    })}
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>

              <div className='flex items-center gap-4'>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className='h-8 w-20'>
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side='top'>
                    {[5, 10, 20, 30, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className='text-sm text-muted-foreground'>
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
