/* eslint-disable @next/next/no-img-element */
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
import {
  FileText,
  Download,
  Trash2,
  Check,
  FileCheck,
  Eye,
  Loader2,
  FileWarning,
  X,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Document, DocumentStatus } from "@/generated/prisma";
import {
  calculateDocumentStatus,
  getFlowDisplay,
  getTypeDisplay,
} from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { useState } from "react";

interface DocumentDetailProps {
  document: Document & {
    client: {
      id: string;
      name: string;
      email: string;
      companyName: string;
    };
    files: {
      id: string;
      name: string;
      url: string;
      size: number;
    }[];
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
  };
  session: {
    user: {
      id: string;
    };
  };
}

const FilePreviewer = ({
  file,
}: {
  file: { id: string; url: string; name: string; documentId: string };
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fungsi untuk mendapatkan URL file yang sudah didekripsi
  const getSecureFileUrl = () => {
    return `/api/documents/${file.documentId}/files/${file.id}?preview=true`;
  };

  const getFileViewer = () => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const secureUrl = getSecureFileUrl();

    // PDF viewer langsung dengan iframe untuk file PDF
    if (extension === "pdf") {
      return (
        <iframe
          src={secureUrl}
          className='w-full h-full min-h-[500px] border-0'
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
      );
    }

    // Image viewer untuk file gambar
    if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) {
      return (
        <div className='flex items-center justify-center h-full'>
          <img
            src={secureUrl}
            alt={file.name}
            className='max-w-full max-h-full object-contain'
            onLoad={() => setIsLoading(false)}
            onError={() => setError(true)}
          />
        </div>
      );
    }

    // Untuk file lain, gunakan Google Docs Viewer sebagai fallback
    return (
      <iframe
        src={`https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(window.location.origin + secureUrl)}`}
        className='w-full h-full min-h-[500px] border-0'
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
      />
    );
  };

  return (
    <div className='relative h-full min-h-[500px]'>
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      )}
      {error ? (
        <div className='h-full flex flex-col items-center justify-center gap-2 text-center p-4'>
          <FileWarning className='h-12 w-12 text-yellow-500' />
          <h3 className='text-lg font-medium'>
            Tidak dapat menampilkan pratinjau
          </h3>
          <p className='text-sm text-muted-foreground'>
            Format file tidak didukung atau file tidak dapat diakses
          </p>
        </div>
      ) : (
        getFileViewer()
      )}
    </div>
  );
};

export function DocumentDetail({
  document: doc,
  session,
}: DocumentDetailProps) {
  const router = useRouter();
  const isCreator = doc.createdById === session.user.id;
  const isTeamLeader = doc.team?.members.some(
    (member) => member.user.id === session.user.id
  );

  const currentStatus = calculateDocumentStatus(doc);
  const [previewFile, setPreviewFile] = useState<{
    id: string;
    url: string;
    name: string;
    documentId: string;
  } | null>(null);

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

  const handleDownload = (fileId: string, name: string) => {
    try {
      // Buat URL untuk download file melalui API
      const downloadUrl = `/api/documents/${doc.id}/files/${fileId}`;

      // Gunakan fetch untuk download file
      fetch(downloadUrl)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to download file");
          return response.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();

          // Cleanup
          setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
        })
        .catch((err) => {
          console.error("Download error:", err);
          toast.error("Gagal mengunduh file");
        });
    } catch (error) {
      console.error("Error setting up download:", error);
      toast.error("Gagal mempersiapkan unduhan");
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
                    <Check className='mr-2 h-4 w-4' />
                    Mark Completed
                  </Button>
                )}
                {doc.status === "COMPLETED" && isTeamLeader && (
                  <Button
                    size='sm'
                    onClick={() => handleStatusChange("APPROVED")}
                  >
                    <FileCheck className='mr-2 h-4 w-4' />
                    Approve
                  </Button>
                )}
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={handleDelete}
                  disabled={!isCreator}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
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

            <div className='grid grid-cols-2 gap-4 mt-4'>
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

          <div className='divide-y px-4'>
            {doc.files.map((file) => (
              <CardContent
                key={file.id}
                className='py-3 px-4 flex justify-between items-center'
              >
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='bg-gray-100 dark:bg-gray-800 p-2 rounded-lg'>
                    <FileText className='h-5 w-5 text-muted-foreground' />
                  </div>
                  <div className='min-w-0'>
                    <p className='font-medium truncate'>{file.name}</p>
                    <p className='text-sm text-muted-foreground'>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className='flex gap-2 shrink-0'>
                  <Drawer direction='right'>
                    <DrawerTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 px-3'
                        onClick={() =>
                          setPreviewFile({
                            id: file.id,
                            url: file.url,
                            name: file.name,
                            documentId: doc.id,
                          })
                        }
                      >
                        <Eye className='h-4 w-4 sm:mr-2' />
                        <span className='hidden sm:block'>Preview</span>
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className='h-screen sm:max-w-sm md:max-w-md lg:max-w-xl'>
                      <DrawerHeader className='px-4 pt-4 pb-2 border-b'>
                        <div className='w-full flex items-center gap-4'>
                          <DrawerClose className='p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700'>
                            <ArrowLeft className='h-5 w-5' />
                          </DrawerClose>
                          <DrawerTitle className='text-lg font-semibold truncate'>
                            {previewFile?.name}
                          </DrawerTitle>
                        </div>
                      </DrawerHeader>
                      <div className='flex-1 overflow-hidden p-4'>
                        {previewFile && <FilePreviewer file={previewFile} />}
                      </div>
                    </DrawerContent>
                  </Drawer>

                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 px-3'
                    onClick={() => handleDownload(file.id, file.name)}
                  >
                    <Download className='h-4 w-4 sm:mr-2' />
                    <span className='hidden sm:block'>Download</span>
                  </Button>
                </div>
              </CardContent>
            ))}
          </div>
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
