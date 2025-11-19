'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Target, TrendingUp, DollarSign, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { exportToExcel, exportToCSV } from '@/lib/export-utils';

interface GoalProgress {
  goalId: string;
  goalName: string;
  agentName: string;
  organization: string;
  goalType: 'PREMIUM' | 'CASES' | 'REVENUE' | 'ANNUALIZED';
  target: number;
  current: number;
  percentage: number;
  daysRemaining: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED';
  projectedCompletion: number;
  requiredDailyRate: number;
  currentDailyRate: number;
  startDate: string;
  endDate: string;
}

interface GoalTrackingData {
  summary: {
    totalGoals: number;
    achieved: number;
    onTrack: number;
    atRisk: number;
    averageCompletion: number;
  };
  goals: GoalProgress[];
  period: string;
}

type PeriodFilter = 'month' | 'quarter' | 'ytd' | 'year';

export default function GoalTrackingPage() {
  const [period, setPeriod] = useState<PeriodFilter>('ytd');

  const { data, isLoading } = useQuery<GoalTrackingData>({
    queryKey: ['goal-tracking', period],
    queryFn: async () => {
      const res = await fetch(`/api/reports/goal-tracking?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch goal tracking');
      return res.json();
    },
  });

  const handleExportExcel = () => {
    if (!data) return;

    const summaryData = [
      { Metric: 'Total Goals', Value: data.summary.totalGoals },
      { Metric: 'Achieved', Value: data.summary.achieved },
      { Metric: 'On Track', Value: data.summary.onTrack },
      { Metric: 'At Risk', Value: data.summary.atRisk },
      { Metric: 'Average Completion', Value: `${data.summary.averageCompletion}%` },
    ];

    const goalData = data.goals.map(goal => ({
      'Goal Name': goal.goalName,
      'Agent': goal.agentName,
      'Organization': goal.organization,
      'Type': goal.goalType,
      'Target': goal.target,
      'Current': goal.current,
      'Progress': `${goal.percentage}%`,
      'Status': goal.status,
      'Days Remaining': goal.daysRemaining,
      'Projected Completion': `${goal.projectedCompletion}%`,
      'Required Daily Rate': goal.requiredDailyRate,
      'Current Daily Rate': goal.currentDailyRate,
    }));

    exportToExcel(
      [
        { name: 'Summary', data: summaryData },
        { name: 'Goal Progress', data: goalData },
      ],
      `Goal_Tracking_${period}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const handleExportCSV = () => {
    if (!data) return;

    const csvData = data.goals.map(goal => ({
      'Goal Name': goal.goalName,
      'Agent': goal.agentName,
      'Organization': goal.organization,
      'Type': goal.goalType,
      'Target': goal.target,
      'Current': goal.current,
      'Progress %': goal.percentage,
      'Status': goal.status,
      'Days Remaining': goal.daysRemaining,
    }));

    exportToCSV(csvData, `Goal_Tracking_${period}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACHIEVED':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
      case 'ON_TRACK':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30';
      case 'AT_RISK':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
      case 'MISSED':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30';
    }
  };

  const getProgressColor = (percentage: number, status: string) => {
    if (status === 'ACHIEVED') return 'bg-green-600';
    if (percentage >= 75) return 'bg-blue-600';
    if (percentage >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading goal tracking...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Goal Tracking</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Monitor progress towards sales goals and performance targets
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Goals</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {data?.summary.totalGoals || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Achieved</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {data?.summary.achieved || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">On Track</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {data?.summary.onTrack || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">At Risk</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                    {data?.summary.atRisk || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Completion</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {(data?.summary.averageCompletion || 0).toFixed(0)}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Progress Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data?.goals.map((goal) => (
                <div key={goal.goalId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {goal.goalName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {goal.agentName} • {goal.organization}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {goal.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ${goal.target.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ${goal.current.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Days Remaining</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {goal.daysRemaining}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Projected</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {goal.projectedCompletion.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {goal.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full ${getProgressColor(goal.percentage, goal.status)} transition-all duration-500`}
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Required Daily Rate</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${goal.requiredDailyRate.toLocaleString()}/day
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Current Daily Rate</p>
                      <p className={`text-sm font-medium ${
                        goal.currentDailyRate >= goal.requiredDailyRate
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${goal.currentDailyRate.toLocaleString()}/day
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
