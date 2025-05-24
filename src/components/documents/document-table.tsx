/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
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
  GripVertical,
  MoreHorizontal,
  Pin,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface DocumentWithRelations extends Document {
  client?: {
    id: string;
    companyName?: string | null;
  } | null;
  files?: any[];
  team?: any;
  remainingTime?: number;
  isCritical?: boolean;
}

const calculateRemainingTime = (endTrackAt: string | number | Date) => {
  const now = Date.now();
  const endTime = new Date(endTrackAt).getTime();
  return endTime - now;
};

const formatRemainingTime = (remainingTime: number) => {
  const totalSeconds = Math.abs(Math.floor(remainingTime / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hrs = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hrs}h ${mins}m`;
  }
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
};

const getTimeStatus = (document: {
  startTrackAt: string | number | Date;
  endTrackAt: string | number | Date;
  status: string;
}) => {
  const now = Date.now();
  const startTime = new Date(document.startTrackAt).getTime();
  const endTime = new Date(document.endTrackAt).getTime();
  const remainingTime = endTime - now;

  if (document.status === "COMPLETED" || document.status === "APPROVED") {
    return {
      status: document.status,
      color:
        document.status === "COMPLETED"
          ? "text-emerald-600"
          : "text-purple-600",
      isOverdue: false,
      remainingTime: 0,
    };
  }
  if (document.status === "DRAFT") {
    return {
      status: "DRAFT",
      color: "text-zinc-600",
      isOverdue: false,
      remainingTime: remainingTime,
    };
  }
  if (now < startTime) {
    return {
      status: "NOT_STARTED",
      color: "text-gray-600",
      isOverdue: false,
      remainingTime: remainingTime,
    };
  }
  if (remainingTime <= 0) {
    return {
      status: "OVERDUE",
      color: "text-red-600",
      isOverdue: true,
      remainingTime: remainingTime,
    };
  }
  if (remainingTime < 7 * 24 * 60 * 60 * 1000) {
    return {
      status: "WARNING",
      color: "text-orange-600",
      isOverdue: false,
      remainingTime: remainingTime,
    };
  }
  return {
    status: "ACTIVE",
    color: "text-blue-600",
    isOverdue: false,
    remainingTime: remainingTime,
  };
};

const useRealTimeRemainingTime = (document: DocumentWithRelations) => {
  const [timeStatus, setTimeStatus] = useState(() => getTimeStatus(document));
  useEffect(() => {
    if (
      !document ||
      document.status === "COMPLETED" ||
      document.status === "APPROVED"
    ) {
      return;
    }
    const interval = setInterval(() => {
      setTimeStatus(getTimeStatus(document));
    }, 1000);
    return () => clearInterval(interval);
  }, [document]);
  return timeStatus;
};

export const columns: ColumnDef<DocumentWithRelations>[] = [
  {
    id: "pin",
    header: "",
    cell: ({ row }) => {
      const document = row.original;
      const [isPinning, setIsPinning] = useState(false);

      const handlePinToggle = async () => {
        setIsPinning(true);
        try {
          const response = await fetch(`/api/documents/${document.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ isPinned: !document.isPinned }),
          });

          if (!response.ok) {
            throw new Error("Failed to update pin status");
          }

          window.location.reload();
        } catch (error) {
          toast.error("Failed to update pin status");
        } finally {
          setIsPinning(false);
        }
      };

      return (
        <Button
          variant='ghost'
          size='sm'
          onClick={handlePinToggle}
          disabled={isPinning}
          className='p-1 hover:bg-yellow-50'
        >
          {document.isPinned ? (
            <Pin className='h-4 w-4 text-yellow-500 fill-yellow-500' />
          ) : (
            <Pin className='h-4 w-4 text-gray-400' />
          )}
        </Button>
      );
    },
    enableSorting: false,
    size: 40,
  },
  {
    id: "drag",
    header: "",
    cell: ({ row }) => (
      <div
        className='drag-handle cursor-grab active:cursor-grabbing p-1 rounded transition-colors opacity-0 group-hover:opacity-100'
        data-row-id={row.id}
      >
        <GripVertical className='h-4 w-4 text-gray-400' />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className='font-medium text-sm flex items-center'>
        {row.original.isPinned && (
          <Pin className='h-3 w-3 text-yellow-500 fill-yellow-500 mr-1' />
        )}
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <div className='text-sm'>{row.getValue("type")}</div>,
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
      if (!document) return <div></div>;
      const { currentStatus } = useDocumentStatus({
        initialStatus: document.status,
        startTrackAt: document.startTrackAt,
        endTrackAt: document.endTrackAt,
        completedAt: document.completedAt,
        approvedAt: document.approvedAt,
        documentId: document.id,
      });
      return <DocumentProgressBar status={currentStatus} document={document} />;
    },
  },
  {
    accessorKey: "remainingTime",
    header: "Remaining Time",
    cell: ({ row }) => {
      const document = row.original;
      const timeStatus = useRealTimeRemainingTime(document);
      return (
        <div className={`text-sm font-medium ${timeStatus.color}`}>
          {timeStatus.isOverdue ? (
            <span>
              Overdue by{" "}
              {formatRemainingTime(Math.abs(timeStatus.remainingTime))}
            </span>
          ) : timeStatus.status === "COMPLETED" ? (
            <span>-</span>
          ) : timeStatus.status === "APPROVED" ? (
            <span>-</span>
          ) : timeStatus.status === "DRAFT" ? (
            <span>Not Started</span>
          ) : (
            <span>{formatRemainingTime(timeStatus.remainingTime)}</span>
          )}
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const statusA = getTimeStatus(rowA.original);
      const statusB = getTimeStatus(rowB.original);
      if (statusA.status === "COMPLETED" || statusA.status === "APPROVED")
        return 1;
      if (statusB.status === "COMPLETED" || statusB.status === "APPROVED")
        return -1;
      return statusA.remainingTime - statusB.remainingTime;
    },
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => {
      const client = row.original.client;
      return (
        <div className='text-sm'>
          {client?.companyName || `Client #${row.original.clientId}`}
        </div>
      );
    },
  },
  {
    accessorKey: "startTrackAt",
    header: "Start Date",
    cell: ({ row }) => (
      <div className='text-sm'>
        {new Date(row.getValue("startTrackAt")).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: "endTrackAt",
    header: "End Date",
    cell: ({ row }) => (
      <div className='text-sm'>
        {new Date(row.getValue("endTrackAt")).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <div className='text-sm'>
        {new Date(row.getValue("createdAt")).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const document = row.original;
      const router = useRouter();
      const [copied, setCopied] = useState(false);
      const { data: session } = useSession();
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
          window.location.reload();
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
            {session?.user?.id === document.createdById && (
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/documents/${document.id}/edit`)
                }
              >
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
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
                    <Check className='mr-2 h-4 w-4' />
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
              className='text-red-600'
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
  const [data, setData] = useState<DocumentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    totalCount: 0,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "remainingTime", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [teamDocuments, setTeamDocuments] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [draggedRow, setDraggedRow] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<{
    field: "remainingTime" | "createdAt";
    order: "asc" | "desc";
  }>({ field: "remainingTime", order: "asc" });

  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

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

  // Drag and Drop functionality
  useEffect(() => {
    const tableBody = tableBodyRef.current;
    if (!tableBody) return;

    let draggedElement: HTMLTableRowElement | null = null;
    let placeholder: HTMLTableRowElement | null = null;

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const dragHandle = target.closest(".drag-handle");
      if (!dragHandle) return;

      const row = dragHandle.closest("tr") as HTMLTableRowElement;
      if (!row) return;

      draggedElement = row;
      row.style.opacity = "0.5";
      row.classList.add("dragging");

      // Create placeholder
      placeholder = row.cloneNode(true) as HTMLTableRowElement;
      placeholder.style.visibility = "hidden";
      placeholder.style.height = row.offsetHeight + "px";
      placeholder.classList.add("drag-placeholder");

      e.dataTransfer?.setData("text/html", row.outerHTML);
      setDraggedRow(dragHandle.getAttribute("data-row-id"));
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!draggedElement || !placeholder) return;

      const target = (e.target as HTMLElement).closest(
        "tr"
      ) as HTMLTableRowElement;
      if (!target || target === draggedElement || target === placeholder)
        return;

      const tbody = target.parentNode as HTMLTableSectionElement;
      const rect = target.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (e.clientY < midpoint) {
        tbody.insertBefore(placeholder, target);
      } else {
        tbody.insertBefore(placeholder, target.nextSibling);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!draggedElement || !placeholder) return;

      // Replace placeholder with dragged element
      placeholder.parentNode?.insertBefore(draggedElement, placeholder);
      placeholder.remove();

      // Reset styles
      draggedElement.style.opacity = "";
      draggedElement.classList.remove("dragging");

      // Get new order
      const rows = Array.from(tableBody.querySelectorAll("tr[data-row-id]"));
      const newOrder = rows.map((row, index) => ({
        id: row.getAttribute("data-row-id"),
        order: index,
      }));

      // Update data order
      const reorderedData = [...data];
      const draggedRowData = reorderedData.find((item, index) => {
        const tableRow = table.getRowModel().rows[index];
        return tableRow.id === draggedRow;
      });

      if (draggedRowData) {
        const oldIndex = reorderedData.indexOf(draggedRowData);
        const newIndex = newOrder.findIndex((item) => item.id === draggedRow);
        reorderedData.splice(oldIndex, 1);
        reorderedData.splice(newIndex, 0, draggedRowData);
        setData(reorderedData);
      }

      cleanup();
    };

    const handleDragEnd = () => {
      cleanup();
    };

    const cleanup = () => {
      if (draggedElement) {
        draggedElement.style.opacity = "";
        draggedElement.classList.remove("dragging");
      }
      if (placeholder) {
        placeholder.remove();
      }
      draggedElement = null;
      placeholder = null;
      setDraggedRow(null);
    };

    // Add event listeners
    tableBody.addEventListener("dragstart", handleDragStart);
    tableBody.addEventListener("dragover", handleDragOver);
    tableBody.addEventListener("drop", handleDrop);
    tableBody.addEventListener("dragend", handleDragEnd);

    // Make drag handles draggable
    const dragHandles = tableBody.querySelectorAll(".drag-handle");
    dragHandles.forEach((handle) => {
      const row = handle.closest("tr");
      if (row) {
        row.draggable = true;
        row.setAttribute(
          "data-row-id",
          table
            .getRowModel()
            .rows.find(
              (r) =>
                r.original.id ===
                (handle as HTMLElement).getAttribute("data-row-id")
            )?.id || ""
        );
      }
    });

    return () => {
      tableBody.removeEventListener("dragstart", handleDragStart);
      tableBody.removeEventListener("dragover", handleDragOver);
      tableBody.removeEventListener("drop", handleDrop);
      tableBody.removeEventListener("dragend", handleDragEnd);
    };
  }, [data, table, draggedRow]);

  // Check if user is a team leader
  const checkTeamLeaderStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents?limit=1`);
      const result = await response.json();
      if (response.ok && result.meta && result.meta.isTeamLeader) {
        setIsTeamLeader(true);
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
        sortBy: sortOption.field,
        sortOrder: sortOption.order,
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
    sortOption,
    typeFilter,
    statusFilter,
    teamDocuments,
  ]);

  // Auto-refresh every minute to update remaining times
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        setData((prevData) =>
          prevData.map((doc) => ({
            ...doc,
            remainingTime: calculateRemainingTime(doc.endTrackAt),
            isCritical:
              calculateRemainingTime(doc.endTrackAt) < 5 * 24 * 60 * 60 * 1000,
          }))
        );
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    checkTeamLeaderStatus();
  }, [checkTeamLeaderStatus]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handlePageSizeChange = (newSize: string) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: parseInt(newSize),
      pageIndex: 0,
    }));
  };

  return (
    <div className='w-full space-y-4'>
      <div className='flex md:items-center gap-4 flex-col md:flex-row md:justify-between'>
        <div className='flex space-x-2'>
          <Input
            placeholder='Search documents...'
            value={search}
            onChange={handleSearch}
            className='max-w-sm'
          />
        </div>
        <div className='flex justify-end items-center space-x-2 ml-4'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <Columns2 className='h-4 w-4' />
                <span className='hidden md:block'> Columns</span>
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
              <Button variant='outline' size='sm'>
                <Filter className='h-4 w-4' />
                <span className='hidden md:block'> Filter</span>
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
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
                onCheckedChange={setTeamDocuments}
                disabled={!isTeamLeader}
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
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody ref={tableBodyRef}>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  <div className='flex items-center justify-center space-x-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900'></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  data-row-id={row.id}
                  className={cn(
                    "group transition-all duration-300 ease-in-out",
                    row.original.isPinned
                      ? "bg-yellow-50 dark:bg-yellow-900/10"
                      : "",
                    row.original.isCritical
                      ? "border-l-4 border-orange-500"
                      : ""
                  )}
                  style={{
                    transform:
                      draggedRow === row.id ? "scale(1.02)" : "scale(1)",
                    boxShadow:
                      draggedRow === row.id
                        ? "0 4px 12px rgba(0,0,0,0.15)"
                        : "none",
                    opacity: draggedRow === row.id ? 0.8 : 1,
                  }}
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
        <div className='flex items-center space-x-2'>
          <Select
            value={sortOption.field}
            onValueChange={(value) =>
              setSortOption((prev) => ({
                ...prev,
                field: value as "remainingTime" | "createdAt",
              }))
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
              setSortOption((prev) => ({
                ...prev,
                order: prev.order === "asc" ? "desc" : "asc",
              }))
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
              onValueChange={handlePageSizeChange}
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
    </div>
  );
}
