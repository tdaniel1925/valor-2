"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

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
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading commissions...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Failed to load commissions</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalPaid =
    data.totals.find((t) => t.status === "PAID")?._sum.amount || 0;
  const totalPending =
    data.totals.find((t) => t.status === "PENDING")?._sum.amount || 0;
  const totalAmount = data.commissions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Commissions</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track your earnings and commission payments
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Earned</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {formatCurrency(totalAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.totals.find((t) => t.status === "PAID")?._count || 0}{" "}
                payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.totals.find((t) => t.status === "PENDING")?._count || 0}{" "}
                pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Count</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {data.commissions.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Commission records</p>
            </CardContent>
          </Card>
        </div>

        {/* Commissions List */}
        <div className="mb-8">
          {data.commissions.length > 0 ? (
            <div className="space-y-4">
              {data.commissions.map((commission) => (
                <Card
                  key={commission.id}
                  className="hover:shadow-md dark:hover:shadow-gray-900/70 transition-shadow"
                >
                  <CardContent className="p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {commission.case?.clientName || "—"}
                        </h3>
                        {commission.policyNumber && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Policy #{commission.policyNumber}
                          </p>
                        )}
                      </div>
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
                        className="ml-2 flex-shrink-0"
                      >
                        {commission.status}
                      </Badge>
                    </div>

                    {/* Amount - Prominent Display */}
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Commission Amount</p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-300 mt-1">
                        {formatCurrency(commission.amount)}
                      </p>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Carrier</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {commission.carrier}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {commission.type.replace(/_/g, " ")}
                        </p>
                        {commission.percentage && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(commission.percentage * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                      {commission.splitAmount && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Split Amount</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(commission.splitAmount)}
                          </p>
                        </div>
                      )}
                      <div className={commission.splitAmount ? "" : "col-span-2"}>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Period</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(commission.periodStart)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          to {formatDate(commission.periodEnd)}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {commission.paidAt
                          ? `Paid ${formatDate(commission.paidAt)}`
                          : "Payment Pending"}
                      </span>
                      {commission.case?.productType && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {commission.case.productType}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent className="p-6">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No commissions
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Commission records will appear here once cases are issued.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Commission Breakdown by Type */}
        {data.commissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Commission Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {type.replace(/_/g, " ")}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                      {formatCurrency(stats.total)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stats.count} {stats.count === 1 ? "payment" : "payments"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
