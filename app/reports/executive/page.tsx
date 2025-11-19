'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Award,
  Building2,
  Download,
  Loader2,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText,
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
  exportExecutiveReportToExcel,
  prepareExecutiveSummaryForExport,
  exportToCSV,
} from '@/lib/export-utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface ExecutiveData {
  success: boolean;
  timestamp: string;
  ytd: {
    totalCases: number;
    totalPremium: number;
    totalCommission: number;
    submittedCases: number;
    issuedCases: number;
    averagePremium: number;
    conversionRate: number;
    issueRate: number;
  };
  lastYear: {
    totalCases: number;
    totalPremium: number;
    totalCommission: number;
  };
  thisMonth: {
    totalCases: number;
    totalPremium: number;
    totalCommission: number;
  };
  lastMonth: {
    totalCases: number;
    totalPremium: number;
  };
  growth: {
    vsLastYear: {
      cases: number;
      premium: number;
      commission: number;
    };
    vsLastMonth: {
      cases: number;
      premium: number;
    };
  };
  monthlyTrend: Array<{
    month: string;
    cases: number;
    premium: number;
    commission: number;
    submitted: number;
    issued: number;
  }>;
  productMix: Record<string, { count: number; premium: number; percentage: number }>;
  agents: {
    total: number;
    active: number;
    activePercentage: number;
  };
  pipeline: Record<string, { count: number; premium: number }>;
  topAgents: Array<{
    agent: { id: string; firstName: string; lastName: string };
    cases: number;
    premium: number;
    commission: number;
  }>;
  carrierDistribution: Record<string, { count: number; premium: number }>;
}

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExecutiveData();
  }, []);

  const fetchExecutiveData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/executive');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch executive data');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load executive data');
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

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        <span className="font-semibold">{formatPercentage(value)}</span>
      </div>
    );
  };

  const handleExportExcel = () => {
    if (!data) return;
    const filename = `executive-dashboard-${new Date().toISOString().split('T')[0]}`;
    exportExecutiveReportToExcel(data, filename);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const csvData = prepareExecutiveSummaryForExport(data);
    const filename = `executive-summary-${new Date().toISOString().split('T')[0]}`;
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
                <p className="text-muted-foreground">Loading executive dashboard...</p>
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
                <Button onClick={fetchExecutiveData}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Prepare chart data
  const productMixData = Object.entries(data.productMix).map(([type, stats]) => ({
    name: type,
    value: stats.premium,
    count: stats.count,
    percentage: stats.percentage,
  }));

  const carrierData = Object.entries(data.carrierDistribution)
    .map(([carrier, stats]) => ({
      name: carrier,
      premium: stats.premium,
      count: stats.count,
    }))
    .sort((a, b) => b.premium - a.premium)
    .slice(0, 8);

  const pipelineData = Object.entries(data.pipeline).map(([status, stats]) => ({
    status,
    cases: stats.count,
    premium: stats.premium,
  }));

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Executive Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              High-level business intelligence and performance metrics
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
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

        {/* Key Metrics - YTD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>YTD Premium</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.ytd.totalPremium)}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">vs Last Year</span>
                <GrowthIndicator value={data.growth.vsLastYear.premium} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>YTD Commission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.ytd.totalCommission)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">vs Last Year</span>
                <GrowthIndicator value={data.growth.vsLastYear.commission} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.ytd.totalCases}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">vs Last Year</span>
                <GrowthIndicator value={data.growth.vsLastYear.cases} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Issue Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {data.ytd.issueRate.toFixed(1)}%
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {data.ytd.issuedCases} of {data.ytd.submittedCases}
                </span>
                <Badge variant="outline">Target: 75%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* This Month Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Current Month Performance</CardTitle>
            <CardDescription>Month-to-date vs previous month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Premium</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.thisMonth.totalPremium)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <GrowthIndicator value={data.growth.vsLastMonth.premium} />
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Cases</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.thisMonth.totalCases}</div>
                <div className="flex items-center gap-2 mt-1">
                  <GrowthIndicator value={data.growth.vsLastMonth.cases} />
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Commission</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(data.thisMonth.totalCommission)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Avg: {formatCurrency(data.ytd.averagePremium)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="mix">Product Mix</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">12-Month Performance Trend</CardTitle>
                <CardDescription>Premium, commission, and case volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={data.monthlyTrend}>
                    <defs>
                      <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} className="text-gray-600 dark:text-gray-400" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="premium"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorPremium)"
                      name="Premium"
                    />
                    <Area
                      type="monotone"
                      dataKey="commission"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorCommission)"
                      name="Commission"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Case Activity</CardTitle>
                  <CardDescription>Monthly case submissions and issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                      <YAxis className="text-gray-600 dark:text-gray-400" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cases" fill="#3b82f6" name="Total Cases" />
                      <Bar dataKey="submitted" fill="#10b981" name="Submitted" />
                      <Bar dataKey="issued" fill="#f59e0b" name="Issued" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Top Carriers</CardTitle>
                  <CardDescription>Premium distribution by carrier</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={carrierData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} className="text-gray-600 dark:text-gray-400" />
                      <YAxis type="category" dataKey="name" width={100} className="text-gray-600 dark:text-gray-400" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="premium" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Product Mix Tab */}
          <TabsContent value="mix" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Product Mix by Premium</CardTitle>
                  <CardDescription>Premium distribution across product types</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={productMixData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name} (${entry.percentage.toFixed(1)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {productMixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Product Performance</CardTitle>
                  <CardDescription>Detailed breakdown by product type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productMixData
                      .sort((a, b) => b.value - a.value)
                      .map((product, index) => (
                        <div key={product.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.count} cases
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(product.value)}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${product.percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Sales Pipeline Analysis</CardTitle>
                <CardDescription>Cases and premium by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {pipelineData.map((item) => (
                    <div key={item.status} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <div className="text-sm font-semibold text-muted-foreground mb-2">
                        {item.status}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.cases}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(item.premium)}
                      </div>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pipelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="status" className="text-gray-600 dark:text-gray-400" />
                    <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} className="text-gray-600 dark:text-gray-400" />
                    <YAxis yAxisId="right" orientation="right" className="text-gray-600 dark:text-gray-400" />
                    <Tooltip formatter={(value: number, name: string) =>
                      name === 'cases' ? value : formatCurrency(value)
                    } />
                    <Legend />
                    <Bar yAxisId="left" dataKey="premium" fill="#3b82f6" name="Premium" />
                    <Bar yAxisId="right" dataKey="cases" fill="#10b981" name="Cases" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Agents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">{data.agents.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Agents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">{data.agents.active}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.agents.activePercentage.toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Avg Premium per Agent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(
                      data.agents.active > 0 ? data.ytd.totalPremium / data.agents.active : 0
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Top 5 Producers</CardTitle>
                <CardDescription>Highest performers by premium volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topAgents.map((agent, index) => (
                    <div key={agent.agent.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {agent.agent.firstName} {agent.agent.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{agent.cases} cases</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(agent.premium)}</div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(agent.commission)} commission
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
