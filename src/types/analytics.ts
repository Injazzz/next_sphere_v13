export interface DocumentWithMetrics {
  id: string;
  title: string;
  type: "SPK" | "JO" | "BA" | "IS" | "SA" | "INVOICE";
  flow: "IN" | "OUT";
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "WARNING";
  createdAt: Date;
  completedAt: Date | null;
  startTrackAt: Date;
  endTrackAt: Date;
  createdById: string;
  teamId: string | null;
  client: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  team: {
    id: string;
    name: string;
  } | null;
  isOverdue: boolean;
  daysLate: number;
  processingTime: number | null;
  isOnTime: boolean;
}

export interface TeamPerformance {
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: "LEADER" | "MEMBER";
  totalDocuments: number;
  completedDocuments: number;
  onTimeDocuments: number;
  overdueDocuments: number;
  completionRate: number;
  onTimeRate: number;
  averageProcessingTime: number;
  trend: "up" | "down" | "stable";
}

export interface Client {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  documentCount: number;
}

export interface AnalyticsData {
  documents: DocumentWithMetrics[];
  teamPerformance: TeamPerformance[] | null;
  clients: Client[];
  ranges: Record<string, Date>;
  summary: {
    totalRevenue: number;
    averageProcessingTime: number;
    clientSatisfactionScore: number;
  };
}
