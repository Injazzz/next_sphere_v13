import { DocumentStatus } from "@/generated/prisma";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateServerDocumentStatus({
  status,
  startTrackAt,
  endTrackAt,
}: {
  status: DocumentStatus;
  startTrackAt: Date;
  endTrackAt: Date;
  completedAt?: Date | null;
  approvedAt?: Date | null;
}): DocumentStatus {
  const now = new Date();
  const startDate = new Date(startTrackAt);
  const endDate = new Date(endTrackAt);

  // If document is already completed or approved, return that status
  if (status === "COMPLETED" || status === "APPROVED") {
    return status;
  }

  // If document is draft, return draft
  if (now < startDate) {
    return "DRAFT";
  }

  // If tracking period has ended
  if (now > endDate) {
    return "OVERDUE";
  }

  // If within 7 days of end date
  const sevenDaysBeforeEnd = new Date(endDate);
  sevenDaysBeforeEnd.setDate(endDate.getDate() - 7);
  if (now > sevenDaysBeforeEnd) {
    return "WARNING";
  }

  // Default active status
  return "ACTIVE";
}

// Generate random 6-digit token
export function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const getValidDomain = () => {
  const validDomains = ["gmail.com", "yahoo.com", "outlook.com"];

  if (process.env.NODE_ENV === "development") {
    validDomains.push("example.com");
  }

  return validDomains;
};

export function normalizeUsername(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const formatDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
) => {
  const d = typeof date === "string" ? new Date(date) : date;

  // Gunakan format yang sama untuk server dan client
  if (options) {
    return new Intl.DateTimeFormat("en-US", options).format(d);
  }

  // Format default yang konsisten (YYYY-MM-DD)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
