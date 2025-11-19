'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Filter,
  Building2,
  Calendar,
  Loader2,
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
  exportCommissionReportToExcel,
  prepareCommissionDataForExport,
  exportToCSV,
} from '@/lib/export-utils';

interface CommissionData {
  success: boolean;
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    total: number;
    pending: number;
    paid: number;
    count: number;
  };
  byStatus: Record<string, { count: number; amount: number }>;
  byCarrier: Record<string, { count: number; amount: number }>;
  byProductType: Record<string, { count: number; amount: number }>;
  monthlyTrend: Array<{
    month: string;
    total: number;
    paid: number;
    pending: number;
    count: number;
  }>;
  recentCommissions: any[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CommissionsReportPage() {
  const [period, setPeriod] = useState<string>('month');
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommissionData();
  }, [period]);

  const fetchCommissionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/commissions?period=${period}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch commission data');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commission data');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PAID: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      PROCESSING: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  };

  const handleExportExcel = () => {
    if (!data) return;
    const filename = `commission-report-${period}-${new Date().toISOString().split('T')[0]}`;
    exportCommissionReportToExcel(data, filename);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const csvData = prepareCommissionDataForExport(data);
    const filename = `commission-report-${period}-${new Date().toISOString().split('T')[0]}`;
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
                <p className="text-muted-foreground">Loading commission data...</p>
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
                <Button onClick={fetchCommissionData}>
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
  const carrierChartData = Object.entries(data.byCarrier).map(([name, value]) => ({
    name,
    amount: value.amount,
    count: value.count,
  }));

  const productTypeChartData = Object.entries(data.byProductType).map(([name, value]) => ({
    name,
    amount: value.amount,
    count: value.count,
  }));

  const statusChartData = Object.entries(data.byStatus).map(([name, value]) => ({
    name,
    amount: value.amount,
    count: value.count,
  }));

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Commission Reports</h1>
            <p className="text-muted-foreground mt-1">
              Track and analyze commission earnings across all policies
            </p>
          </div>
          <div className="flex gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Commissions</CardDescription>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.summary.total)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.summary.count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Paid</CardDescription>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.summary.paid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((data.summary.paid / data.summary.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Pending</CardDescription>
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(data.summary.pending)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((data.summary.pending / data.summary.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Average Commission</CardDescription>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.summary.total / data.summary.count)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Commission by Carrier</CardTitle>
                  <CardDescription>Distribution across insurance carriers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={carrierChartData}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: ${formatCurrency(entry.amount)}`}
                      >
                        {carrierChartData.map((entry, index) => (
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
                  <CardTitle className="text-gray-900 dark:text-white">Commission by Product Type</CardTitle>
                  <CardDescription>Life, annuities, and other products</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productTypeChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} className="text-gray-600 dark:text-gray-400" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="amount" fill="#3b82f6" name="Commission Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Commission Status</CardTitle>
                <CardDescription>Breakdown by payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {statusChartData.map((status, index) => (
                    <div key={status.name} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getStatusColor(status.name)}>{status.name}</Badge>
                        <span className="text-sm text-muted-foreground">{status.count} cases</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(status.amount)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">6-Month Commission Trend</CardTitle>
                <CardDescription>Monthly commission performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} className="text-gray-600 dark:text-gray-400" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Total"
                    />
                    <Line
                      type="monotone"
                      dataKey="paid"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Paid"
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Pending"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Top Carriers</CardTitle>
                  <CardDescription>Highest commission earnings by carrier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {carrierChartData
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 5)
                      .map((carrier, index) => (
                        <div key={carrier.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{carrier.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {carrier.count} cases
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(carrier.amount)}</div>
                            <div className="text-sm text-muted-foreground">
                              {((carrier.amount / data.summary.total) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Product Performance</CardTitle>
                  <CardDescription>Commission by product category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productTypeChartData
                      .sort((a, b) => b.amount - a.amount)
                      .map((product, index) => (
                        <div key={product.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
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
                            <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(product.amount)}</div>
                            <div className="text-sm text-muted-foreground">
                              {((product.amount / data.summary.total) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Recent Commissions</CardTitle>
                <CardDescription>Latest commission transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="text-gray-900 dark:text-gray-300">{formatDate(commission.createdAt)}</TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {commission.case?.clientName || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">{commission.case?.carrier || 'N/A'}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">{commission.case?.productType || 'N/A'}</TableCell>
                        <TableCell className="text-gray-900 dark:text-white">{formatCurrency(commission.case?.premium || 0)}</TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(commission.amount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(commission.status)}>
                            {commission.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
