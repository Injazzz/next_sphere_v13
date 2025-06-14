"use client";
import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
import {
  FileText,
  Users,
  Clock,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
  AlertTriangle,
  UserCheck,
  Building,
  BarChart3,
  Eye,
} from "lucide-react";

interface DashboardData {
  metrics: {
    totalDocuments: number;
    documentsTrend: number;
    completedDocuments: number;
    completionRate: number;
    onTimeRate: number;
    overdueDocuments: number;
    averageProcessingTime: number;
    clientsCount: number;
    teamMembersCount: number;
  };
  chartData: Array<{
    date: string;
    created: number;
    completed: number;
  }>;
  documentTypeData: Array<{
    type: string;
    count: number;
    fill: string;
  }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    client: { id: string; name: string };
    createdBy: { id: string; name: string };
    createdAt: Date;
    isOverdue: boolean;
  }>;
}

interface DashboardOverviewProps {
  data: DashboardData;
  isLeader: boolean;
  userId: string;
}

const chartConfig = {
  created: {
    label: "Created",
    color: "hsl(var(--chart-1))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

// Utility function untuk format tanggal yang konsisten
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC", // Gunakan UTC untuk konsistensi
  }).format(date);
};

// Alternative: format tanggal yang lebih sederhana
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatDateSimple = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
};

