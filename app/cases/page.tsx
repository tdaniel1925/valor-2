"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, CardContent } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

interface Case {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  carrier: string;
  productType: string;
  productName: string;
  applicationNumber: string | null;
  policyNumber: string | null;
  coverageAmount: number | null;
  premium: number | null;
  status: string;
  statusNotes: string | null;
  pendingRequirements: string[];
  submittedAt: string | null;
  approvedAt: string | null;
  issuedAt: string | null;
  createdAt: string;
  quote: { id: string; type: string } | null;
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
}

interface CasesData {
  cases: Case[];
}

export default function CasesPage() {
  const { data, isLoading, error } = useQuery<CasesData>({
    queryKey: ["cases"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      if (!res.ok) throw new Error("Failed to fetch cases");
      return res.json();
    },
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ISSUED":
        return "success";
      case "APPROVED":
        return "success";
      case "DECLINED":
      case "WITHDRAWN":
        return "danger";
      case "IN_UNDERWRITING":
      case "PENDING_REQUIREMENTS":
        return "warning";
      case "SUBMITTED":
        return "info";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading cases...</p>
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
            <p className="text-red-600 dark:text-red-400">Failed to load cases</p>
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cases</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track and manage your insurance applications
          </p>
          <div className="mt-4">
            <Button>+ New Case</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Cases</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {data.cases.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">In Underwriting</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {data.cases.filter((c) => c.status === "IN_UNDERWRITING").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Approved</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {
                  data.cases.filter(
                    (c) => c.status === "APPROVED" || c.status === "ISSUED"
                  ).length
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Premium</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(
                  data.cases.reduce((sum, c) => sum + (c.premium || 0), 0)
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cases List */}
        {data.cases.length > 0 ? (
          <div className="space-y-4">
            {data.cases.map((case_) => (
              <Card
                key={case_.id}
                className="hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {case_.clientName}
                      </h3>
                      {case_.clientEmail && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {case_.clientEmail}
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(case_.status)} className="ml-2 flex-shrink-0">
                      {case_.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Product</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {case_.productName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{case_.productType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Carrier</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {case_.carrier}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Coverage</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {case_.coverageAmount
                          ? formatCurrency(case_.coverageAmount)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Premium</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {case_.premium ? formatCurrency(case_.premium) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Pending Requirements */}
                  {case_.pendingRequirements.length > 0 && (
                    <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-xs text-orange-700 dark:text-orange-300">
                      {case_.pendingRequirements.length} pending requirement
                      {case_.pendingRequirements.length > 1 ? "s" : ""}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {case_.submittedAt
                        ? formatDate(case_.submittedAt)
                        : formatDate(case_.createdAt)}
                    </span>
                    <Button variant="ghost" size="sm">
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center p-12">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No cases</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first case.
              </p>
              <div className="mt-6">
                <Button>+ New Case</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
