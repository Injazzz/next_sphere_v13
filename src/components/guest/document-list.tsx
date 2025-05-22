"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
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
import { Eye, FileText } from "lucide-react";
import { getStatusColor, getTypeDisplay, getFlowDisplay } from "@/lib/utils";
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
    <Card className='overflow-hidden'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className='font-medium'>{document.title}</TableCell>
              <TableCell>{getTypeDisplay(document.type)}</TableCell>
              <TableCell>
                <Badge
                  variant='outline'
                  className={getStatusColor(document.computedStatus)}
                >
                  {document.computedStatus}
                </Badge>
              </TableCell>
              <TableCell>{getFlowDisplay(document.flow)}</TableCell>
              <TableCell>
                {format(new Date(document.startTrackAt), "dd MMM yyyy")}
              </TableCell>
              <TableCell>
                {format(new Date(document.endTrackAt), "dd MMM yyyy")}
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Link href={`/guest/documents/${document.id}`}>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
