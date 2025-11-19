"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDate, formatPercent } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, CardContent } from "@/components/ui";
import { ContractRequestForm } from "@/components/contracts/ContractRequestForm";
import AppLayout from "@/components/layout/AppLayout";

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
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("ALL");

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
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading contracts...</p>
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
            <p className="text-red-600 dark:text-red-400">Failed to load contracts</p>
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

  // Filter contracts based on search and filters
  const filteredContracts = data.contracts.filter((contract) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      contract.carrierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.organization?.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "ALL" || contract.status === statusFilter;

    // Product type filter
    const matchesProductType =
      productTypeFilter === "ALL" || contract.productType === productTypeFilter;

    return matchesSearch && matchesStatus && matchesProductType;
  });

  const activeContracts = data.contracts.filter((c) => c.status === "ACTIVE");
  const pendingContracts = data.contracts.filter((c) => c.status === "PENDING");

  // Get unique product types for filter
  const productTypes = Array.from(
    new Set(data.contracts.map((c) => c.productType))
  ).sort();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contracts</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage your carrier appointments and contracts
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowRequestModal(true)}
              >
                + Request Contract
              </Button>
            </div>
          </div>
        </div>
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by carrier, product, contract number..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Product Type Filter */}
            <div>
              <label htmlFor="productTypeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Type
              </label>
              <select
                id="productTypeFilter"
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                <option value="ALL">All Products</option>
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || statusFilter !== "ALL" || productTypeFilter !== "ALL") && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              )}
              {productTypeFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  Product: {productTypeFilter}
                  <button
                    onClick={() => setProductTypeFilter("ALL")}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setProductTypeFilter("ALL");
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
              >
                Clear all
              </button>
            </div>
          )}
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Contracts</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {data.contracts.length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {activeContracts.length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
              {pendingContracts.length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">Carriers</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {new Set(data.contracts.map((c) => c.carrierName)).size}
            </p>
          </Card>
        </div>

        {/* Results Count */}
        {data.contracts.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredContracts.length} of {data.contracts.length} contracts
            </p>
          </div>
        )}

        {/* Contracts Grid */}
        {filteredContracts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredContracts.map((contract) => (
              <Card
                key={contract.id}
                className="p-6 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-shadow"
              >
                <CardHeader className="p-0 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {contract.carrierName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {contract.productType}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(contract.status)}>
                      {contract.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {contract.contractNumber && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Contract Number
                      </p>
                      <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {contract.contractNumber}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    {contract.commissionLevel && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Commission Level:
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatPercent(contract.commissionLevel)}
                        </span>
                      </div>
                    )}

                    {contract.organization && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Organization:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {contract.organization.name}
                        </span>
                      </div>
                    )}

                    {contract.effectiveDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Effective Date:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(contract.effectiveDate)}
                        </span>
                      </div>
                    )}

                    {contract.expirationDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Expiration Date:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(contract.expirationDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
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
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {contract.status === "PENDING" && (
                      <Button variant="danger" size="sm">
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data.contracts.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No contracts
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by requesting your first carrier contract.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => setShowRequestModal(true)}
                >
                  + Request Contract
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-12">
            <div className="text-center">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No contracts found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or filter criteria.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setProductTypeFilter("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Contracts by Product Type */}
        {data.contracts.length > 0 && (
          <Card className="mt-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
                <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{type}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {stats.count}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.active} active
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Contract Request Modal */}
        <ContractRequestForm
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
        />
      </div>
    </AppLayout>
  );
}
