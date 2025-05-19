import { DocumentFlow, DocumentStatus, DocumentType } from "@/generated/prisma";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getValidDomain = () => {
  const validDomains = ["gmail.com", "yahoo.com", "outlook.com"];

  if (process.env.NODE_ENV === "development") {
    validDomains.push("example.com");
  }

  return validDomains;
};

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

export function normalizeUsername(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function calculateDocumentStatus(document: {
  status: DocumentStatus;
  startTrackAt: Date;
  endTrackAt: Date;
  completedAt?: Date | null;
  approvedAt?: Date | null;
}): DocumentStatus {
  // Jika status manual COMPLETED atau APPROVED, pertahankan
  if (document.status === "COMPLETED" || document.status === "APPROVED") {
    return document.status;
  }

  // Jika ada completedAt atau approvedAt, kembalikan status yang sesuai
  if (document.approvedAt) return "APPROVED";
  if (document.completedAt) return "COMPLETED";

  const today = new Date();
  const startDate = new Date(document.startTrackAt);
  const endDate = new Date(document.endTrackAt);

  // Hitung hari tersisa
  const timeDiff = endDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  // Tentukan status
  if (today < startDate) {
    return "DRAFT";
  } else if (daysRemaining <= 0) {
    return "OVERDUE";
  } else if (daysRemaining <= 10) {
    return "WARNING";
  } else {
    return "ACTIVE";
  }
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
