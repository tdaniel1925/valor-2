'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Users, Upload, Search, Filter, Download, DollarSign, RefreshCw, Clock, TrendingUp, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import QuickActionCard from '@/components/smartoffice/QuickActionCard';
import SmartOfficeChat from '@/components/smartoffice/SmartOfficeChat';

interface Policy {
  id: string;
  policyNumber: string;
  primaryAdvisor: string;
  productName: string;
  carrierName: string;
  primaryInsured: string;
  type: string;
  status: string;
  commAnnualizedPrem: number | null;
  weightedPremium: number | null;
  statusDate: string | null;
}

interface Agent {
  id: string;
  fullName: string;
  email: string | null;
  phones: string | null;
  supervisor: string | null;
  npn: string | null;
  subSource: string | null;
}

interface Stats {
  totalPolicies: number;
  totalAgents: number;
  totalPremium: number;
  lastSync: string | null;
  pendingCount: number;
  thisMonthCount: number;
  topCarriers: { name: string; count: number }[];
}

export default function SmartOfficeDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'policies' | 'agents'>('policies');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPolicies: 0,
    totalAgents: 0,
    totalPremium: 0,
    lastSync: null,
    pendingCount: 0,
    thisMonthCount: 0,
    topCarriers: [],
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Get active filter from URL
  const activeFilter = searchParams.get('filter') || null;

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch data when tab changes, search happens, or filter changes
  useEffect(() => {
    if (activeTab === 'policies') {
      fetchPolicies();
    } else {
      fetchAgents();
    }
  }, [activeTab, pagination.page, activeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'policies') {
        fetchPolicies();
      } else {
        fetchAgents();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/smartoffice/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPolicies = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      // Add filter based on active quick action
      if (activeFilter === 'pending') {
        params.append('status', 'PENDING');
      } else if (activeFilter === 'this-month') {
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        params.append('dateFrom', firstDayOfMonth.toISOString());
      }

      const response = await fetch(`/api/smartoffice/policies?${params}`);
      const data = await response.json();

      if (data.success) {
        setPolicies(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/smartoffice/agents?${params}`);
      const data = await response.json();

      if (data.success) {
        setAgents(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Quick action handlers
  const handleQuickAction = (filterType: string | null) => {
    const params = new URLSearchParams(searchParams);

    if (filterType) {
      params.set('filter', filterType);
    } else {
      params.delete('filter');
    }

    // Reset to first page when applying filter
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchTerm('');

    // Update URL
    router.push(`/smartoffice?${params.toString()}`);
  };;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              SmartOffice Intelligence
            </h1>
            <p className="text-gray-600">
              View, search, and analyze your SmartOffice data
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === 'policies') fetchPolicies();
                else fetchAgents();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <Link
              href="/smartoffice/import"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Import Data
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Policies</h3>
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalPolicies.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Agents</h3>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalAgents.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Premium</h3>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.totalPremium)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Last Sync</h3>
              <div className={`w-2 h-2 rounded-full ${stats.lastSync ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {stats.lastSync ? formatDate(stats.lastSync) : 'Never'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="My Policies"
              value={stats.totalPolicies}
              icon={FileSpreadsheet}
              subtitle="View all policies"
              colorClass="text-blue-600"
              onClick={() => handleQuickAction(null)}
              isClickable={activeFilter !== null}
            />
            <QuickActionCard
              title="Pending Cases"
              value={stats.pendingCount}
              icon={Clock}
              subtitle="Policies awaiting action"
              colorClass="text-yellow-600"
              onClick={() => handleQuickAction('pending')}
            />
            <QuickActionCard
              title="This Month"
              value={stats.thisMonthCount}
              icon={TrendingUp}
              subtitle={`Since ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
              colorClass="text-green-600"
              onClick={() => handleQuickAction('this-month')}
            />
            <QuickActionCard
              title="Top Carriers"
              value={stats.topCarriers.length > 0 ? stats.topCarriers[0].name : 'N/A'}
              icon={Building2}
              subtitle={stats.topCarriers.length > 0 ? `${stats.topCarriers[0].count} policies` : 'No data'}
              colorClass="text-purple-600"
              isClickable={false}
            />
          </div>

          {/* Active Filter Badge */}
          {activeFilter && (
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <Filter className="w-4 h-4" />
                Active filter: {activeFilter === 'pending' ? 'Pending Cases' : 'This Month'}
              </span>
              <button
                onClick={() => handleQuickAction(null)}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div className="mb-8">
          <SmartOfficeChat />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => {
                  setActiveTab('policies');
                  setSearchTerm('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'policies'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Policies ({stats.totalPolicies})
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('agents');
                  setSearchTerm('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'agents'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Agents ({stats.totalAgents})
                </div>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading data...</p>
              </div>
            ) : policies.length === 0 && agents.length === 0 && !searchTerm ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Data Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Import your first SmartOffice report to get started
                </p>
                <Link
                  href="/smartoffice/import"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Import Data
                </Link>
              </div>
            ) : (
              <>
                {/* Policies Table */}
                {activeTab === 'policies' && (
                  <div className="overflow-x-auto">
                    {searching && <div className="text-center py-4 text-gray-600">Searching...</div>}
                    {!searching && policies.length === 0 ? (
                      <div className="text-center py-8 text-gray-600">
                        No policies found matching "{searchTerm}"
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Policy #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Advisor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Carrier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Insured
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Premium
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {policies.map((policy) => (
                            <tr key={policy.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {policy.policyNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {policy.primaryAdvisor}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {policy.productName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {policy.carrierName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {policy.primaryInsured}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(policy.commAnnualizedPrem)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {policy.type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  policy.status === 'INFORCE' ? 'bg-green-100 text-green-800' :
                                  policy.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {policy.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Agents Table */}
                {activeTab === 'agents' && (
                  <div className="overflow-x-auto">
                    {searching && <div className="text-center py-4 text-gray-600">Searching...</div>}
                    {!searching && agents.length === 0 ? (
                      <div className="text-center py-8 text-gray-600">
                        No agents found matching "{searchTerm}"
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Supervisor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              NPN
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {agents.map((agent) => (
                            <tr key={agent.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {agent.fullName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {agent.email || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {agent.phones ? agent.phones.split('\n')[0].substring(0, 30) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {agent.supervisor || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {agent.npn || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {agent.subSource || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
