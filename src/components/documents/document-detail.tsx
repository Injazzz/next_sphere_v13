/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Button } from "../ui/button";
import { DocumentStatusBadge } from "./status-badge";
import { DocumentProgressBar } from "./progress-bar";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Trash2, Check, FileCheck, File, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Document,
  DocumentFile,
  DocumentResponse,
  DocumentStatus,
} from "@/generated/prisma";
import {
  calculateDocumentStatus,
  getFlowDisplay,
  getTypeDisplay,
} from "@/lib/utils";
import { useEffect, useState } from "react";
import { FilesList } from "../file-list";

export interface DocumentDetailProps {
  document: Document & {
    client: {
      id: string;
      name: string;
      email: string;
      companyName: string;
    };
    files: DocumentFile[];
    responseFile: DocumentResponse[];
    team?: {
      id: string;
      name: string;
      members: {
        user: {
          id: string;
          name: string;
          email: string;
        };
      }[];
    };
    status: DocumentStatus;
  };
  session: {
    user: {
      id: string;
    };
  };
}

//   file,
// }: {
//   file: { id: string; url: string; name: string; documentId: string };
// }) => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(false);

//   // Function to get secure file URL using new API structure
//   const getSecureFileUrl = () => {
//     return `/api/files/download/document/${file.id}?preview=true`;
//   };

//   const getFileViewer = () => {
//     const extension = file.name.split(".").pop()?.toLowerCase();
//     const secureUrl = getSecureFileUrl();

//     // PDF viewer directly with iframe for PDF files
//     if (extension === "pdf") {
//       return (
//         <iframe
//           src={secureUrl}
//           className='w-full h-full min-h-[500px] border-0'
//           onLoad={() => setIsLoading(false)}
//           onError={() => setError(true)}
//         />
//       );
//     }

//     // Image viewer for image files
//     if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) {
//       return (
//         <div className='flex items-center justify-center h-full'>
//           <img
//             src={secureUrl}
//             alt={file.name}
//             className='max-w-full max-h-full object-contain'
//             onLoad={() => setIsLoading(false)}
//             onError={() => setError(true)}
//           />
//         </div>
//       );
//     }

//     // For other files, use Google Docs Viewer as fallback
//     return (
//       <iframe
//         src={`https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(window.location.origin + secureUrl)}`}
//         className='w-full h-full min-h-[500px] border-0'
//         onLoad={() => setIsLoading(false)}
//         onError={() => setError(true)}
//       />
//     );
//   };

//   return (
//     <div className='relative h-full min-h-[500px]'>
//       {isLoading && (
//         <div className='absolute inset-0 flex items-center justify-center'>
//           <Loader2 className='h-8 w-8 animate-spin' />
//         </div>
//       )}
//       {error ? (
//         <div className='h-full flex flex-col items-center justify-center gap-2 text-center p-4'>
//           <FileWarning className='h-12 w-12 text-yellow-500' />
//           <h3 className='text-lg font-medium'>
//             Tidak dapat menampilkan pratinjau
//           </h3>
//           <p className='text-sm text-muted-foreground'>
//             Format file tidak didukung atau file tidak dapat diakses
//           </p>
//         </div>
//       ) : (
//         getFileViewer()
//       )}
//     </div>
//   );
// };

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

