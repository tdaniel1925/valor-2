"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";
import PerformanceCharts from "@/components/dashboard/PerformanceCharts";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

interface DashboardData {
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  stats: {
    casesTotal: number;
    commissionsTotal: number;
    contractsTotal: number;
    quotesTotal: number;
    casesByStatus: Array<{ status: string; _count: number }>;
    commissionsByStatus: Array<{
      status: string;
      _count: number;
      _sum: { amount: number };
    }>;
  };
  periodSummaries: {
    mtd: {
      commissions: number;
      commissionsCount: number;
      cases: number;
    };
    qtd: {
      commissions: number;
      commissionsCount: number;
      cases: number;
    };
    ytd: {
      commissions: number;
      commissionsCount: number;
      cases: number;
    };
  };
  recentActivity: {
    cases: Array<{
      id: string;
      clientName: string;
      carrier: string;
      productType: string;
      status: string;
      premium: number | null;
      createdAt: string;
    }>;
    commissions: Array<{
      id: string;
      type: string;
      status: string;
      carrier: string;
      amount: number;
      paidAt: string | null;
    }>;
  };
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    isNew: boolean;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      console.log("Fetching dashboard data...");
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        console.error("Dashboard API error:", res.status, res.statusText);
        throw new Error("Failed to fetch dashboard data");
      }
      const json = await res.json();
      console.log("Dashboard data received:", json);
      return json.data;
    },
  });

  console.log("Dashboard state:", { isLoading, error, hasData: !!data });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const pendingCommissions =
    data.stats.commissionsByStatus.find((c) => c.status === "PENDING")?._sum
      ?.amount || 0;

  return (
    <AppLayout user={data.user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {data.user.firstName} {data.user.lastName}!
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Here's what's happening with your insurance business today.
          </p>
        </div>

        {/* Period Summaries - MTD/QTD/YTD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* MTD Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Month-to-Date</h3>
              <div className="bg-blue-200 dark:bg-blue-800 bg-opacity-50 dark:bg-opacity-50 rounded-full p-2">
                <svg className="w-6 h-6 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-blue-700 dark:text-blue-300 text-sm">Commissions</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(data.periodSummaries.mtd.commissions)}</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">{data.periodSummaries.mtd.commissionsCount} payments</p>
              </div>
              <div className="pt-3 border-t border-blue-300 dark:border-blue-700">
                <p className="text-blue-700 dark:text-blue-300 text-sm">Cases</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{data.periodSummaries.mtd.cases}</p>
              </div>
            </div>
          </div>

          {/* QTD Summary */}
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg shadow-lg p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Quarter-to-Date</h3>
              <div className="bg-purple-200 dark:bg-purple-800 bg-opacity-50 dark:bg-opacity-50 rounded-full p-2">
                <svg className="w-6 h-6 text-purple-700 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-purple-700 dark:text-purple-300 text-sm">Commissions</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(data.periodSummaries.qtd.commissions)}</p>
                <p className="text-purple-700 dark:text-purple-300 text-xs mt-1">{data.periodSummaries.qtd.commissionsCount} payments</p>
              </div>
              <div className="pt-3 border-t border-purple-300 dark:border-purple-700">
                <p className="text-purple-700 dark:text-purple-300 text-sm">Cases</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{data.periodSummaries.qtd.cases}</p>
              </div>
            </div>
          </div>

          {/* YTD Summary */}
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg shadow-lg p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Year-to-Date</h3>
              <div className="bg-green-200 dark:bg-green-800 bg-opacity-50 dark:bg-opacity-50 rounded-full p-2">
                <svg className="w-6 h-6 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-green-700 dark:text-green-300 text-sm">Commissions</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{formatCurrency(data.periodSummaries.ytd.commissions)}</p>
                <p className="text-green-700 dark:text-green-300 text-xs mt-1">{data.periodSummaries.ytd.commissionsCount} payments</p>
              </div>
              <div className="pt-3 border-t border-green-300 dark:border-green-700">
                <p className="text-green-700 dark:text-green-300 text-sm">Cases</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{data.periodSummaries.ytd.cases}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Path to Promotion Progress Meter */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 rounded-lg shadow-lg p-6 border border-amber-200 dark:border-amber-800">
            {/* Header with Title and Current Stats */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Path to Promotion
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Associate → Street Level
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs font-semibold rounded-full border border-green-300 dark:border-green-700">
                    🎯 Promotion Pending
                  </span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">2 months remaining</p>
              </div>
            </div>

            {/* Production Progress */}
            <div className="mb-3">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  $60,300
                </span>
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  of <span className="font-semibold">$90,000</span> target
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Year-to-Date Production • 67% Complete
              </p>
            </div>

            {/* Progress Bar with Milestones */}
            <div className="relative">
              {/* Main progress bar container */}
              <div className="relative w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                {/* Animated striped progress fill */}
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
                  style={{ width: '67%' }}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600"></div>

                  {/* Animated diagonal stripes */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,.25) 12px, rgba(255,255,255,.25) 24px)',
                      backgroundSize: '40px 40px',
                      animation: 'progress-stripes 1.5s linear infinite'
                    }}
                  ></div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>

                {/* Milestone markers */}
                <div className="absolute top-0 left-[33.3%] w-0.5 h-full bg-white/40 z-10"></div>
                <div className="absolute top-0 left-[83.3%] w-0.5 h-full bg-white/40 z-10"></div>

                {/* Current position indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-12 bg-amber-900 dark:bg-amber-100 rounded-full shadow-lg z-20"
                  style={{ left: 'calc(67% - 2px)' }}
                >
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-amber-900 dark:bg-amber-100 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Milestone labels below the bar */}
              <div className="relative mt-3">
                <div className="flex justify-between items-start">
                  {/* $0 */}
                  <div className="flex flex-col items-center" style={{ width: '0%', position: 'absolute', left: '0%', transform: 'translateX(0%)' }}>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">$0</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-500">Start</div>
                  </div>

                  {/* $30K - First threshold */}
                  <div className="flex flex-col items-center" style={{ width: '0%', position: 'absolute', left: '33.3%', transform: 'translateX(-50%)' }}>
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">$30K</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Pre-Assoc</div>
                  </div>

                  {/* $60.3K - Current position */}
                  <div className="flex flex-col items-center" style={{ width: '0%', position: 'absolute', left: '67%', transform: 'translateX(-50%)' }}>
                    <div className="px-2 py-0.5 bg-amber-900 dark:bg-amber-100 text-white dark:text-amber-900 text-xs font-bold rounded shadow-lg">
                      YOU
                    </div>
                    <div className="text-[10px] text-amber-800 dark:text-amber-200 font-medium mt-1">$60.3K</div>
                  </div>

                  {/* $75K - Street minimum */}
                  <div className="flex flex-col items-center" style={{ width: '0%', position: 'absolute', left: '83.3%', transform: 'translateX(-50%)' }}>
                    <div className="text-xs font-semibold text-green-700 dark:text-green-300">$75K</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Street Min</div>
                  </div>

                  {/* $90K - Target */}
                  <div className="flex flex-col items-center" style={{ width: '0%', position: 'absolute', left: '100%', transform: 'translateX(-100%)' }}>
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-100">$90K</div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-300">Goal</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps Indicator */}
            <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Qualified for Street Level (75%)</span>
                </div>
                <div className="text-amber-700 dark:text-amber-300">
                  <span className="font-semibold">$29.7K</span> to next goal
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes progress-stripes {
            from {
              background-position: 0 0;
            }
            to {
              background-position: 40px 0;
            }
          }
        `}</style>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Cases</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {data.stats.casesTotal}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <svg
                    className="w-8 h-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pending Commissions
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {formatCurrency(pendingCommissions)}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Total: {formatCurrency(data.stats.commissionsTotal)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Quotes
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {data.stats.quotesTotal}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                  <svg
                    className="w-8 h-8 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Active Contracts
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {data.stats.contractsTotal}
                  </p>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                  <svg
                    className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Across all carriers</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Cases - 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Recent Cases
                  </h3>
                  <Link
                    href="/cases"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    View all →
                  </Link>
                </div>
                {data.recentActivity.cases.length > 0 ? (
                  <div className="space-y-4">
                    {data.recentActivity.cases.map((case_) => (
                      <div
                        key={case_.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {case_.clientName}
                            </p>
                            <Badge
                              variant={
                                case_.status === "ISSUED"
                                  ? "success"
                                  : case_.status === "DECLINED"
                                  ? "danger"
                                  : "default"
                              }
                            >
                              {case_.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {case_.productType} • {case_.carrier}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {case_.premium
                              ? formatCurrency(case_.premium)
                              : "TBD"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(case_.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No cases yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications - 1 column */}
          <div>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </h3>
                  {data.notifications.filter((n) => n.isNew).length > 0 && (
                    <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                      {data.notifications.filter((n) => n.isNew).length}
                    </span>
                  )}
                </div>
                {data.notifications.length > 0 ? (
                  <div className="space-y-3">
                    {data.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg ${
                          notification.isNew ? "bg-blue-50 dark:bg-blue-900/30" : "bg-gray-50 dark:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                          {notification.isNew && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Commissions */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Commissions
              </h3>
              <Link
                href="/commissions"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                View all →
              </Link>
            </div>
            {data.recentActivity.commissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Carrier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Paid Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.recentActivity.commissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {commission.carrier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {commission.type.replace("_", " ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(commission.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              commission.status === "PAID"
                                ? "success"
                                : "warning"
                            }
                          >
                            {commission.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {commission.paidAt
                            ? formatDate(commission.paidAt)
                            : "Pending"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">No commissions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Charts Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Performance Analytics
          </h2>
          <PerformanceCharts />
        </div>
      </div>
    </AppLayout>
  );
}
