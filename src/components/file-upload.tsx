/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { File, UploadCloud, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  uploadMode?: "select" | "immediate"; // 'select' just selects files, 'immediate' uploads immediately
  documentId?: string; // Required for immediate upload
  fileType?: "document" | "response"; // Required for immediate upload
  onUploadComplete?: (uploadedFiles: any[]) => void;
}

export function FileUpload({
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  multiple = true,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFilesChange,
  disabled = false,
  uploadMode = "select",
  documentId,
  fileType,
  onUploadComplete,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (filesToUpload: File[]) => {
    if (!documentId || !fileType) {
      toast.error("Document ID and file type are required for upload");
      return;
    }

    if (filesToUpload.length === 0) {
      toast.error("No files to upload");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("documentId", documentId);
      formData.append("fileType", fileType);

      filesToUpload.forEach((file) => {
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

      toast.success(`${result.count} file(s) uploaded successfully`);

      // Clear selected files after successful upload
      setFiles([]);
      onFilesChange([]);

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(result.files);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload files"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: any[]) => {
      if (disabled || isUploading) return;

      // Handle file rejections
      if (fileRejections.length > 0) {
        fileRejections.forEach((rejection) => {
          rejection.errors.forEach((error: any) => {
            if (error.code === "file-too-large") {
              toast.error(
                `File ${rejection.file.name} is too large. Max size is ${
                  maxSize / 1024 / 1024
                }MB.`
              );
            } else if (error.code === "file-invalid-type") {
              toast.error(
                `File ${rejection.file.name} has an invalid type. Only ${accept} are allowed.`
              );
            } else {
              toast.error(
                `Error with file ${rejection.file.name}: ${error.message}`
              );
            }
          });
        });
      }

      // Filter valid files
      const validFiles = acceptedFiles.filter((file) => file.size <= maxSize);

      if (uploadMode === "immediate") {
        // Upload immediately
        await uploadFiles(validFiles);
      } else {
        // Just add to selection
        const newFiles = multiple ? [...files, ...validFiles] : validFiles;
        setFiles(newFiles);
        onFilesChange(newFiles);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      files,
      maxSize,
      accept,
      onFilesChange,
      disabled,
      isUploading,
      uploadMode,
      multiple,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    multiple: uploadMode === "immediate" ? true : multiple,
    maxSize,
    disabled: disabled || isUploading,
  });

  const removeFile = (index: number) => {
    if (disabled || isUploading) return;

    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleManualUpload = async () => {
    await uploadFiles(files);
  };

  const getAcceptedFileTypes = () => {
    if (accept === ".pdf,.doc,.docx,.jpg,.jpeg,.png") {
      return "PDF, DOC, DOCX, JPG, PNG";
    }
    return accept;
  };

  return (
    <div className='space-y-4'>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/10"
            : disabled || isUploading
              ? "border-muted bg-muted/50 cursor-not-allowed"
              : "border-muted hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className='flex flex-col items-center gap-2'>
            <Loader2 className='h-8 w-8 text-primary animate-spin' />
            <p className='text-sm text-muted-foreground'>Uploading files...</p>
          </div>
        ) : (
          <>
            <UploadCloud
              className={`mx-auto h-8 w-8 ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}
            />
            <p
              className={`mt-2 text-sm ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}
            >
              {isDragActive
                ? "Drop the files here"
                : uploadMode === "immediate"
                  ? "Drop files here to upload immediately, or click to select"
                  : "Drag & drop files here, or click to select"}
            </p>
            <p
              className={`text-xs ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}
            >
              Supported formats: {getAcceptedFileTypes()}
              {maxSize && ` • Max size: ${maxSize / 1024 / 1024}MB per file`}
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h4 className='text-sm font-medium'>
              Selected Files ({files.length})
            </h4>
            {uploadMode === "select" && files.length > 0 && (
              <Button
                onClick={handleManualUpload}
                disabled={isUploading || disabled}
                size='sm'
                className='ml-2'
              >
                {isUploading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Uploading...
                  </>
                ) : (
                  `Upload ${files.length} file(s)`
                )}
              </Button>
            )}
          </div>

          <div className='space-y-2 max-h-60 overflow-y-auto'>
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className='flex items-center justify-between p-3 border rounded-lg bg-background'
              >
                <div className='flex items-center gap-3 min-w-0 flex-1'>
                  <File className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium truncate'>{file.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 flex-shrink-0'
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled || isUploading}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadMode === "immediate" && (
        <p className='text-xs text-muted-foreground text-center'>
          Files will be uploaded immediately when selected
        </p>
      )}
    </div>
  );
}
