/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document } from "@/generated/prisma";

export interface DocumentWithRelations extends Document {
  client?: {
    id: string;
    companyName?: string | null;
  } | null;
  files?: any[];
  team?: any;
  remainingTime?: number;
  isCritical?: boolean;
  isPinned: boolean;
}

export interface TimeStatus {
  status: string;
  color: string;
  isOverdue: boolean;
  remainingTime: number;
}
