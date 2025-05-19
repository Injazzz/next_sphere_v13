/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Copy,
  Edit,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Document, DocumentStatus } from "@/generated/prisma";
import { DocumentStatusBadge } from "./status-badge";
import { DocumentProgressBar } from "./progress-bar";
import { DocumentCreateDialog } from "./document-create-dialog";
import { useDocumentStatus } from "@/hooks/use-document-status";
import { Skeleton } from "../ui/skeleton";

export interface DocumentWithRelations extends Document {
  client?: {
    id: string;
    companyName?: string | null;
  } | null;
  files?: any[];
  team?: any;
}

export const columns: ColumnDef<DocumentWithRelations>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='mb-2'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='mb-2'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <div>{row.getValue("type")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const document = row.original;
      const { currentStatus } = useDocumentStatus({
        initialStatus: document.status,
        startTrackAt: document.startTrackAt,
        endTrackAt: document.endTrackAt,
        completedAt: document.completedAt,
        approvedAt: document.approvedAt,
        documentId: document.id,
      });
      return <DocumentStatusBadge status={currentStatus} />;
    },
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const document = row.original;
      // Tambahkan fallback jika document tidak ada
      if (!document) return <Skeleton className='h-4 w-full' />;
      const { currentStatus } = useDocumentStatus({
        initialStatus: document.status,
        startTrackAt: document.startTrackAt,
        endTrackAt: document.endTrackAt,
        completedAt: document.completedAt,
        approvedAt: document.approvedAt,
        documentId: document.id,
      });
      return <DocumentProgressBar document={document} status={currentStatus} />;
    },
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => {
      const client = row.original.client;
      return (
        <div>{client?.companyName || `Client #${row.original.clientId}`}</div>
      );
    },
  },
  {
    accessorKey: "startTrackAt",
    header: "Start Date",
    cell: ({ row }) => (
      <div>{new Date(row.getValue("startTrackAt")).toLocaleDateString()}</div>
    ),
  },
  {
    accessorKey: "endTrackAt",
    header: "End Date",
    cell: ({ row }) => (
      <div>{new Date(row.getValue("endTrackAt")).toLocaleDateString()}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const document = row.original;
      const router = useRouter();
      const [copied, setCopied] = useState(false);
      const { updateStatus } = useDocumentStatus({
        initialStatus: document.status,
        startTrackAt: document.startTrackAt,
        endTrackAt: document.endTrackAt,
        completedAt: document.completedAt,
        approvedAt: document.approvedAt,
        documentId: document.id,
      });

      const handleStatusChange = async (status: DocumentStatus) => {
        try {
          await updateStatus(status);
          toast.success(`Document status updated to ${status.toLowerCase()}`);
          // Gunakan router.refresh() alih-alih window.location.reload()
          router.refresh();
        } catch (error) {
          console.error("Status update error:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to update document status"
          );
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/documents/${document.id}`)}
            >
              <Eye className='mr-2 h-4 w-4' />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/documents/${document.id}/edit`)
              }
            >
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                navigator.clipboard.writeText(document.id);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? (
                <>
                  <Check className='mr-2 h-4 w-4' />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className='mr-2 h-4 w-4' />
                  Copy ID
                </>
              )}
            </DropdownMenuItem>
            {document.status !== "DRAFT" &&
              document.status !== "COMPLETED" &&
              document.status !== "APPROVED" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("COMPLETED")}
                  >
                    <FileText className='mr-2 h-4 w-4' />
                    Mark as completed
                  </DropdownMenuItem>
                </>
              )}
            {document.status === "COMPLETED" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusChange("APPROVED")}
                >
                  <Check className='mr-2 h-4 w-4' />
                  Approve document
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                try {
                  const response = await fetch(
                    `/api/documents/${document.id}`,
                    {
                      method: "DELETE",
                    }
                  );
                  if (!response.ok) {
                    throw new Error("Failed to delete document");
                  }
                  toast.success("Document deleted successfully");
                  window.location.reload();
                } catch (error) {
                  toast.error("Failed to delete document");
                }
              }}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function DocumentTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    totalCount: 0,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [teamDocuments, setTeamDocuments] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(pagination.totalCount / pagination.pageSize),
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        });
        setPagination((prev) => ({
          ...prev,
          pageIndex: newPagination.pageIndex,
          pageSize: newPagination.pageSize,
        }));
      }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Check if user is a team leader
  const checkTeamLeaderStatus = useCallback(async () => {
    try {
      // Use the existing endpoint to check if user is a team leader
      const response = await fetch(`/api/documents?limit=1`);
      const result = await response.json();

      // If the response includes isTeamLeader information from the API
      if (response.ok && result.meta && result.meta.isTeamLeader) {
        setIsTeamLeader(true);
        // Automatically check the "Show Team Documents" option
        setTeamDocuments(true);
      }
    } catch (error) {
      console.error("Failed to check team leader status:", error);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        search,
        sortBy: sorting[0]?.id || "createdAt",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        type: typeFilter || "",
        status: statusFilter || "",
        teamDocuments: teamDocuments.toString(),
      });
      const response = await fetch(`/api/documents?${params.toString()}`);
      const result = await response.json();
      if (response.ok) {
        setData(result.data);
        setPagination((prev) => ({
          ...prev,
          totalCount: result.meta.total,
        }));

        // Check if user is a team leader from the API response
        if (result.meta && result.meta.isTeamLeader !== undefined) {
          setIsTeamLeader(result.meta.isTeamLeader);
        }
      } else {
        toast.error(result.error || "Failed to fetch documents");
      }
    } catch (error) {
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    search,
    sorting,
    typeFilter,
    statusFilter,
    teamDocuments,
  ]);

  // Initial data load and check team leader status
  useEffect(() => {
    checkTeamLeaderStatus();
  }, [checkTeamLeaderStatus]);

  // Fetch documents whenever relevant dependencies change
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col lg:flex-row items-start lg:items-center py-4 gap-3'>
        <Input
          placeholder='Search documents...'
          value={search}
          onChange={handleSearch}
          className='sm:max-w-sm w-full'
        />

        <div className='flex items-center ml-auto gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='ml-auto'>
                <Columns2 className='mr-2 h-4 w-4' />
                <span className='hidden md:block'>Columns</span>
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline'>
                <Filter className='mr-2 h-4 w-4' />
                <span className='hidden md:block'> Filter</span>
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              {["SPK", "JO", "BA", "IS", "SA", "INVOICE"].map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={typeFilter === type}
                  onCheckedChange={(checked) =>
                    setTypeFilter(checked ? type : null)
                  }
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              {[
                "DRAFT",
                "ACTIVE",
                "WARNING",
                "OVERDUE",
                "COMPLETED",
                "APPROVED",
              ].map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={(checked) =>
                    setStatusFilter(checked ? status : null)
                  }
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={teamDocuments}
                disabled={isTeamLeader && teamDocuments}
                onCheckedChange={setTeamDocuments}
              >
                Show Team Documents
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DocumentCreateDialog onSuccess={fetchDocuments} />
        </div>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between space-x-2 py-4'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {pagination.totalCount} row(s) selected.
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
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
