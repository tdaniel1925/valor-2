'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Award, Percent } from 'lucide-react';
import { exportToExcel, exportToCSV } from '@/lib/export-utils';

interface CarrierMetrics {
  carrierId: string;
  carrierName: string;
  totalPremium: number;
  policyCount: number;
  averagePremium: number;
  commissionRate: number;
  totalCommissions: number;
  marketShare: number;
  growth: number;
  approvalRate: number;
  averageUnderwritingTime: number;
  productTypes: {
    life: number;
    annuity: number;
    term: number;
  };
  topProducts: Array<{
    name: string;
    premium: number;
    count: number;
  }>;
}

interface CarrierAnalyticsData {
  summary: {
    totalCarriers: number;
    totalPremium: number;
    averageApprovalRate: number;
    topCarrierShare: number;
  };
  carriers: CarrierMetrics[];
  period: string;
}

type PeriodFilter = 'month' | 'quarter' | 'ytd' | 'year';

export default function CarrierAnalysisPage() {
  const [period, setPeriod] = useState<PeriodFilter>('ytd');

  const { data, isLoading } = useQuery<CarrierAnalyticsData>({
    queryKey: ['carrier-analytics', period],
    queryFn: async () => {
      const res = await fetch(`/api/reports/carriers?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch carrier analytics');
      return res.json();
    },
  });

  const handleExportExcel = () => {
    if (!data) return;

    const summaryData = [
      { Metric: 'Total Carriers', Value: data.summary.totalCarriers },
      { Metric: 'Total Premium', Value: `$${data.summary.totalPremium.toLocaleString()}` },
      { Metric: 'Average Approval Rate', Value: `${data.summary.averageApprovalRate}%` },
      { Metric: 'Top Carrier Market Share', Value: `${data.summary.topCarrierShare}%` },
    ];

    const carrierData = data.carriers.map(carrier => ({
      'Carrier Name': carrier.carrierName,
      'Total Premium': carrier.totalPremium,
      'Policy Count': carrier.policyCount,
      'Average Premium': carrier.averagePremium,
      'Commission Rate': `${carrier.commissionRate}%`,
      'Total Commissions': carrier.totalCommissions,
      'Market Share': `${carrier.marketShare}%`,
      'Growth': `${carrier.growth}%`,
      'Approval Rate': `${carrier.approvalRate}%`,
      'Avg Underwriting Time': `${carrier.averageUnderwritingTime} days`,
      'Life %': `${carrier.productTypes.life}%`,
      'Annuity %': `${carrier.productTypes.annuity}%`,
      'Term %': `${carrier.productTypes.term}%`,
    }));

    exportToExcel(
      [
        { name: 'Summary', data: summaryData },
        { name: 'Carrier Performance', data: carrierData },
      ],
      `Carrier_Analysis_${period}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const handleExportCSV = () => {
    if (!data) return;

    const csvData = data.carriers.map(carrier => ({
      'Carrier Name': carrier.carrierName,
      'Total Premium': carrier.totalPremium,
      'Policy Count': carrier.policyCount,
      'Average Premium': carrier.averagePremium,
      'Commission Rate': carrier.commissionRate,
      'Total Commissions': carrier.totalCommissions,
      'Market Share': carrier.marketShare,
      'Growth': carrier.growth,
      'Approval Rate': carrier.approvalRate,
      'Avg Underwriting Time': carrier.averageUnderwritingTime,
    }));

    exportToCSV(csvData, `Carrier_Analysis_${period}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading carrier analytics...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Carrier Analysis</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Performance metrics and insights across all insurance carriers
            </p>
          </div>
          <div className="flex gap-2">
            {/* Period Filter */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['month', 'quarter', 'ytd', 'year'] as PeriodFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    period === p
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {p === 'month' && 'Month'}
                  {p === 'quarter' && 'Quarter'}
                  {p === 'ytd' && 'YTD'}
                  {p === 'year' && 'Year'}
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Carriers</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {data?.summary.totalCarriers || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Premium</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    ${((data?.summary.totalPremium || 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Approval Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {(data?.summary.averageApprovalRate || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Percent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Top Carrier Share</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {(data?.summary.topCarrierShare || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carrier Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Carrier Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Carrier
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Total Premium
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Policies
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Market Share
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Approval Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Commissions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Growth
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.carriers.map((carrier, index) => (
                    <tr key={carrier.carrierId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {index < 3 && (
                            <Award className={`h-5 w-5 mr-2 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              'text-orange-600'
                            }`} />
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {carrier.carrierName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${(carrier.totalPremium / 1000).toFixed(0)}K
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                        {carrier.policyCount}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                        {carrier.marketShare.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                        {carrier.approvalRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-green-600 dark:text-green-400">
                        ${(carrier.totalCommissions / 1000).toFixed(0)}K
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`flex items-center justify-end text-sm font-medium ${
                          carrier.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {carrier.growth >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(carrier.growth).toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
