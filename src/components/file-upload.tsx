/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { File, UploadCloud, X } from "lucide-react";
import { Button } from "./ui/button";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onFilesChange: (files: File[]) => void;
}

export function FileUpload({
  accept = "*",
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFilesChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
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
            }
          });
        });
      }

      const validFiles = acceptedFiles.filter((file) => file.size <= maxSize);
      setFiles((prev) => [...prev, ...validFiles]);
      onFilesChange([...files, ...validFiles]);
    },
    [files, maxSize, accept, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    multiple,
    maxSize,
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <div className='space-y-2'>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
          isDragActive ? "border-primary bg-primary/10" : "border-muted"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className='mx-auto h-8 w-8 text-muted-foreground' />
        <p className='mt-2 text-sm text-muted-foreground'>
          {isDragActive
            ? "Drop the files here"
            : "Drag & drop files here, or click to select"}
        </p>
        <p className='text-xs text-muted-foreground'>
          {accept && `Supported formats: ${accept}`}
          {maxSize && ` • Max size: ${maxSize / 1024 / 1024}MB`}
        </p>
      </div>

      {files.length > 0 && (
        <div className='space-y-2'>
          <h4 className='text-sm font-medium'>Selected Files</h4>
          <div className='space-y-2'>
            {files.map((file, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-2 border rounded-lg'
              >
                <div className='flex items-center gap-2'>
                  <File className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm'>{file.name}</span>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
