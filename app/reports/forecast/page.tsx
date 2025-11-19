'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, TrendingUp, DollarSign, Calendar, FileText, BarChart3, PieChart } from 'lucide-react';
import { exportToExcel, exportToCSV } from '@/lib/export-utils';

interface MonthlyForecast {
  month: string;
  projected: number;
  conservative: number;
  optimistic: number;
  actual?: number;
}

interface ForecastData {
  summary: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
    confidenceLevel: number;
  };
  monthlyForecast: MonthlyForecast[];
  byAgent: Array<{
    agentName: string;
    projected: number;
    confidence: number;
  }>;
  byCarrier: Array<{
    carrierName: string;
    projected: number;
    percentage: number;
  }>;
  assumptions: {
    averageCommissionRate: number;
    expectedGrowthRate: number;
    historicalAccuracy: number;
  };
}

export default function CommissionForecastPage() {
  const [timeframe, setTimeframe] = useState<'3month' | '6month' | '12month'>('6month');

  const { data, isLoading } = useQuery<ForecastData>({
    queryKey: ['commission-forecast', timeframe],
    queryFn: async () => {
      const res = await fetch(`/api/reports/forecast?timeframe=${timeframe}`);
      if (!res.ok) throw new Error('Failed to fetch forecast');
      return res.json();
    },
  });

  const handleExportExcel = () => {
    if (!data) return;

    const summaryData = [
      { Metric: 'Next Month Forecast', Value: `$${data.summary.nextMonth.toLocaleString()}` },
      { Metric: 'Next Quarter Forecast', Value: `$${data.summary.nextQuarter.toLocaleString()}` },
      { Metric: 'Next Year Forecast', Value: `$${data.summary.nextYear.toLocaleString()}` },
      { Metric: 'Confidence Level', Value: `${data.summary.confidenceLevel}%` },
    ];

    const monthlyData = data.monthlyForecast.map(m => ({
      'Month': m.month,
      'Conservative': m.conservative,
      'Projected': m.projected,
      'Optimistic': m.optimistic,
      'Actual': m.actual || 'N/A',
    }));

    const agentData = data.byAgent.map(a => ({
      'Agent': a.agentName,
      'Projected': a.projected,
      'Confidence': `${a.confidence}%`,
    }));

    exportToExcel(
      [
        { name: 'Summary', data: summaryData },
        { name: 'Monthly Forecast', data: monthlyData },
        { name: 'By Agent', data: agentData },
      ],
      `Commission_Forecast_${timeframe}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const handleExportCSV = () => {
    if (!data) return;

    const csvData = data.monthlyForecast.map(m => ({
      'Month': m.month,
      'Conservative': m.conservative,
      'Projected': m.projected,
      'Optimistic': m.optimistic,
      'Actual': m.actual || '',
    }));

    exportToCSV(csvData, `Commission_Forecast_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading forecast...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Commission Forecasting</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              AI-powered commission projections based on historical trends
            </p>
          </div>
          <div className="flex gap-2">
            {/* Timeframe Filter */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['3month', '6month', '12month'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    timeframe === tf
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {tf === '3month' && '3 Months'}
                  {tf === '6month' && '6 Months'}
                  {tf === '12month' && '12 Months'}
                </button>
              ))}
            </div>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Next Month</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    ${(data?.summary.nextMonth || 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Next Quarter</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    ${((data?.summary.nextQuarter || 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Next Year</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    ${((data?.summary.nextYear || 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {(data?.summary.confidenceLevel || 0).toFixed(0)}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Forecast Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Commission Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Month
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Conservative
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Projected
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Optimistic
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actual
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.monthlyForecast.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {month.month}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                        ${month.conservative.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-blue-600 dark:text-blue-400">
                        ${month.projected.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">
                        ${month.optimistic.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                        {month.actual ? `$${month.actual.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* By Agent */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast by Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.byAgent.map((agent, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {agent.agentName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {agent.confidence}% confidence
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ${agent.projected.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Carrier */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast by Carrier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.byCarrier.map((carrier, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {carrier.carrierName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {carrier.percentage.toFixed(1)}% of total
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ${carrier.projected.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assumptions */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Commission Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data?.assumptions.averageCommissionRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Growth Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{data?.assumptions.expectedGrowthRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Historical Accuracy</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data?.assumptions.historicalAccuracy.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
