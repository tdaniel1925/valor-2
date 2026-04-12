"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";
import Link from "next/link";

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
  // SmartOffice fields
  primaryAdvisor: string | null;
  advisorName: string | null;
  subSource: string | null;
  supervisor: string | null;
  primaryInsured: string | null;
  commAnnualizedPrem: number | null;
  premiumMode: string | null;
  checkDate: string | null;
  statusDate: string | null;
  receivable: number | null;
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
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Commission>("policyNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data, isLoading, error } = useQuery<CommissionsData>({
    queryKey: ["commissions"],
    queryFn: async () => {
      const res = await fetch("/api/commissions");
      if (!res.ok) throw new Error("Failed to fetch commissions");
      const json = await res.json(); return json.data;
    },
  });

  // Get unique policies only (first occurrence) for table display
  const uniqueCommissions = data?.commissions
    ? (() => {
        const seen = new Map<string, typeof data.commissions[0]>();
        data.commissions.forEach(c => {
          if (c.policyNumber && !seen.has(c.policyNumber)) {
            seen.set(c.policyNumber, c);
          }
        });
        return Array.from(seen.values());
      })()
    : [];

  // Filter and sort unique commissions
  const filteredAndSortedCommissions = uniqueCommissions
    .filter((commission) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        commission.policyNumber?.toLowerCase().includes(query) ||
        commission.primaryInsured?.toLowerCase().includes(query) ||
        commission.primaryAdvisor?.toLowerCase().includes(query) ||
        commission.carrier?.toLowerCase().includes(query) ||
        commission.advisorName?.toLowerCase().includes(query) ||
        commission.supervisor?.toLowerCase().includes(query) ||
        commission.case?.clientName?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

  const handleSort = (field: keyof Commission) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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

  // Calculate date ranges - using statusDate (Column H)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Get unique policies only and calculate premium totals by date
  const seenPolicies = new Set<string>();
  let totalPremiumVolume = 0;
  let monthToDatePremium = 0;
  let quarterToDatePremium = 0;
  let yearToDatePremium = 0;
  let uniquePolicyCount = 0;

  data.commissions.forEach(c => {
    if (c.policyNumber && c.commAnnualizedPrem && !seenPolicies.has(c.policyNumber)) {
      seenPolicies.add(c.policyNumber);
      totalPremiumVolume += c.commAnnualizedPrem;
      uniquePolicyCount++;

      // Filter by statusDate for time-based totals
      if (c.statusDate) {
        const statusDate = new Date(c.statusDate);

        if (statusDate >= startOfMonth) {
          monthToDatePremium += c.commAnnualizedPrem;
        }

        if (statusDate >= startOfQuarter) {
          quarterToDatePremium += c.commAnnualizedPrem;
        }

        if (statusDate >= startOfYear) {
          yearToDatePremium += c.commAnnualizedPrem;
        }
      }
    }
  });

  // Set card values based on statusDate filtering
  const monthToDate = monthToDatePremium;
  const quarterToDate = quarterToDatePremium;
  const yearToDate = yearToDatePremium;
  const sinceInception = totalPremiumVolume;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Commissions</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Track your earnings and commission payments
              </p>
            </div>
            <Link
              href="/smartoffice"
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              View in SmartOffice
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Month to Date</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {formatCurrency(monthToDate)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Quarter to Date</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {formatCurrency(quarterToDate)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Q{Math.floor(new Date().getMonth() / 3) + 1} {new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Year to Date</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatCurrency(yearToDate)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Since Inception</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {formatCurrency(sinceInception)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.commissions.length} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Premium Volume</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {formatCurrency(totalPremiumVolume)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {uniquePolicyCount} policies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
              <input
                type="text"
                placeholder="Search by policy #, client name, advisor, carrier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Found {filteredAndSortedCommissions.length} result{filteredAndSortedCommissions.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Commissions Table */}
        <Card className="mb-8 overflow-hidden">
          {filteredAndSortedCommissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th
                      onClick={() => handleSort("policyNumber")}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Policy #
                        {sortField === "policyNumber" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("primaryInsured")}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Client Name
                        {sortField === "primaryInsured" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("primaryAdvisor")}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Primary Advisor
                        {sortField === "primaryAdvisor" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Product Type
                    </th>
                    <th
                      onClick={() => handleSort("carrier")}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Carrier
                        {sortField === "carrier" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("commAnnualizedPrem")}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Premium
                        {sortField === "commAnnualizedPrem" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Status
                        {sortField === "status" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredAndSortedCommissions.map((commission) => (
                    <tr
                      key={commission.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCommission(commission)}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                        >
                          {commission.policyNumber || "—"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {commission.primaryInsured || commission.case?.clientName || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {commission.primaryAdvisor || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          —
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                          {commission.carrier}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {commission.commAnnualizedPrem
                            ? formatCurrency(commission.commAnnualizedPrem)
                            : "—"}
                        </div>
                        {commission.premiumMode && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {commission.premiumMode}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <CardContent className="text-center py-12">
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
                {searchQuery ? "No results found" : "No commissions"}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? `No commissions match "${searchQuery}". Try a different search term.`
                  : "Commission records will appear here once cases are issued."}
              </p>
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery("")}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          )}
        </Card>

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

        {/* Commission Details Modal */}
        {selectedCommission && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCommission(null)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Commission Details
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Policy #{selectedCommission.policyNumber || "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCommission(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Status Badge */}
                <div className="mb-6">
                  <Badge
                    variant={
                      selectedCommission.status === "PAID"
                        ? "success"
                        : selectedCommission.status === "PENDING"
                        ? "warning"
                        : selectedCommission.status === "DISPUTED"
                        ? "danger"
                        : "default"
                    }
                    className="text-sm"
                  >
                    {selectedCommission.status}
                  </Badge>
                </div>

                {/* Amount Highlight */}
                <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Commission Amount</p>
                  <p className="text-4xl font-bold text-blue-900 dark:text-blue-300 mt-2">
                    {formatCurrency(selectedCommission.amount)}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Client Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Primary Insured</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.primaryInsured || selectedCommission.case?.clientName || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Carrier</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.carrier}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Policy Number</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.policyNumber || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Advisor Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Advisor Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Primary Advisor</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.primaryAdvisor || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Advisor Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.advisorName || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Supervisor</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.supervisor || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sub-Source</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.subSource || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Premium Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Premium Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Annualized Premium</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.commAnnualizedPrem
                            ? formatCurrency(selectedCommission.commAnnualizedPrem)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Premium Mode</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.premiumMode || "—"}
                        </p>
                      </div>
                      {selectedCommission.receivable !== null && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Receivable</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(selectedCommission.receivable)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates & Status */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Dates</h3>
                    <div className="space-y-3">
                      {selectedCommission.checkDate && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Check Date</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(selectedCommission.checkDate)}
                          </p>
                        </div>
                      )}
                      {selectedCommission.statusDate && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Status Date</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(selectedCommission.statusDate)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Commission Period</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(selectedCommission.periodStart)} - {formatDate(selectedCommission.periodEnd)}
                        </p>
                      </div>
                      {selectedCommission.paidAt && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Paid At</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(selectedCommission.paidAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Commission Details */}
                {(selectedCommission.percentage || selectedCommission.splitAmount) && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Additional Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Commission Type</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedCommission.type.replace(/_/g, " ")}
                        </p>
                      </div>
                      {selectedCommission.percentage && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Percentage</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {(selectedCommission.percentage * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                      {selectedCommission.splitAmount && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Split Amount</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(selectedCommission.splitAmount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <Button
                  onClick={() => setSelectedCommission(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
