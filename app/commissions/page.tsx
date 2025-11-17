"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface Commission {
  id: string;
  type: string;
  status: string;
  carrier: string;
  policyNumber: string | null;
  amount: number;
  percentage: number | null;
  splitAmount: number | null;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  createdAt: string;
  case: {
    id: string;
    clientName: string;
    productType: string;
  } | null;
}

interface CommissionsData {
  commissions: Commission[];
  totals: Array<{
    status: string;
    _count: number;
    _sum: { amount: number | null };
  }>;
}

export default function CommissionsPage() {
  const { data, isLoading, error } = useQuery<CommissionsData>({
    queryKey: ["commissions"],
    queryFn: async () => {
      const res = await fetch("/api/commissions");
      if (!res.ok) throw new Error("Failed to fetch commissions");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading commissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load commissions</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalPaid =
    data.totals.find((t) => t.status === "PAID")?._sum.amount || 0;
  const totalPending =
    data.totals.find((t) => t.status === "PENDING")?._sum.amount || 0;
  const totalAmount = data.commissions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Commissions</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your earnings and commission payments
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Earned</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Paid</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {data.totals.find((t) => t.status === "PAID")?._count || 0}{" "}
              payments
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {formatCurrency(totalPending)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {data.totals.find((t) => t.status === "PENDING")?._count || 0}{" "}
              pending
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Count</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.commissions.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Commission records</p>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {data.commissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client/Policy
                    </th>
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
                      Split
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {commission.case?.clientName || "—"}
                        </div>
                        {commission.policyNumber && (
                          <div className="text-xs text-gray-500">
                            Policy #{commission.policyNumber}
                          </div>
                        )}
                        {commission.case?.productType && (
                          <div className="text-xs text-gray-400">
                            {commission.case.productType}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commission.carrier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {commission.type.replace(/_/g, " ")}
                        </span>
                        {commission.percentage && (
                          <div className="text-xs text-gray-400">
                            {(commission.percentage * 100).toFixed(1)}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(commission.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {commission.splitAmount
                          ? formatCurrency(commission.splitAmount)
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            commission.status === "PAID"
                              ? "success"
                              : commission.status === "PENDING"
                              ? "warning"
                              : commission.status === "DISPUTED"
                              ? "danger"
                              : "default"
                          }
                        >
                          {commission.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>{formatDate(commission.periodStart)}</div>
                        <div className="text-xs text-gray-400">
                          to {formatDate(commission.periodEnd)}
                        </div>
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
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No commissions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Commission records will appear here once cases are issued.
              </p>
            </div>
          )}
        </div>

        {/* Commission Breakdown by Type */}
        {data.commissions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Commission Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(
                data.commissions.reduce((acc, c) => {
                  if (!acc[c.type]) {
                    acc[c.type] = { count: 0, total: 0 };
                  }
                  acc[c.type].count++;
                  acc[c.type].total += c.amount;
                  return acc;
                }, {} as Record<string, { count: number; total: number }>)
              ).map(([type, stats]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600">
                    {type.replace(/_/g, " ")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(stats.total)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.count} {stats.count === 1 ? "payment" : "payments"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
