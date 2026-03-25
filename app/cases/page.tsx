'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge, Card, CardHeader, CardContent } from '@/components/ui';
import AppLayout from '@/components/layout/AppLayout';
import { Search, Filter, X } from 'lucide-react';

interface Policy {
  id: string;
  policyNumber: string;
  primaryAdvisor: string;
  productName: string;
  carrierName: string;
  primaryInsured: string;
  status: string;
  statusDate: string | null;
  type: string;
  targetAmount: number | null;
  commAnnualizedPrem: number | null;
  weightedPremium: number | null;
  firstYearCommission: number | null;
  renewalCommission: number | null;
  additionalData: any;
}

interface PoliciesData {
  success: boolean;
  policies: Policy[];
  filters: {
    agents: string[];
    agencies: string[];
    carriers: string[];
    statuses: string[];
  };
  total: number;
}

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search - only search after user stops typing for 300ms
  // AND only if they've typed at least 2 characters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length === 0 || searchTerm.length >= 2) {
        setDebouncedSearchTerm(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    if (selectedAgent) params.append('agent', selectedAgent);
    if (selectedAgency) params.append('agency', selectedAgency);
    if (selectedCarrier) params.append('carrier', selectedCarrier);
    if (selectedStatus) params.append('status', selectedStatus);
    return params.toString();
  };

  const { data, isLoading, error, refetch } = useQuery<PoliciesData>({
    queryKey: ['policies', debouncedSearchTerm, selectedAgent, selectedAgency, selectedCarrier, selectedStatus],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const url = `/api/cases/policies${queryString ? `?${queryString}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch policies');
      return res.json();
    },
  });

  const getStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase();

    // Positive/completed statuses
    if (statusLower.includes('inforce') || statusLower.includes('issued') || statusLower.includes('approved')) {
      return 'success';
    }

    // Pending/in-progress statuses
    if (statusLower.includes('pending') || statusLower.includes('submitted') || statusLower.includes('await') || statusLower.includes('incomplete')) {
      return 'warning';
    }

    // Negative statuses
    if (statusLower.includes('declined') || statusLower.includes('withdrawn') || statusLower.includes('not taken') || statusLower.includes('closed')) {
      return 'danger';
    }

    // Conditional/special cases
    if (statusLower.includes('conditional') || statusLower.includes('reissue')) {
      return 'info';
    }

    // Default
    return 'default';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAgent('');
    setSelectedAgency('');
    setSelectedCarrier('');
    setSelectedStatus('');
  };

  const hasActiveFilters = searchTerm || selectedAgent || selectedAgency || selectedCarrier || selectedStatus;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading policies...</p>
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
            <p className="text-red-600 dark:text-red-400">Failed to load policies</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Policies</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View and manage all SmartOffice policies
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Policies</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {data.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Inforce</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {data.policies.filter((p) => p.status === 'INFORCE').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {data.policies.filter((p) => p.status === 'PENDING').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Premium</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(
                  data.policies.reduce((sum, p) => sum + (p.commAnnualizedPrem || 0), 0)
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by policy number, insured, agent, carrier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg border flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {[selectedAgent, selectedAgency, selectedCarrier, selectedStatus].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Agent Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Agent
                    </label>
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Agents</option>
                      {data.filters.agents.map((agent) => (
                        <option key={agent} value={agent}>
                          {agent}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Agency Filter */}
                  {data.filters.agencies.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Agency
                      </label>
                      <select
                        value={selectedAgency}
                        onChange={(e) => setSelectedAgency(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Agencies</option>
                        {data.filters.agencies.map((agency) => (
                          <option key={agency} value={agency}>
                            {agency}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Carrier Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Carrier
                    </label>
                    <select
                      value={selectedCarrier}
                      onChange={(e) => setSelectedCarrier(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Carriers</option>
                      {data.filters.carriers.map((carrier) => (
                        <option key={carrier} value={carrier}>
                          {carrier}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Statuses</option>
                      {data.filters.statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {data.policies.length} {data.policies.length === 1 ? 'policy' : 'policies'}
        </div>

        {/* Policies List */}
        {data.policies.length > 0 ? (
          <div className="space-y-4">
            {data.policies.map((policy) => (
              <Card
                key={policy.id}
                className="hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/cases/${policy.id}`}
                        className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                      >
                        {policy.policyNumber}
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {policy.primaryInsured}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(policy.status)} className="ml-2 flex-shrink-0">
                      {policy.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Agent</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {policy.primaryAdvisor}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Product</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {policy.productName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Carrier</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {policy.carrierName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Premium</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {policy.commAnnualizedPrem ? formatCurrency(policy.commAnnualizedPrem) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {policy.statusDate ? formatDate(policy.statusDate) : 'No date'}
                    </span>
                    <Link
                      href={`/cases/${policy.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      View Details →
                    </Link>
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
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                No policies found
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'No policies available in the system.'}
              </p>
              {hasActiveFilters && (
                <div className="mt-6">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
