// app/dashboard/analytics/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { formatDate } from "@/lib/server-utils";

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Fetch data dari route API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/analytics`,
    {
      headers: await headers(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch analytics data");
  }

  const { analyticsData, isLeader } = await response.json();

  // Verify the data structure
  if (!analyticsData.documents) {
    console.error("Invalid data structure:", analyticsData);
    throw new Error("Invalid analytics data structure received");
  }

  interface Document {
    createdAt: string;
    completedAt?: string;
    startTrackAt: string;
    endTrackAt: string;
  }

  const formattedData = {
    ...analyticsData,
    documents: analyticsData.documents.map((doc: Document) => ({
      ...doc,
      createdAt: formatDate(doc.createdAt),
      completedAt: doc.completedAt ? formatDate(doc.completedAt) : null,
      startTrackAt: formatDate(doc.startTrackAt),
      endTrackAt: formatDate(doc.endTrackAt),
    })),
  };
  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-semibold'>Analytics Dashboard</h1>
          <p className='text-muted-foreground mt-2'>
            {isLeader
              ? "Team Performance & Company Analytics"
              : "Performance Analytics"}
          </p>
        </div>
      </div>

      <AnalyticsDashboard
        data={formattedData}
        isLeader={isLeader}
        userId={session.user.id}
      />
    </div>
  );
}
