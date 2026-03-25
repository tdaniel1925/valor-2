"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge, Button, Card, CardHeader, CardContent } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

interface AgentContract {
  id: string;
  agentId: string;
  agentName: string;
  agentEmail: string | null;
  agentNpn: string | null;
  carrierName: string;
  contractType: string;
  contractNumber: string;
  status: 'Active' | 'Pending' | 'Closed';
  rawContractText: string;
}

interface AgentContractsData {
  contracts: AgentContract[];
  filters: {
    agents: string[];
    carriers: string[];
  };
  totalContracts: number;
  filteredContracts: number;
}

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("ALL");
  const [carrierFilter, setCarrierFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length === 0 || searchTerm.length >= 2) {
        setDebouncedSearchTerm(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, error, refetch } = useQuery<AgentContractsData>({
    queryKey: ["agent-contracts", debouncedSearchTerm, agentFilter, carrierFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (agentFilter !== 'ALL') params.append('agent', agentFilter);
      if (carrierFilter !== 'ALL') params.append('carrier', carrierFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/smartoffice/agent-contracts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch agent contracts");
      return res.json();
    },
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "success";
      case "Pending":
        return "warning";
      case "Closed":
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

  // Stats from filtered data
  const contracts = data?.contracts || [];
  const activeContracts = contracts.filter((c) => c.status === "Active");
  const pendingContracts = contracts.filter((c) => c.status === "Pending");
  const closedContracts = contracts.filter((c) => c.status === "Closed");

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Agent Contracts</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                View all agent carrier appointments and contract numbers from SmartOffice
              </p>
            </div>
          </div>
        </div>
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Agent, carrier, contract#..."
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

            {/* Agent Filter */}
            <div>
              <label htmlFor="agentFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent
              </label>
              <select
                id="agentFilter"
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                <option value="ALL">All Agents</option>
                {data?.filters.agents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>

            {/* Carrier Filter */}
            <div>
              <label htmlFor="carrierFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Carrier
              </label>
              <select
                id="carrierFilter"
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                <option value="ALL">All Carriers</option>
                {data?.filters.carriers.map((carrier) => (
                  <option key={carrier} value={carrier}>
                    {carrier}
                  </option>
                ))}
              </select>
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
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchTerm || agentFilter !== "ALL" || carrierFilter !== "ALL" || statusFilter !== "ALL") && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              )}
              {agentFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  Agent: {agentFilter}
                  <button
                    onClick={() => setAgentFilter("ALL")}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              )}
              {carrierFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  Carrier: {carrierFilter}
                  <button
                    onClick={() => setCarrierFilter("ALL")}
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
              <button
                onClick={() => {
                  setSearchTerm("");
                  setAgentFilter("ALL");
                  setCarrierFilter("ALL");
                  setStatusFilter("ALL");
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
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Contracts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {data.totalContracts}
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Closed</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {closedContracts.length}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Carriers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {data.filters.carriers.length}
              </p>
            </Card>
          </div>
        )}

        {/* Results Count */}
        {data && data.totalContracts > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {data.filteredContracts} of {data.totalContracts} contracts
            </p>
          </div>
        )}

        {/* Contracts Grid */}
        {contracts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                className="p-6 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-shadow"
              >
                <CardHeader className="p-0 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {contract.carrierName}
                      </h3>
                      <Link
                        href={`/smartoffice/agents/${contract.agentId}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                      >
                        {contract.agentName}
                      </Link>
                      {contract.agentNpn && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          NPN: {contract.agentNpn}
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(contract.status)}>
                      {contract.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Contract Type
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {contract.contractType}
                    </p>
                  </div>

                  {contract.contractNumber && contract.contractNumber !== 'N/A' && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Contract Number
                      </p>
                      <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 mt-1 break-all">
                        {contract.contractNumber}
                      </p>
                    </div>
                  )}

                  {contract.agentEmail && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {contract.agentEmail}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && data.totalContracts === 0 ? (
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
                No contracts found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload agent data via SmartOffice admin panel to see contracts.
              </p>
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
                    setSearchTerm("");
                    setAgentFilter("ALL");
                    setCarrierFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Contracts by Carrier */}
        {data && data.totalContracts > 0 && (
          <Card className="mt-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Top Carriers by Contract Count
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(
                data.contracts.reduce((acc, c) => {
                  if (!acc[c.carrierName]) {
                    acc[c.carrierName] = { count: 0, active: 0 };
                  }
                  acc[c.carrierName].count++;
                  if (c.status === "Active") {
                    acc[c.carrierName].active++;
                  }
                  return acc;
                }, {} as Record<string, { count: number; active: number }>)
              )
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 8)
                .map(([carrier, stats]) => (
                  <div key={carrier} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2" title={carrier}>
                      {carrier}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
      </div>
    </AppLayout>
  );
}
