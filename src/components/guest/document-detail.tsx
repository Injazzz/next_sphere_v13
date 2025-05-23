"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarIcon, Clock } from "lucide-react";
import {
  getStatusColor,
  getTypeDisplay,
  calculateDocumentStatus,
} from "@/lib/utils";
import { DocumentStatus, DocumentType, DocumentFlow } from "@/generated/prisma";
import { FileUpload } from "../file-upload";
import { Badge } from "../ui/badge";
import { DocumentProgressBar } from "../documents/progress-bar";
import { FilesList } from "../file-list";

interface DocumentFile {
  id: string;
  name: string;
  size: number;
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
  updatedAt: Date;
  clientId: string;
  createdById: string;
  teamId: string | null;
  files: DocumentFile[];
  responseFile: DocumentFile[];
}

export default function DocumentDetail({ id }: { id: string }) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  const formatRemainingTime = (remainingTime: number) => {
    const totalSeconds = Math.abs(Math.floor(remainingTime / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hrs = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    // Format display berdasarkan durasi
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

  const useRealTimeRemainingTime = (document: Document | null) => {
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

  const timeStatus = useRealTimeRemainingTime(document);

  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/guest/documents/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }
      const data = await response.json();
      setDocument(data.document);
    } catch (error) {
      console.error("Error fetching document:", error);
      toast.error("Failed to load document details");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (uploadedFiles: File[]) => {
    toast.success(
      `${uploadedFiles.length} response file(s) uploaded successfully`
    );
    // Refresh document data
    fetchDocument();
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      const formData = new FormData();
      formData.append("documentId", id);
      formData.append("fileType", "response");

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload files");
      }

      const result = await response.json();
      handleUploadComplete(result.files);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-48' />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-64' />
            <Skeleton className='h-4 w-32' />
          </CardHeader>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className='h-4 w-full mb-2' />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] space-y-4'>
        <h2 className='text-2xl font-bold'>Document Not Found</h2>
        <p className='text-muted-foreground text-center'>
          The requested document could not be found or you don&apos;t have
          access to it.
        </p>
        <Link href='/guest/documents'>
          <Button>Go Back to Documents</Button>
        </Link>
      </div>
    );
  }

  const currentStatus = calculateDocumentStatus(document);

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Link href='/guest/documents'>
          <Button variant='ghost' size='sm'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
        </Link>
        <h1 className='text-2xl font-bold'>{document.title}</h1>
        <Badge className={getStatusColor(document.computedStatus)}>
          {document.computedStatus}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
          <CardDescription>
            Information about this document and its timeline
          </CardDescription>
        </CardHeader>
        <CardContent className='w-full space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Type</p>
              <p className='font-medium'>{getTypeDisplay(document.type)}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Description</p>
              <p className='font-medium'>
                {document.description || "No description provided"}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Start Date</p>
              <p className='font-medium flex items-center gap-2'>
                <CalendarIcon className='h-4 w-4' />
                {format(new Date(document.startTrackAt), "dd MMM yyyy")}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Due Date</p>
              <p className='font-medium flex items-center gap-2'>
                <Clock className='h-4 w-4' />
                {format(new Date(document.endTrackAt), "dd MMM yyyy")}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Time Remaining</p>
              <div className={`text-sm font-medium ${timeStatus?.color}`}>
                {timeStatus?.isOverdue ? (
                  <span>
                    Overdue by{" "}
                    {formatRemainingTime(
                      Math.abs(timeStatus.remainingTime || 0)
                    )}
                  </span>
                ) : timeStatus?.status === "COMPLETED" ? (
                  <span>-</span>
                ) : timeStatus?.status === "APPROVED" ? (
                  <span>-</span>
                ) : timeStatus?.status === "DRAFT" ? (
                  <span>Not Started</span>
                ) : (
                  <span>
                    {formatRemainingTime(timeStatus?.remainingTime || 0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className='text-sm text-muted-foreground'>Timeline Progress</p>
            <div className='space-y-2 mt-2'>
              <DocumentProgressBar document={document} status={currentStatus} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Files</CardTitle>
          <CardDescription>Files associated with this document</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div>
              <h4 className='text-sm font-medium mb-3'>Document Files</h4>
              {document.files.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  No files are attached to this document
                </p>
              ) : (
                <FilesList
                  files={document.files}
                  fileType='document'
                  actions={{ download: true, preview: true, delete: false }}
                />
              )}
            </div>

            <div>
              <h4 className='text-sm font-medium mb-3'>Response Files</h4>
              {document.responseFile.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  No response files have been uploaded yet
                </p>
              ) : (
                <FilesList
                  files={document.responseFile}
                  fileType='response'
                  actions={{
                    download: true,
                    preview: true,
                    delete: true,
                  }}
                  onDeleteSuccess={(fileId) => {
                    setDocument((prev) =>
                      prev
                        ? {
                            ...prev,
                            responseFile: prev.responseFile.filter(
                              (file) => file.id !== fileId
                            ),
                          }
                        : null
                    );
                  }}
                />
              )}
            </div>

            {["PENDING_RESPONSE", "WARNING", "OVERDUE", "ACTIVE"].includes(
              document.computedStatus
            ) && (
              <div>
                <h4 className='text-sm font-medium mb-3'>Upload Response</h4>
                <FileUpload
                  accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                  multiple={false}
                  maxSize={10 * 1024 * 1024}
                  onFilesChange={handleFileUpload}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
