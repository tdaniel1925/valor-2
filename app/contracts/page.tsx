"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDate, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface Contract {
  id: string;
  carrierName: string;
  productType: string;
  contractNumber: string | null;
  commissionLevel: number | null;
  status: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  requestedAt: string;
  approvedAt: string | null;
  organization: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface ContractsData {
  contracts: Contract[];
}

export default function ContractsPage() {
  const { data, isLoading, error } = useQuery<ContractsData>({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await fetch("/api/contracts");
      if (!res.ok) throw new Error("Failed to fetch contracts");
      return res.json();
    },
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "APPROVED":
        return "info";
      case "PENDING":
        return "warning";
      case "REJECTED":
      case "INACTIVE":
        return "danger";
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
            <p className="mt-4 text-gray-600">Loading contracts...</p>
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
            <p className="text-red-600">Failed to load contracts</p>
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

  const activeContracts = data.contracts.filter((c) => c.status === "ACTIVE");
  const pendingContracts = data.contracts.filter((c) => c.status === "PENDING");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your carrier appointments and contracts
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
                + Request Contract
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
            <p className="text-sm font-medium text-gray-600">Total Contracts</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.contracts.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {activeContracts.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {pendingContracts.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Carriers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {new Set(data.contracts.map((c) => c.carrierName)).size}
            </p>
          </div>
        </div>

        {/* Contracts Grid */}
        {data.contracts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.contracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {contract.carrierName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {contract.productType}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(contract.status)}>
                    {contract.status}
                  </Badge>
                </div>

                {contract.contractNumber && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600">
                      Contract Number
                    </p>
                    <p className="text-sm font-mono font-semibold text-gray-900 mt-1">
                      {contract.contractNumber}
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  {contract.commissionLevel && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Commission Level:
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {formatPercent(contract.commissionLevel)}
                      </span>
                    </div>
                  )}

                  {contract.organization && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Organization:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {contract.organization.name}
                      </span>
                    </div>
                  )}

                  {contract.effectiveDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Effective Date:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formatDate(contract.effectiveDate)}
                      </span>
                    </div>
                  )}

                  {contract.expirationDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Expiration Date:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formatDate(contract.expirationDate)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Requested {formatDate(contract.requestedAt)}
                    </span>
                    {contract.approvedAt && (
                      <span>
                        Approved {formatDate(contract.approvedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                    View Details
                  </button>
                  {contract.status === "PENDING" && (
                    <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12">
            <div className="text-center">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No contracts
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by requesting your first carrier contract.
              </p>
              <div className="mt-6">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + Request Contract
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contracts by Product Type */}
        {data.contracts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contracts by Product Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(
                data.contracts.reduce((acc, c) => {
                  if (!acc[c.productType]) {
                    acc[c.productType] = { count: 0, active: 0 };
                  }
                  acc[c.productType].count++;
                  if (c.status === "ACTIVE") {
                    acc[c.productType].active++;
                  }
                  return acc;
                }, {} as Record<string, { count: number; active: number }>)
              ).map(([type, stats]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">{type}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.count}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.active} active
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
