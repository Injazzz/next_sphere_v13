import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  Client,
  DocumentWithMetrics,
  TeamPerformance,
  AnalyticsData,
} from "@/types/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team role to determine access level
    const userTeamRole = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        role: "LEADER",
      },
      include: {
        team: true,
      },
    });

    const isLeader = !!userTeamRole;
    const analyticsData = await getAnalyticsData(
      session.user.id,
      isLeader,
      userTeamRole?.teamId
    );

    return NextResponse.json({
      analyticsData: {
        documents: analyticsData.documents,
        teamPerformance: analyticsData.teamPerformance,
        clients: analyticsData.clients,
        ranges: analyticsData.ranges,
        summary: analyticsData.summary,
      },
      isLeader,
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getAnalyticsData(
  userId: string,
  isLeader: boolean,
  teamId?: string
): Promise<AnalyticsData> {
  const now = new Date();
  const ranges = {
    "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    "90d": new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    "180d": new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
    "1y": new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    "3y": new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000),
  };

  // Build base where clause
  const baseWhere = isLeader
    ? teamId
      ? { teamId }
      : {}
    : { createdById: userId };

  // Get documents with complete relations
  const documents = await prisma.document.findMany({
    where: {
      ...baseWhere,
      //   createdAt: {
      //     gte: ranges["3y"],
      //   },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate performance metrics for each document
  const documentsWithMetrics: DocumentWithMetrics[] = documents.map((doc) => {
    const now = new Date();
    const isCompleted = !!doc.completedAt;
    const isOverdue = isCompleted
      ? doc.completedAt! > doc.endTrackAt
      : now > doc.endTrackAt;
    const daysLate =
      isOverdue && isCompleted
        ? Math.ceil(
            (doc.completedAt!.getTime() - doc.endTrackAt.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : isOverdue && !isCompleted
          ? Math.ceil(
              (now.getTime() - doc.endTrackAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;
    const processingTime = isCompleted
      ? Math.ceil(
          (doc.completedAt!.getTime() - doc.startTrackAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;
    const isOnTime = isCompleted && doc.completedAt! <= doc.endTrackAt;

    return {
      id: doc.id,
      title: doc.title,
      type: doc.type as DocumentWithMetrics["type"],
      flow: doc.flow as DocumentWithMetrics["flow"],
      status: doc.status as DocumentWithMetrics["status"],
      createdAt: doc.createdAt,
      completedAt: doc.completedAt,
      startTrackAt: doc.startTrackAt,
      endTrackAt: doc.endTrackAt,
      createdById: doc.createdById,
      teamId: doc.teamId,
      client: doc.client,
      createdBy: doc.createdBy,
      team: doc.team,
      isOverdue,
      daysLate,
      processingTime,
      isOnTime,
    };
  });

  // Team performance data (only for leaders)
  let teamPerformance: TeamPerformance[] | null = null;
  if (isLeader && teamId) {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const teamPerformancePromises = teamMembers.map(async (member) => {
      const memberDocs = await prisma.document.findMany({
        where: {
          createdById: member.userId,
          //   createdAt: {
          //     gte: ranges["3y"],
          //   },
        },
      });

      const memberDocsWithMetrics = memberDocs.map((doc) => {
        const now = new Date();
        const isCompleted = !!doc.completedAt;
        const isOverdue = isCompleted
          ? doc.completedAt! > doc.endTrackAt
          : now > doc.endTrackAt;
        const isOnTime = isCompleted && doc.completedAt! <= doc.endTrackAt;
        const processingTime = isCompleted
          ? Math.ceil(
              (doc.completedAt!.getTime() - doc.startTrackAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        return {
          ...doc,
          isOverdue,
          isOnTime,
          processingTime,
        };
      });

      const totalDocs = memberDocsWithMetrics.length;
      const completedDocs = memberDocsWithMetrics.filter(
        (d) => d.completedAt
      ).length;
      const onTimeDocs = memberDocsWithMetrics.filter((d) => d.isOnTime).length;
      const overdueDocs = memberDocsWithMetrics.filter(
        (d) => d.isOverdue
      ).length;

      const processingTimes = memberDocsWithMetrics
        .filter((d) => d.processingTime !== null)
        .map((d) => d.processingTime!);

      const averageProcessingTime =
        processingTimes.length > 0
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
          : 0;

      // Trend calculation
      const recentDocs = memberDocsWithMetrics.filter(
        (d) => d.createdAt >= ranges["30d"]
      );
      const olderDocs = memberDocsWithMetrics.filter(
        (d) => d.createdAt >= ranges["90d"] && d.createdAt < ranges["30d"]
      );

      const recentOnTimeRate =
        recentDocs.length > 0
          ? (recentDocs.filter((d) => d.isOnTime).length / recentDocs.length) *
            100
          : 0;
      const olderOnTimeRate =
        olderDocs.length > 0
          ? (olderDocs.filter((d) => d.isOnTime).length / olderDocs.length) *
            100
          : 0;

      let trend: "up" | "down" | "stable" = "stable";
      if (recentOnTimeRate > olderOnTimeRate + 5) trend = "up";
      else if (recentOnTimeRate < olderOnTimeRate - 5) trend = "down";

      return {
        user: member.user,
        role: member.role as "LEADER" | "MEMBER",
        totalDocuments: totalDocs,
        completedDocuments: completedDocs,
        onTimeDocuments: onTimeDocs,
        overdueDocuments: overdueDocs,
        completionRate: totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0,
        onTimeRate: completedDocs > 0 ? (onTimeDocs / completedDocs) * 100 : 0,
        averageProcessingTime,
        trend,
      };
    });

    teamPerformance = await Promise.all(teamPerformancePromises);
  }

  // Get clients data with document count
  const clientsData = await prisma.client.findMany({
    where: {
      ...(isLeader && teamId ? {} : { createdById: userId }),
      //   createdAt: {
      //     gte: ranges["3y"],
      //   },
    },
    include: {
      _count: {
        select: {
          Document: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const clients: Client[] = clientsData.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    createdAt: client.createdAt,
    documentCount: client._count.Document,
  }));

  // Calculate summary metrics
  const completedDocuments = documentsWithMetrics.filter((d) => d.completedAt);
  const processingTimes = completedDocuments
    .filter((d) => d.processingTime !== null)
    .map((d) => d.processingTime!);

  const averageProcessingTime =
    processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

  // Mock revenue calculation
  const totalRevenue = completedDocuments.length * 1000;
  const clientSatisfactionScore = 4.2;

  const summary = {
    totalRevenue,
    averageProcessingTime,
    clientSatisfactionScore,
  };

  return {
    documents: documentsWithMetrics,
    teamPerformance,
    clients,
    ranges,
    summary,
  };
}
