"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge, Button, Card, CardHeader, CardContent } from "@/components/ui";
import { Search, Filter, X, ExternalLink, Mail, Phone } from "lucide-react";

interface SmartOfficeAgent {
  id: string;
  lastName: string;
  firstName: string;
  fullName: string;
  email: string | null;
  phones: string | null;
  supervisor: string | null;
  subSource: string | null;
  npn: string | null;
  contractList: string | null;
}

interface AgentsResponse {
  success: boolean;
  data: SmartOfficeAgent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function SmartOfficeAgentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [selectedSubSource, setSelectedSubSource] = useState("");
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
    if (selectedSupervisor) params.set("supervisor", selectedSupervisor);
    if (selectedSubSource) params.set("subSource", selectedSubSource);

    return params.toString();
  }, [currentPage, rowsPerPage, debouncedSearchTerm, selectedSupervisor, selectedSubSource]);

  const { data, isLoading, error } = useQuery<AgentsResponse>({
    queryKey: ["smartoffice-agents", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/smartoffice/agents?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });

  // Get unique filter values from data
  const filterOptions = useMemo(() => {
    if (!data?.data) return { supervisors: [], subSources: [] };

    const supervisors = Array.from(new Set(data.data.map(a => a.supervisor).filter(Boolean))).sort();
    const subSources = Array.from(new Set(data.data.map(a => a.subSource).filter(Boolean))).sort();

    return { supervisors, subSources };
  }, [data]);

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedSupervisor("");
    setSelectedSubSource("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || selectedSupervisor || selectedSubSource;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              SmartOffice Agents
            </h1>
            <Link href="/smartoffice">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all agents/advisors imported from SmartOffice
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
                  placeholder="Search agents by name, email, NPN..."
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
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supervisor
                  </label>
                  <select
                    value={selectedSupervisor}
                    onChange={(e) => {
                      setSelectedSupervisor(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Supervisors</option>
                    {filterOptions.supervisors.map((supervisor) => (
                      <option key={supervisor} value={supervisor}>
                        {supervisor}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sub Source
                  </label>
                  <select
                    value={selectedSubSource}
                    onChange={(e) => {
                      setSelectedSubSource(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Sub Sources</option>
                    {filterOptions.subSources.map((subSource) => (
                      <option key={subSource} value={subSource}>
                        {subSource}
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
                {isLoading ? "Loading..." : `${data?.pagination.total || 0} Agents`}
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
                Loading agents...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600 dark:text-red-400">
                Error loading agents. Please try again.
              </div>
            ) : data?.data.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No agents found. Try adjusting your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        NPN
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Supervisor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sub Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contracts
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {data?.data.map((agent) => (
                      <tr
                        key={agent.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {agent.fullName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex flex-col gap-1">
                            {agent.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <a
                                  href={`mailto:${agent.email}`}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {agent.email}
                                </a>
                              </div>
                            )}
                            {agent.phones && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span className="text-xs">{agent.phones.substring(0, 50)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {agent.npn || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {agent.supervisor || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {agent.subSource || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {agent.contractList ? (
                            <span className="text-xs" title={agent.contractList}>
                              {agent.contractList.substring(0, 30)}
                              {agent.contractList.length > 30 && "..."}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <Link
                            href={`/smartoffice/agents/${agent.id}`}
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
                      ({data.pagination.total} total agents)
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
