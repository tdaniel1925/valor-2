"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cases...</p>
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
            <p className="text-red-600">Failed to load cases</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track and manage your insurance applications
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Back to Dashboard
              </Link>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                + New Case
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Cases</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.cases.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">In Underwriting</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {data.cases.filter((c) => c.status === "IN_UNDERWRITING").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {
                data.cases.filter(
                  (c) => c.status === "APPROVED" || c.status === "ISSUED"
                ).length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Premium</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(
                data.cases.reduce((sum, c) => sum + (c.premium || 0), 0)
              )}
            </p>
          </div>
        </div>

        {/* Cases List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {data.cases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carrier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coverage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Premium
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.cases.map((case_) => (
                    <tr key={case_.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {case_.clientName}
                        </div>
                        {case_.clientEmail && (
                          <div className="text-sm text-gray-500">
                            {case_.clientEmail}
                          </div>
                        )}
                        {case_.applicationNumber && (
                          <div className="text-xs text-gray-400 mt-1">
                            App #{case_.applicationNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {case_.productName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {case_.productType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {case_.carrier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {case_.coverageAmount
                          ? formatCurrency(case_.coverageAmount)
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {case_.premium ? formatCurrency(case_.premium) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusVariant(case_.status)}>
                          {case_.status.replace(/_/g, " ")}
                        </Badge>
                        {case_.pendingRequirements.length > 0 && (
                          <div className="text-xs text-orange-600 mt-1">
                            {case_.pendingRequirements.length} pending
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {case_.submittedAt
                          ? formatDate(case_.submittedAt)
                          : formatDate(case_.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-700 font-medium">
                          View Details
                        </button>
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No cases
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first case.
              </p>
              <div className="mt-6">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + New Case
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Case Details Cards */}
        {data.cases.length > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.cases.map((case_) => (
              <div
                key={case_.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {case_.clientName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {case_.productType} • {case_.carrier}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(case_.status)}>
                    {case_.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Coverage:</span>
                    <span className="font-medium text-gray-900">
                      {case_.coverageAmount
                        ? formatCurrency(case_.coverageAmount)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Premium:</span>
                    <span className="font-semibold text-gray-900">
                      {case_.premium ? formatCurrency(case_.premium) : "—"}
                    </span>
                  </div>
                  {case_.policyNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Policy #:</span>
                      <span className="font-medium text-gray-900">
                        {case_.policyNumber}
                      </span>
                    </div>
                  )}
                </div>

                {case_.pendingRequirements.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Pending Requirements:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {case_.pendingRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-orange-500">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {case_.statusNotes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      Latest Note:
                    </p>
                    <p className="text-sm text-gray-600">{case_.statusNotes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Created {formatDate(case_.createdAt)}
                  </span>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Full Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