export function DashboardOverview({
  data,
  isLeader,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId,
}: DashboardOverviewProps) {
  const { metrics, chartData, documentTypeData, recentDocuments } = data;

  // State untuk mendeteksi apakah sudah di client
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const TrendIndicator = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => (
    <div className='flex items-center gap-1 text-xs'>
      {value > 0 ? (
        <ArrowUp className='h-3 w-3 text-green-500' />
      ) : value < 0 ? (
        <ArrowDown className='h-3 w-3 text-red-500' />
      ) : null}
      <span
        className={`${
          value > 0
            ? "text-green-500"
            : value < 0
              ? "text-red-500"
              : "text-muted-foreground"
        }`}
      >
        {Math.abs(value).toFixed(1)}% {label}
      </span>
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* Quick Stats */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Documents
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.totalDocuments.toLocaleString()}
            </div>
            <TrendIndicator
              value={metrics.documentsTrend}
              label='from last month'
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Completion Rate
            </CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.completionRate.toFixed(1)}%
            </div>
            <p className='text-xs text-muted-foreground'>
              {metrics.completedDocuments} completed documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>On-Time Rate</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.onTimeRate.toFixed(1)}%
            </div>
            <p className='text-xs text-muted-foreground'>
              {metrics.overdueDocuments} overdue documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg Processing Time
            </CardTitle>
            <Zap className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.averageProcessingTime.toFixed(1)}
              <span className='text-sm font-normal text-muted-foreground ml-1'>
                days
              </span>
            </div>
            <p className='text-xs text-muted-foreground'>
              Average completion time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Link href='/dashboard/documents'>
          <Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Documents</CardTitle>
              <div className='flex items-center gap-2'>
                <FileText className='h-4 w-4 text-muted-foreground' />
                <Eye className='h-4 w-4 text-muted-foreground' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{metrics.totalDocuments}</div>
              <p className='text-xs text-muted-foreground'>
                Manage all documents
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/dashboard/clients'>
          <Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Clients</CardTitle>
              <div className='flex items-center gap-2'>
                <Building className='h-4 w-4 text-muted-foreground' />
                <Eye className='h-4 w-4 text-muted-foreground' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{metrics.clientsCount}</div>
              <p className='text-xs text-muted-foreground'>Active clients</p>
            </CardContent>
          </Card>
        </Link>

        {isLeader && (
          <Link href='/dashboard/teams'>
            <Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Team</CardTitle>
                <div className='flex items-center gap-2'>
                  <Users className='h-4 w-4 text-muted-foreground' />
                  <Eye className='h-4 w-4 text-muted-foreground' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metrics.teamMembersCount}
                </div>
                <p className='text-xs text-muted-foreground'>Team members</p>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href='/dashboard/analytics'>
          <Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Analytics</CardTitle>
              <div className='flex items-center gap-2'>
                <BarChart3 className='h-4 w-4 text-muted-foreground' />
                <Eye className='h-4 w-4 text-muted-foreground' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {metrics.onTimeRate.toFixed(0)}%
              </div>
              <p className='text-xs text-muted-foreground'>Performance score</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Section */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>
              Document creation and completion over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className='aspect-auto h-[200px] w-full'
            >
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey='date'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator='dot' />}
                />
                <Area
                  dataKey='created'
                  type='natural'
                  fill='var(--chart-1)'
                  fillOpacity={0.4}
                  stroke='var(--chart-1)'
                  stackId='a'
                />
                <Area
                  dataKey='completed'
                  type='natural'
                  fill='var(--chart-2)'
                  fillOpacity={0.4}
                  stroke='var(--chart-2)'
                  stackId='a'
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Document Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Document Types</CardTitle>
            <CardDescription>
              Distribution of document types this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className='mx-auto aspect-square max-h-[200px]'
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={documentTypeData}
                  dataKey='count'
                  nameKey='type'
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {documentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className='mt-4 grid grid-cols-2 gap-2 text-sm'>
              {documentTypeData.slice(0, 4).map((item, index) => (
                <div key={index} className='flex items-center gap-2'>
                  <div
                    className='w-3 h-3 rounded-full'
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className='text-xs'>
                    {item.type} ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>
              Latest document activity from the past week
            </CardDescription>
          </div>
          <Link href='/dashboard/documents'>
            <Button variant='outline' size='sm'>
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDocuments.length > 0 ? (
                  recentDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className='font-medium max-w-[200px] truncate'>
                        {doc.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{doc.type}</Badge>
                      </TableCell>
                      <TableCell>{doc.client.name}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant={
                              doc.status === "COMPLETED"
                                ? "default"
                                : doc.status === "OVERDUE"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {doc.status.replace("_", " ")}
                          </Badge>
                          {doc.isOverdue && (
                            <AlertTriangle className='h-4 w-4 text-red-500' />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* FIX: Gunakan format tanggal yang konsisten */}
                        {isClient
                          ? formatDate(new Date(doc.createdAt))
                          : // Fallback untuk server rendering
                            new Date(doc.createdAt).toISOString().split("T")[0]}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center py-8'>
                      <div className='flex flex-col items-center gap-2'>
                        <FileText className='h-8 w-8 text-muted-foreground' />
                        <p className='text-muted-foreground'>
                          No recent documents found
                        </p>
                        <Link href='/documents/create'>
                          <Button size='sm'>Create Document</Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm'>Completion Rate:</span>
                <span className='font-semibold'>
                  {metrics.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm'>On-Time Rate:</span>
                <span className='font-semibold'>
                  {metrics.onTimeRate.toFixed(1)}%
                </span>
              </div>
              <div className='flex justify-between border-t pt-2'>
                <span className='text-sm font-medium'>Overall Score:</span>
                <span className='font-bold text-primary'>
                  {((metrics.completionRate + metrics.onTimeRate) / 2).toFixed(
                    0
                  )}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <Clock className='h-4 w-4' />
              Time Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm'>Avg Processing:</span>
                <span className='font-semibold'>
                  {metrics.averageProcessingTime.toFixed(1)} days
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm'>Overdue Count:</span>
                <span className='font-semibold text-red-600'>
                  {metrics.overdueDocuments}
                </span>
              </div>
              <div className='flex justify-between border-t pt-2'>
                <span className='text-sm font-medium'>Efficiency:</span>
                <Badge
                  variant={
                    metrics.averageProcessingTime <= 3
                      ? "default"
                      : metrics.averageProcessingTime <= 7
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {metrics.averageProcessingTime <= 3
                    ? "Excellent"
                    : metrics.averageProcessingTime <= 7
                      ? "Good"
                      : "Needs Improvement"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <UserCheck className='h-4 w-4' />
              Workload Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm'>Total Documents:</span>
                <span className='font-semibold'>{metrics.totalDocuments}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm'>Active Clients:</span>
                <span className='font-semibold'>{metrics.clientsCount}</span>
              </div>
              {isLeader && (
                <div className='flex justify-between border-t pt-2'>
                  <span className='text-sm font-medium'>Team Size:</span>
                  <span className='font-bold'>{metrics.teamMembersCount}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
