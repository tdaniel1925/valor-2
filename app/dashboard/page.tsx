"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

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
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
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
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {data.user.firstName} {data.user.lastName}!
          </h2>
          <p className="text-gray-600">
            Here's what's happening with your insurance business today.
          </p>
        </div>

        {/* Period Summaries - MTD/QTD/YTD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* MTD Summary */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Month-to-Date</h3>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-blue-100 text-sm">Commissions</p>
                <p className="text-3xl font-bold">{formatCurrency(data.periodSummaries.mtd.commissions)}</p>
                <p className="text-blue-100 text-xs mt-1">{data.periodSummaries.mtd.commissionsCount} payments</p>
              </div>
              <div className="pt-3 border-t border-blue-400">
                <p className="text-blue-100 text-sm">Cases</p>
                <p className="text-2xl font-bold">{data.periodSummaries.mtd.cases}</p>
              </div>
            </div>
          </div>

          {/* QTD Summary */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quarter-to-Date</h3>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-purple-100 text-sm">Commissions</p>
                <p className="text-3xl font-bold">{formatCurrency(data.periodSummaries.qtd.commissions)}</p>
                <p className="text-purple-100 text-xs mt-1">{data.periodSummaries.qtd.commissionsCount} payments</p>
              </div>
              <div className="pt-3 border-t border-purple-400">
                <p className="text-purple-100 text-sm">Cases</p>
                <p className="text-2xl font-bold">{data.periodSummaries.qtd.cases}</p>
              </div>
            </div>
          </div>

          {/* YTD Summary */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Year-to-Date</h3>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-green-100 text-sm">Commissions</p>
                <p className="text-3xl font-bold">{formatCurrency(data.periodSummaries.ytd.commissions)}</p>
                <p className="text-green-100 text-xs mt-1">{data.periodSummaries.ytd.commissionsCount} payments</p>
              </div>
              <div className="pt-3 border-t border-green-400">
                <p className="text-green-100 text-sm">Cases</p>
                <p className="text-2xl font-bold">{data.periodSummaries.ytd.cases}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.stats.casesTotal}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
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
            <p className="text-sm text-gray-500 mt-2">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Commissions
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(pendingCommissions)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
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
            <p className="text-sm text-gray-500 mt-2">
              Total: {formatCurrency(data.stats.commissionsTotal)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Quotes
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.stats.quotesTotal}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-purple-600"
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
            <p className="text-sm text-gray-500 mt-2">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Contracts
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.stats.contractsTotal}
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-indigo-600"
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
            <p className="text-sm text-gray-500 mt-2">Across all carriers</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Cases - 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Cases
              </h3>
              <Link
                href="/cases"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all →
              </Link>
            </div>
            {data.recentActivity.cases.length > 0 ? (
              <div className="space-y-4">
                {data.recentActivity.cases.map((case_) => (
                  <div
                    key={case_.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
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
                      <p className="text-sm text-gray-600 mt-1">
                        {case_.productType} • {case_.carrier}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {case_.premium
                          ? formatCurrency(case_.premium)
                          : "TBD"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(case_.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No cases yet</p>
              </div>
            )}
          </div>

          {/* Notifications - 1 column */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
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
                      notification.isNew ? "bg-blue-50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
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
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Commissions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Commissions
            </h3>
            <Link
              href="/commissions"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>
          {data.recentActivity.commissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carrier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recentActivity.commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {commission.carrier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {commission.type.replace("_", " ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
              <p className="text-gray-500">No commissions yet</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
