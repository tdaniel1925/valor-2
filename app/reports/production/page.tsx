'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/layout/AppLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Target,
  Users,
  FileText,
  Download,
  Calendar,
  Loader2,
  Trophy,
  Medal,
  FileSpreadsheet,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  exportProductionReportToExcel,
  prepareProductionDataForExport,
  exportToCSV,
} from '@/lib/export-utils';

interface ProductionData {
  success: boolean;
  period: string;
  teamView: boolean;
  dateRange: { start: string; end: string };
  summary: {
    totalCases: number;
    totalPremium: number;
    totalCommission: number;
    submittedCases: number;
    issuedCases: number;
    conversionRate: number;
    issueRate: number;
    averagePremium: number;
    averageCommission: number;
  };
  byStatus: Record<string, { count: number; premium: number }>;
  byProductType: Record<string, { count: number; premium: number; commission: number }>;
  byCarrier: Record<string, { count: number; premium: number; commission: number }>;
  monthlyTrend: Array<{
    month: string;
    cases: number;
    premium: number;
    commission: number;
    submitted: number;
    issued: number;
  }>;
  agentRankings: Array<{
    agent: { id: string; firstName: string; lastName: string; email: string };
    cases: number;
    premium: number;
    commission: number;
    submitted: number;
    issued: number;
  }>;
  topProducts: Array<{ type: string; count: number; premium: number; commission: number }>;
  topCarriers: Array<{ carrier: string; count: number; premium: number; commission: number }>;
  recentCases: any[];
}

export default function ProductionReportPage() {
  const [period, setPeriod] = useState<string>('month');
  const [teamView, setTeamView] = useState(true);
  const [data, setData] = useState<ProductionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductionData();
  }, [period, teamView]);

  const fetchProductionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/reports/production?period=${period}&teamView=${teamView}`
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch production data');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400 dark:text-gray-500" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600 dark:text-amber-500" />;
    return <span className="text-muted-foreground">#{index + 1}</span>;
  };

  const handleExportExcel = () => {
    if (!data) return;
    const filename = `production-report-${period}-${new Date().toISOString().split('T')[0]}`;
    exportProductionReportToExcel(data, filename);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const csvData = prepareProductionDataForExport(data);
    const filename = `production-report-${period}-${new Date().toISOString().split('T')[0]}`;
    exportToCSV(csvData, filename);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading production data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-destructive mb-4">{error || 'No data available'}</p>
                <Button onClick={fetchProductionData}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Production Reports</h1>
            <p className="text-muted-foreground mt-1">
              Track sales performance and productivity metrics
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
              <Label htmlFor="team-view" className="text-sm">
                Team View
              </Label>
              <Switch id="team-view" checked={teamView} onCheckedChange={setTeamView} />
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export to CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Cases</CardDescription>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.summary.totalCases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.summary.submittedCases} submitted ({data.summary.conversionRate.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Premium</CardDescription>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.summary.totalPremium)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {formatCurrency(data.summary.averagePremium)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Issue Rate</CardDescription>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {data.summary.issueRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.summary.issuedCases} policies issued
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Commission</CardDescription>
                <Award className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(data.summary.totalCommission)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {formatCurrency(data.summary.averageCommission)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            {teamView && <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>}
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Top Products</CardTitle>
                  <CardDescription>Highest premium by product type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.topProducts.map((product, index) => (
                      <div key={product.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{product.type}</div>
                            <div className="text-sm text-muted-foreground">{product.count} cases</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(product.premium)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(product.commission)} commission
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Top Carriers</CardTitle>
                  <CardDescription>Highest premium by carrier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.topCarriers.map((carrier, index) => (
                      <div key={carrier.carrier} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{carrier.carrier}</div>
                            <div className="text-sm text-muted-foreground">{carrier.count} cases</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(carrier.premium)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(carrier.commission)} commission
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Case Status Distribution</CardTitle>
                <CardDescription>Breakdown by case status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(data.byStatus).map(([status, stats]) => (
                    <div key={status} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <div className="font-semibold text-sm text-muted-foreground mb-2">
                        {status}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.count}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(stats.premium)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">6-Month Production Trend</CardTitle>
                <CardDescription>Premium and case volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <YAxis yAxisId="right" orientation="right" className="text-gray-600 dark:text-gray-400" />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === 'cases' || name === 'submitted' || name === 'issued'
                          ? value
                          : formatCurrency(value)
                      }
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="premium"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Premium"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="commission"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Commission"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cases"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Cases"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Conversion Metrics</CardTitle>
                <CardDescription>Submitted and issued cases by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                    <YAxis className="text-gray-600 dark:text-gray-400" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="submitted" fill="#3b82f6" name="Submitted" />
                    <Bar dataKey="issued" fill="#10b981" name="Issued" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          {teamView && (
            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Trophy className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                    Agent Leaderboard
                  </CardTitle>
                  <CardDescription>Top performers ranked by premium volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead className="text-right">Cases</TableHead>
                        <TableHead className="text-right">Premium</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Submitted</TableHead>
                        <TableHead className="text-right">Issued</TableHead>
                        <TableHead className="text-right">Close Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.agentRankings.map((agent, index) => (
                        <TableRow key={agent.agent.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center justify-center">
                              {getRankBadge(index)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {agent.agent.firstName} {agent.agent.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">{agent.agent.email}</div>
                          </TableCell>
                          <TableCell className="text-right text-gray-900 dark:text-white">{agent.cases}</TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(agent.premium)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 dark:text-green-400">
                            {formatCurrency(agent.commission)}
                          </TableCell>
                          <TableCell className="text-right text-gray-900 dark:text-white">{agent.submitted}</TableCell>
                          <TableCell className="text-right text-gray-900 dark:text-white">{agent.issued}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">
                              {agent.cases > 0
                                ? ((agent.submitted / agent.cases) * 100).toFixed(1)
                                : 0}
                              %
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Product Performance Analysis</CardTitle>
                <CardDescription>Detailed breakdown by product type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={Object.entries(data.byProductType).map(([type, stats]) => ({
                      type,
                      ...stats,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="type" className="text-gray-600 dark:text-gray-400" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} className="text-gray-600 dark:text-gray-400" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="premium" fill="#3b82f6" name="Premium" />
                    <Bar dataKey="commission" fill="#10b981" name="Commission" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
