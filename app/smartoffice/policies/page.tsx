"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge, Button, Card, CardHeader, CardContent } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Filter, X, ExternalLink } from "lucide-react";

interface SmartOfficePolicy {
  id: string;
  policyNumber: string;
  primaryAdvisor: string;
  productName: string;
  carrierName: string;
  primaryInsured: string;
  statusDate: string | null;
  type: string;
  status: string;
  targetAmount: number | null;
  commAnnualizedPrem: number | null;
  weightedPremium: number | null;
  firstYearCommission: number | null;
  renewalCommission: number | null;
}

interface PoliciesResponse {
  success: boolean;
  data: SmartOfficePolicy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function SmartOfficePoliciesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAdvisor, setSelectedAdvisor] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length === 0 || searchTerm.length >= 2) {
        setDebouncedSearchTerm(searchTerm);
        setCurrentPage(1); // Reset to first page on search
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    params.set("limit", rowsPerPage.toString());

    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (selectedCarrier) params.set("carrier", selectedCarrier);
    if (selectedType && selectedType !== "ALL") params.set("type", selectedType);
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedAdvisor) params.set("advisor", selectedAdvisor);

    return params.toString();
  }, [currentPage, rowsPerPage, debouncedSearchTerm, selectedCarrier, selectedType, selectedStatus, selectedAdvisor]);

  const { data, isLoading, error } = useQuery<PoliciesResponse>({
    queryKey: ["smartoffice-policies", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/smartoffice/policies?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch policies");
      return res.json();
    },
  });

  // Get unique filter values from data
  const filterOptions = useMemo(() => {
    if (!data?.data) return { carriers: [], types: [], statuses: [], advisors: [] };

    const carriers = Array.from(new Set(data.data.map(p => p.carrierName).filter(Boolean))).sort();
    const types = Array.from(new Set(data.data.map(p => p.type).filter(Boolean))).sort();
    const statuses = Array.from(new Set(data.data.map(p => p.status).filter(Boolean))).sort();
    const advisors = Array.from(new Set(data.data.map(p => p.primaryAdvisor).filter(Boolean))).sort();

    return { carriers, types, statuses, advisors };
  }, [data]);

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedCarrier("");
    setSelectedType("");
    setSelectedStatus("");
    setSelectedAdvisor("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || selectedCarrier || selectedType || selectedStatus || selectedAdvisor;

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("inforce") || s.includes("active")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (s.includes("pending") || s.includes("submitted")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (s.includes("declined") || s.includes("withdrawn")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (s.includes("issued") || s.includes("approved")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              SmartOffice Policies
            </h1>
            <Link href="/smartoffice">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all policies imported from SmartOffice
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search policies, insured, advisor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant={showFilters ? "primary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-1 bg-blue-600 text-white">
                    Active
                  </Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Carrier
                  </label>
                  <select
                    value={selectedCarrier}
                    onChange={(e) => {
                      setSelectedCarrier(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Carriers</option>
                    {filterOptions.carriers.map((carrier) => (
                      <option key={carrier} value={carrier}>
                        {carrier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    {filterOptions.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    {filterOptions.statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Advisor
                  </label>
                  <select
                    value={selectedAdvisor}
                    onChange={(e) => {
                      setSelectedAdvisor(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Advisors</option>
                    {filterOptions.advisors.map((advisor) => (
                      <option key={advisor} value={advisor}>
                        {advisor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? "Loading..." : `${data?.pagination.total || 0} Policies`}
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Loading policies...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600 dark:text-red-400">
                Error loading policies. Please try again.
              </div>
            ) : data?.data.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No policies found. Try adjusting your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Policy Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Primary Insured
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Advisor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Carrier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Premium
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {data?.data.map((policy) => (
                      <tr
                        key={policy.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {policy.policyNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {policy.primaryInsured}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {policy.primaryAdvisor}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {policy.carrierName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {policy.productName}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="outline">{policy.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(policy.status)}`}>
                            {policy.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                          {policy.commAnnualizedPrem
                            ? formatCurrency(policy.commAnnualizedPrem)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <Link
                            href={`/smartoffice/policies/${policy.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page {data.pagination.page} of {data.pagination.totalPages}
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      ({data.pagination.total} total policies)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={currentPage === data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