const getTimeStatus = (document: DocumentDetailProps["document"]) => {
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

export function DocumentDetail({
  document: doc,
  session,
}: DocumentDetailProps) {
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetailProps | null>(null);
  const isCreator = doc.createdById === session.user.id;
  const isTeamLeader = doc.team?.members.some(
    (member) => member.user.id === session.user.id
  );
  const currentStatus = calculateDocumentStatus(doc);

  const useRealTimeRemainingTime = (
    document: DocumentDetailProps["document"]
  ) => {
    const [timeStatus, setTimeStatus] = useState(() =>
      document ? getTimeStatus(document) : null
    );

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

  const timeStatus = useRealTimeRemainingTime(doc);

  const handleStatusChange = async (status: DocumentStatus) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      toast.success(`Document status updated to ${status.toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update document status");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete document");
      }
      toast.success("Document deleted successfully");
      router.push("/dashboard/documents");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className='grid gap-y-4 lg:gap-x-4 grid-cols-1 lg:grid-cols-3'>
      <div className='md:col-span-2 space-y-4'>
        <Card>
          <CardHeader>
            <div className='flex justify-between items-start'>
              <div>
                <CardTitle>{doc.title.toUpperCase()}</CardTitle>
                <CardDescription className='mt-3'>
                  <DocumentStatusBadge status={currentStatus} />
                </CardDescription>
              </div>
              <div className='flex gap-2'>
                {doc.status === "ACTIVE" && isCreator && (
                  <Button
                    size='sm'
                    onClick={() => handleStatusChange("COMPLETED")}
                  >
                    <Check className='h-4 w-4' />
                    <span className='hidden md:block'> Mark Completed</span>
                  </Button>
                )}
                {doc.status === "COMPLETED" && isTeamLeader && (
                  <Button
                    size='sm'
                    onClick={() => handleStatusChange("APPROVED")}
                  >
                    <FileCheck className='h-4 w-4' />
                    <span className='hidden md:block'> Approve</span>
                  </Button>
                )}
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={handleDelete}
                  disabled={!isCreator}
                >
                  <Trash2 className='h-4 w-4' />
                  <span className='hidden md:block'> Delete</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Type</p>
                {getTypeDisplay(doc.type)}{" "}
                <span className='text-muted-foreground'>({doc.type})</span>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Flow</p>
                {getFlowDisplay(doc.flow)}{" "}
                <span className='text-muted-foreground'>({doc.flow})</span>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Created</p>
                <p className='font-medium'>
                  {format(new Date(doc.createdAt), "PPP")}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Last Updated</p>
                <p className='font-medium'>
                  {format(new Date(doc.updatedAt), "PPP")}
                </p>
              </div>
            </div>
            {doc.description && (
              <div className='mt-4'>
                <p className='text-sm text-muted-foreground'>Description</p>
                <p className='font-medium'>{doc.description}</p>
              </div>
            )}
            <div className='mt-6'>
              <DocumentProgressBar document={doc} status={currentStatus} />
            </div>
            <div className='grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Start Date</p>
                <p className='font-medium'>
                  {format(new Date(doc.startTrackAt), "PPP")}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>End Date</p>
                <p className='font-medium'>
                  {format(new Date(doc.endTrackAt), "PPP")}
                </p>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Time Remaining</p>
                <div className={`font-medium ${timeStatus?.color}`}>
                  {timeStatus?.isOverdue ? (
                    <span>
                      Overdue by{" "}
                      {formatRemainingTime(
                        Math.abs(timeStatus.remainingTime || 0)
                      )}
                    </span>
                  ) : timeStatus?.status === "COMPLETED" ? (
                    <span>Completed</span>
                  ) : timeStatus?.status === "APPROVED" ? (
                    <span>Approved</span>
                  ) : timeStatus?.status === "DRAFT" ? (
                    <span>Not Started</span>
                  ) : (
                    <span className='flex items-center gap-1'>
                      <Clock className='h-4 w-4' />
                      {formatRemainingTime(timeStatus?.remainingTime || 0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
            <CardDescription className='text-sm'>
              {doc.files.length} file(s) attached
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              <div>
                <h4 className='text-sm font-medium mb-3'>Document Files</h4>
                {doc.files.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    No files are attached to this document
                  </p>
                ) : (
                  <FilesList
                    files={doc.files}
                    fileType='document'
                    actions={{ download: true, preview: true, delete: true }}
                    onDeleteSuccess={(fileId) => {
                      // Update state setelah delete berhasil
                      setDocument((prev) =>
                        prev
                          ? {
                              ...prev,
                              files: prev.document.files.filter(
                                (file) => file.id !== fileId
                              ),
                            }
                          : null
                      );
                    }}
                  />
                )}
              </div>

              <div>
                <h4 className='text-sm font-medium mb-3'>
                  Response Files from client
                </h4>
                {doc.responseFile.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    No response files have been uploaded yet
                  </p>
                ) : (
                  <FilesList
                    files={doc.responseFile}
                    fileType='response'
                    actions={{
                      download: true,
                      preview: true,
                      delete: false,
                    }}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div>
                <p className='text-sm text-muted-foreground'>Name</p>
                <p className='font-medium'>{doc.client.name}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Company</p>
                <p className='font-medium'>{doc.client.companyName}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Email</p>
                <p className='font-medium'>{doc.client.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {doc.team && (
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>{doc.team.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {doc.team.members.map((member) => (
                  <div key={member.user.id} className='flex items-center gap-3'>
                    <div className='flex-1'>
                      <p className='font-medium'>{member.user.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {member.user.email}
                      </p>
                    </div>
                    {member.user.id === session.user.id && (
                      <Badge variant='outline'>You</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
