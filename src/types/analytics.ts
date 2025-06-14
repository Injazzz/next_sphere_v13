export type DocumentWithMetrics = {
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
};

export type TeamPerformance = {
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
};

export type Client = {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
  documentCount: number;
};

export type AnalyticsData = {
  documents: DocumentWithMetrics[];
  teamPerformance: TeamPerformance[] | null;
  clients: Client[];
  ranges: {
    "7d": Date;
    "30d": Date;
    "90d": Date;
    "180d": Date;
    "1y": Date;
    "3y": Date;
  };
  summary: {
    totalRevenue: number;
    averageProcessingTime: number;
    clientSatisfactionScore: number;
  };
};
