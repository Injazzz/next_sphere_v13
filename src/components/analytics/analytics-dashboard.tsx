/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Zap,
  Target,
} from "lucide-react";

import { AnalyticsData } from "@/types/analytics";
import { useAnalytics } from "@/hooks/use-analytics";
import { EmptyState } from "./empty-state";
import { ErrorBoundary } from "./error-boundary";
import { FilterPanel } from "./filter-panel";
import { ExportButton } from "./export-button";

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  isLeader: boolean;
  userId: string;
}

const chartConfig = {
  documentsIn: {
    label: "Documents IN",
    color: "var(--chart-1)",
  },
  documentsOut: {
    label: "Documents OUT",
    color: "var(--chart-5)",
  },
  onTime: {
    label: "On Time",
    color: "var(--chart-2)",
  },
  overdue: {
    label: "Overdue",
    color: "var(--chart-5)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function AnalyticsDashboard({
  data,
  isLeader,
  userId,
}: AnalyticsDashboardProps) {
  const isMobile = useIsMobile();

  const {
    timeRange,
    setTimeRange,
    selectedMetric,
    setSelectedMetric,
    filters,
    updateFilters,
    filteredDocuments,
    metrics,
    chartData,
    documentTypeData,
    performanceTrends,
    exportData,
  } = useAnalytics(data, isMobile ? "7d" : "30d");

  const TimeRangeSelector = () => (
    <>
      <ToggleGroup
        type='single'
        value={timeRange}
        onValueChange={setTimeRange}
        variant='outline'
        className='hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex'
      >
        <ToggleGroupItem value='7d'>7 days</ToggleGroupItem>
        <ToggleGroupItem value='30d'>30 days</ToggleGroupItem>
        <ToggleGroupItem value='90d'>3 months</ToggleGroupItem>
        <ToggleGroupItem value='180d'>6 months</ToggleGroupItem>
        <ToggleGroupItem value='1y'>1 year</ToggleGroupItem>
        <ToggleGroupItem value='3y'>3 years</ToggleGroupItem>
      </ToggleGroup>
      <Select value={timeRange} onValueChange={setTimeRange}>
        <SelectTrigger
          className='flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden'
          size='sm'
          aria-label='Select time range'
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className='rounded-xl'>
          <SelectItem value='7d'>7 days</SelectItem>
          <SelectItem value='30d'>30 days</SelectItem>
          <SelectItem value='90d'>3 months</SelectItem>
          <SelectItem value='180d'>6 months</SelectItem>
          <SelectItem value='1y'>1 year</SelectItem>
          <SelectItem value='3y'>3 years</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

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
        className={`${value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : "text-muted-foreground"}`}
      >
        {Math.abs(value).toFixed(1)}% {label}
      </span>
    </div>
  );

  if (
    filteredDocuments.length === 0 &&
    Object.values(filters).every((v) => v === "all")
  ) {
    return (
      <EmptyState
        title='No Data Available'
        description='There are no documents in the selected time period. Try selecting a different time range or create some documents to see analytics.'
        actionLabel='Create Document'
        onAction={() => (window.location.href = "/documents/create")}
      />
    );
  }

  // Lanjutan dari AnalyticsDashboard component
  return (
    <ErrorBoundary>
      <div className='space-y-6'>
        {/* Controls */}
        <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
            <TimeRangeSelector />
            <FilterPanel
              filters={filters}
              onFiltersChange={updateFilters}
              clients={data.clients}
            />
          </div>
          <ExportButton
            onExport={exportData}
            disabled={filteredDocuments.length === 0}
          />
        </div>

        {/* Key Metrics Grid */}
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
                value={performanceTrends.documentCountTrend}
                label='from last period'
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
              <TrendIndicator
                value={performanceTrends.completionTrend}
                label='completion rate'
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                On-Time Rate
              </CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {metrics.onTimeRate.toFixed(1)}%
              </div>
              <TrendIndicator
                value={performanceTrends.onTimeTrend}
                label='on-time performance'
              />
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
                {metrics.overdueDocuments} overdue documents
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className='grid gap-6 xl:grid-cols-2'>
          {/* Timeline Chart */}
          <Card className='@container/card'>
            <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 md:flex-row'>
              <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
                <CardTitle>Document Flow Timeline</CardTitle>
                <CardDescription>
                  Daily document creation and completion over {timeRange}
                </CardDescription>
              </div>
              <div className='flex px-6 items-center'>
                <Button
                  variant={selectedMetric === "documents" ? "default" : "ghost"}
                  size='sm'
                  className='rounded-md border-b-2 border-transparent px-3 py-1.5 data-[state=active]:border-primary'
                  onClick={() => setSelectedMetric("documents")}
                >
                  Documents
                </Button>
                <Button
                  variant={
                    selectedMetric === "performance" ? "default" : "ghost"
                  }
                  size='sm'
                  className='rounded-md border-b-2 border-transparent px-3 py-1.5 data-[state=active]:border-primary'
                  onClick={() => setSelectedMetric("performance")}
                >
                  Performance
                </Button>
              </div>
            </CardHeader>
            <CardContent className='px-2 sm:p-6'>
              <ChartContainer
                config={chartConfig}
                className='aspect-auto h-[250px] w-full'
              >
                {selectedMetric === "documents" ? (
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
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator='dot' />}
                    />
                    <Area
                      dataKey='documentsIn'
                      type='natural'
                      fill='var(--chart-1)'
                      fillOpacity={0.4}
                      stroke='var(--chart-1)'
                      stackId='a'
                    />
                    <Area
                      dataKey='documentsOut'
                      type='natural'
                      fill='var(--chart-2)'
                      fillOpacity={0.4}
                      stroke='var(--chart-2)'
                      stackId='a'
                    />
                  </AreaChart>
                ) : (
                  <LineChart
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
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Line
                      dataKey='onTime'
                      type='monotone'
                      stroke='var(--chart-2)'
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey='overdue'
                      type='monotone'
                      stroke='var(--chart-5)'
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Document Type Distribution */}
          <Card className='flex flex-col'>
            <CardHeader className='items-center pb-0'>
              <CardTitle>Document Type Distribution</CardTitle>
              <CardDescription>
                Breakdown of document types in selected period
              </CardDescription>
            </CardHeader>
            <CardContent className='flex-1 pb-0'>
              <ChartContainer
                config={chartConfig}
                className='mx-auto aspect-square max-h-[250px]'
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
            </CardContent>
          </Card>
        </div>

        {/* Team Performance Section (Leader Only) */}
        {isLeader && data.teamPerformance && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Team Performance
              </CardTitle>
              <CardDescription>
                Individual team member performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className='text-right'>Total Docs</TableHead>
                      <TableHead className='text-right'>Completed</TableHead>
                      <TableHead className='text-right'>On Time Rate</TableHead>
                      <TableHead className='text-right'>
                        Avg Processing
                      </TableHead>
                      <TableHead className='text-right'>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.teamPerformance.map((member) => (
                      <TableRow key={member.user.id}>
                        <TableCell className='font-medium'>
                          <div>
                            <div>{member.user.name}</div>
                            <div className='text-xs text-muted-foreground'>
                              {member.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.role === "LEADER" ? "default" : "secondary"
                            }
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          {member.totalDocuments}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex flex-col items-end'>
                            <span>{member.completedDocuments}</span>
                            <span className='text-xs text-muted-foreground'>
                              {member.completionRate.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <span>{member.onTimeRate.toFixed(1)}%</span>
                            {member.onTimeRate >= 80 ? (
                              <Badge variant='default' className='text-xs'>
                                Good
                              </Badge>
                            ) : member.onTimeRate >= 60 ? (
                              <Badge variant='secondary' className='text-xs'>
                                Average
                              </Badge>
                            ) : (
                              <Badge variant='destructive' className='text-xs'>
                                Needs Improvement
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          {member.averageProcessingTime.toFixed(1)} days
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            {member.trend === "up" ? (
                              <TrendingUp className='h-4 w-4 text-green-500' />
                            ) : member.trend === "down" ? (
                              <TrendingUp className='h-4 w-4 text-red-500 rotate-180' />
                            ) : (
                              <div className='h-4 w-4' />
                            )}
                            <span className='text-xs capitalize'>
                              {member.trend}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>
              Latest documents from your filtered selection
            </CardDescription>
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
                    <TableHead className='text-right'>
                      Processing Time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.slice(0, 10).map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className='font-medium max-w-[200px] truncate'>
                        {doc.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{doc.type}</Badge>
                      </TableCell>
                      <TableCell>{doc.client.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            doc.status === "COMPLETED"
                              ? "default"
                              : doc.status === "OVERDUE"
                                ? "destructive"
                                : doc.status === "WARNING"
                                  ? "destructive"
                                  : "secondary"
                          }
                        >
                          {doc.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex flex-col items-end'>
                          <span>
                            {doc.processingTime
                              ? `${doc.processingTime} days`
                              : "In progress"}
                          </span>
                          {doc.isOverdue && (
                            <span className='text-xs text-red-500 flex items-center gap-1'>
                              <AlertTriangle className='h-3 w-3' />
                              {doc.daysLate} days late
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredDocuments.length > 10 && (
              <div className='mt-4 text-center'>
                <Button variant='outline' size='sm'>
                  View All {metrics.totalDocuments} Documents
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Insights */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Efficiency Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-primary'>
                {metrics.efficiency.toFixed(0)}%
              </div>
              <p className='text-sm text-muted-foreground mt-2'>
                Based on on-time completion rate and document volume
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Document Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm'>Incoming:</span>
                  <span className='font-semibold'>{metrics.inDocuments}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm'>Outgoing:</span>
                  <span className='font-semibold'>{metrics.outDocuments}</span>
                </div>
                <div className='flex justify-between border-t pt-2'>
                  <span className='text-sm font-medium'>Net Flow:</span>
                  <span className='font-bold'>
                    {metrics.inDocuments - metrics.outDocuments > 0 ? "+" : ""}
                    {metrics.inDocuments - metrics.outDocuments}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm'>Revenue Impact:</span>
                  <span className='font-semibold'>
                    ${data.summary.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm'>Client Satisfaction:</span>
                  <span className='font-semibold'>
                    {data.summary.clientSatisfactionScore}/5.0
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm'>Active Clients:</span>
                  <span className='font-semibold'>{data.clients.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}
