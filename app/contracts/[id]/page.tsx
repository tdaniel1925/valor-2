"use client";

import { use } from "react";
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
  documentUrls: string[];
  organization: {
    id: string;
    name: string;
    type: string;
  } | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface ContractData {
  contract: Contract;
}

export default function ContractDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery<ContractData>({
    queryKey: ["contract", id],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch contract");
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "✓";
      case "APPROVED":
        return "✓";
      case "PENDING":
        return "⏱";
      case "REJECTED":
        return "✗";
      case "INACTIVE":
        return "○";
      default:
        return "•";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contract details...</p>
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
            <p className="text-red-600">Failed to load contract details</p>
            <div className="mt-4 flex gap-3 justify-center">
              <Link
                href="/contracts"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Back to Contracts
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contract = data.contract;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <Link
                href="/contracts"
                className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
              >
                ← Back to Contracts
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {contract.carrierName}
                </h1>
                <Badge variant={getStatusVariant(contract.status)}>
                  {contract.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">{contract.productType}</p>
            </div>
            <div className="flex gap-2">
              {contract.status === "PENDING" && (
                <button className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                  Cancel Request
                </button>
              )}
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Information Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Contract Information
              </h2>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-1">
                    Carrier Name
                  </dt>
                  <dd className="text-base text-gray-900">{contract.carrierName}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-1">
                    Product Type
                  </dt>
                  <dd className="text-base text-gray-900">{contract.productType}</dd>
                </div>

                {contract.contractNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">
                      Contract Number
                    </dt>
                    <dd className="text-base font-mono font-semibold text-gray-900">
                      {contract.contractNumber}
                    </dd>
                  </div>
                )}

                {contract.commissionLevel && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">
                      Commission Level
                    </dt>
                    <dd className="text-base font-bold text-green-600">
                      {formatPercent(contract.commissionLevel)}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-1">Status</dt>
                  <dd>
                    <Badge variant={getStatusVariant(contract.status)}>
                      {contract.status}
                    </Badge>
                  </dd>
                </div>

                {contract.organization && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">
                      Organization
                    </dt>
                    <dd className="text-base text-gray-900">
                      {contract.organization.name}
                      <span className="text-sm text-gray-500 ml-2">
                        ({contract.organization.type})
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Dates Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Important Dates
              </h2>

              <dl className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <dt className="text-sm font-medium text-gray-600">
                    Requested Date
                  </dt>
                  <dd className="text-base text-gray-900">
                    {formatDate(contract.requestedAt)}
                  </dd>
                </div>

                {contract.approvedAt && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <dt className="text-sm font-medium text-gray-600">
                      Approved Date
                    </dt>
                    <dd className="text-base text-gray-900">
                      {formatDate(contract.approvedAt)}
                    </dd>
                  </div>
                )}

                {contract.effectiveDate && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <dt className="text-sm font-medium text-gray-600">
                      Effective Date
                    </dt>
                    <dd className="text-base text-gray-900">
                      {formatDate(contract.effectiveDate)}
                    </dd>
                  </div>
                )}

                {contract.expirationDate && (
                  <div className="flex justify-between items-center py-3">
                    <dt className="text-sm font-medium text-gray-600">
                      Expiration Date
                    </dt>
                    <dd className="text-base text-gray-900">
                      {formatDate(contract.expirationDate)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Documents Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Documents</h2>

              {contract.documentUrls.length > 0 ? (
                <div className="space-y-3">
                  {contract.documentUrls.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Contract Document {index + 1}
                          </p>
                          <p className="text-xs text-gray-500">{url}</p>
                        </div>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
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
                  <p className="mt-2 text-sm text-gray-500">
                    No documents uploaded yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Status Timeline
              </h2>

              <div className="space-y-4">
                {/* Requested */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-sm">✓</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Requested</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(contract.requestedAt)}
                    </p>
                  </div>
                </div>

                {/* Approved */}
                {contract.approvedAt ? (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Approved</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(contract.approvedAt)}
                      </p>
                    </div>
                  </div>
                ) : contract.status === "REJECTED" ? (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 text-sm">✗</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Rejected</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">○</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">
                        Pending Approval
                      </p>
                    </div>
                  </div>
                )}

                {/* Active */}
                {contract.status === "ACTIVE" && contract.effectiveDate ? (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Active</p>
                      <p className="text-xs text-gray-500">
                        Since {formatDate(contract.effectiveDate)}
                      </p>
                    </div>
                  </div>
                ) : (
                  contract.approvedAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">○</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">
                          Awaiting Activation
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Agent Information
              </h2>

              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-600 mb-1">Name</dt>
                  <dd className="text-sm text-gray-900">
                    {contract.user.firstName && contract.user.lastName
                      ? `${contract.user.firstName} ${contract.user.lastName}`
                      : "Not specified"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-600 mb-1">Email</dt>
                  <dd className="text-sm text-gray-900">{contract.user.email}</dd>
                </div>
              </dl>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>

              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                  Upload Document
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                  Request Amendment
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
