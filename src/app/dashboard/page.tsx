import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
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

  // Get dashboard summary data
  const dashboardData = await getDashboardSummary(
    session.user.id,
    isLeader,
    userTeamRole?.teamId
  );

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-semibold'>Dashboard</h1>
          <p className='text-muted-foreground mt-2'>
            Welcome back, {session.user.name}
          </p>
        </div>
      </div>

      <DashboardOverview
        data={dashboardData}
        isLeader={isLeader}
        userId={session.user.id}
      />
    </div>
  );
}

async function getDashboardSummary(
  userId: string,
  isLeader: boolean,
  teamId?: string
) {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Build base where clause
  const baseWhere = isLeader && teamId ? { teamId } : { createdById: userId };

  // Get documents for current period
  const [currentDocuments, previousDocuments] = await Promise.all([
    prisma.document.findMany({
      where: {
        ...baseWhere,
        createdAt: { gte: last30Days },
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.document.findMany({
      where: {
        ...baseWhere,
        createdAt: { gte: last60Days, lt: last30Days },
      },
    }),
  ]);

  // Get recent documents for activity feed
  const recentDocuments = await prisma.document.findMany({
    where: {
      ...baseWhere,
      createdAt: { gte: last7Days },
    },
    include: {
      client: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get clients count
  const clientsCount = await prisma.client.count({
    where: isLeader && teamId ? {} : { createdById: userId },
  });

  // Get team members count (for leaders)
  const teamMembersCount =
    isLeader && teamId
      ? await prisma.teamMember.count({ where: { teamId } })
      : 0;

  // Calculate metrics
  const totalDocuments = currentDocuments.length;
  const previousTotalDocuments = previousDocuments.length;
  const documentsTrend =
    previousTotalDocuments > 0
      ? ((totalDocuments - previousTotalDocuments) / previousTotalDocuments) *
        100
      : 0;

  const completedDocuments = currentDocuments.filter(
    (doc) => doc.completedAt
  ).length;
  const completionRate =
    totalDocuments > 0 ? (completedDocuments / totalDocuments) * 100 : 0;

  const onTimeDocuments = currentDocuments.filter(
    (doc) => doc.completedAt && doc.completedAt <= doc.endTrackAt
  ).length;
  const onTimeRate =
    completedDocuments > 0 ? (onTimeDocuments / completedDocuments) * 100 : 0;

  const overdueDocuments = currentDocuments.filter((doc) => {
    if (doc.completedAt) {
      return doc.completedAt > doc.endTrackAt;
    }
    return now > doc.endTrackAt;
  }).length;

  // Calculate average processing time
  const completedWithProcessingTime = currentDocuments
    .filter((doc) => doc.completedAt)
    .map((doc) => ({
      ...doc,
      processingTime: Math.ceil(
        (doc.completedAt!.getTime() - doc.startTrackAt.getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));

  const averageProcessingTime =
    completedWithProcessingTime.length > 0
      ? completedWithProcessingTime.reduce(
          (sum, doc) => sum + doc.processingTime,
          0
        ) / completedWithProcessingTime.length
      : 0;

  // Chart data for last 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];

    const dayDocuments = currentDocuments.filter(
      (doc) => doc.createdAt.toISOString().split("T")[0] === dateStr
    );

    const dayCompleted = dayDocuments.filter(
      (doc) =>
        doc.completedAt &&
        doc.completedAt.toISOString().split("T")[0] === dateStr
    );

    chartData.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      created: dayDocuments.length,
      completed: dayCompleted.length,
    });
  }

  // Document type distribution
  const documentTypes = currentDocuments.reduce(
    (acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const documentTypeData = Object.entries(documentTypes).map(
    ([type, count], index) => ({
      type,
      count,
      fill: `var(--chart-${(index % 5) + 1})`,
    })
  );

  return {
    metrics: {
      totalDocuments,
      documentsTrend,
      completedDocuments,
      completionRate,
      onTimeRate,
      overdueDocuments,
      averageProcessingTime,
      clientsCount,
      teamMembersCount,
    },
    chartData,
    documentTypeData,
    recentDocuments: recentDocuments.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      status: doc.status,
      client: doc.client,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      isOverdue: doc.completedAt
        ? doc.completedAt > doc.endTrackAt
        : now > doc.endTrackAt,
    })),
  };
}
