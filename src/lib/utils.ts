"use client";

import { DocumentFlow, DocumentStatus, DocumentType } from "@/generated/prisma";
import { DocumentWithRelations } from "@/types/documents";
import { clsx, type ClassValue } from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { calculateServerDocumentStatus } from "./server-utils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getTypeDisplay = (type: DocumentType) => {
  const typeMap: Record<DocumentType, string> = {
    SPK: "Surat Perintah Kerja",
    JO: "Job Order",
    BA: "Berita Acara",
    IS: "Inspection Sheet",
    SA: "Service Acceptance",
    INVOICE: "Invoice",
  };
  return typeMap[type] || type;
};

export const getFlowDisplay = (flow: DocumentFlow) => {
  return flow === "IN" ? "Document Masuk" : "Document Keluar";
};

export const calculateRemainingTime = (endTrackAt: string | number | Date) => {
  const now = Date.now();
  const endTime = new Date(endTrackAt).getTime();
  return endTime - now;
};

export const formatRemainingTime = (remainingTime: number) => {
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

export const getTimeStatus = (document: {
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

export const useRealTimeRemainingTime = (document: DocumentWithRelations) => {
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

export function calculateDocumentStatus({
  status,
  startTrackAt,
  endTrackAt,
  completedAt,
  approvedAt,
}: {
  status: DocumentStatus;
  startTrackAt: Date;
  endTrackAt: Date;
  completedAt?: Date | null;
  approvedAt?: Date | null;
}): DocumentStatus {
  return calculateServerDocumentStatus({
    status,
    startTrackAt,
    endTrackAt,
    completedAt,
    approvedAt,
  });
}

export function getStatusColor(status: DocumentStatus) {
  switch (status) {
    case "DRAFT":
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-500/35 dark:text-zinc-400";
    case "ACTIVE":
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/35 dark:text-blue-400";
    case "WARNING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/35 dark:text-yellow-400";
    case "OVERDUE":
      return "bg-red-100 text-red-800 dark:bg-red-500/35 dark:text-red-400";
    case "COMPLETED":
      return "bg-green-100 text-green-800 dark:bg-green-500/35 dark:text-green-400";
    case "APPROVED":
      return "bg-purple-100 text-purple-800 dark:bg-purple-500/35 dark:text-purple-400";
    default:
      return "bg-zinc-100 text-zinc-800";
  }
}

export function calculateProgress(start: Date, end: Date): number {
  const now = new Date();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const currentTime = now.getTime();

  if (currentTime < startTime) return 0;
  if (currentTime > endTime) return 100;

  const totalDuration = endTime - startTime;
  const elapsed = currentTime - startTime;
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
}
