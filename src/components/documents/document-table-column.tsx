/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pin,
  GripVertical,
  MoreHorizontal,
  Check,
  Copy,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";
import { DocumentStatusBadge } from "./status-badge";
import { DocumentProgressBar } from "./progress-bar";
import { useDocumentStatus } from "@/hooks/use-document-status";
import { useSession } from "@/lib/auth-client";
import { DocumentStatus } from "@/generated/prisma";
import {
  formatRemainingTime,
  getTimeStatus,
  useRealTimeRemainingTime,
} from "@/lib/utils";
import { DocumentWithRelations } from "@/types/documents";

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
