// components/file-list.tsx
"use client";

import { Download, Eye, FileText, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { handleDeleteFile, handleDownloadFile } from "@/lib/files/file-actions";

interface FileItem {
  id: string;
  name: string;
  size: number;
  url?: string;
}

interface FilesListProps {
  files: FileItem[];
  fileType: "document" | "response";
  actions?: {
    download?: boolean;
    preview?: boolean;
    delete?: boolean;
  };
  onDeleteSuccess?: (fileId: string) => void;
  className?: string;
  disabled?: boolean;
}

export function FilesList({
  files,
  fileType,
  actions = {
    download: true,
    preview: true,
    delete: false,
  },
  onDeleteSuccess,
  className = "",
  disabled = false,
}: FilesListProps) {
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: "download" | "preview" | "delete" | null;
  }>({});

  const handleAction = async (
    actionType: "download" | "preview" | "delete",
    fileId: string,
    fileName?: string
  ) => {
    if (disabled) return;

    try {
      setLoadingStates((prev) => ({ ...prev, [fileId]: actionType }));

      if (actionType === "delete") {
        await handleDeleteFile(fileType, fileId);
        toast.success("File deleted successfully");
        onDeleteSuccess?.(fileId);
      } else if (fileName) {
        await handleDownloadFile(
          fileType,
          fileId,
          fileName,
          actionType === "preview"
        );
        if (actionType === "download") {
          toast.success("Download started");
        }
      }
    } catch (error) {
      console.error(`Error during ${actionType}:`, error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [fileId]: null }));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map((file) => (
        <div
          key={file.id}
          className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
        >
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            <FileText className='h-4 w-4 text-muted-foreground flex-shrink-0' />
            <div className='min-w-0'>
              <p className='text-sm font-medium truncate'>{file.name}</p>
              <p className='text-xs text-muted-foreground'>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className='flex gap-1'>
            {actions.preview && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0'
                onClick={() => handleAction("preview", file.id, file.name)}
                disabled={disabled || !!loadingStates[file.id]}
                title='Preview'
              >
                {loadingStates[file.id] === "preview" ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
                <span className='sr-only'>Preview</span>
              </Button>
            )}

            {actions.download && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0'
                onClick={() => handleAction("download", file.id, file.name)}
                disabled={disabled || !!loadingStates[file.id]}
                title='Download'
              >
                {loadingStates[file.id] === "download" ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Download className='h-4 w-4' />
                )}
                <span className='sr-only'>Download</span>
              </Button>
            )}

            {actions.delete && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                onClick={() => handleAction("delete", file.id)}
                disabled={disabled || !!loadingStates[file.id]}
                title='Delete'
              >
                {loadingStates[file.id] === "delete" ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Trash2 className='h-4 w-4' />
                )}
                <span className='sr-only'>Delete</span>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
