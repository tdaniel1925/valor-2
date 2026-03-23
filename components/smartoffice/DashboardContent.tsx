'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Users, Upload, Search, Filter, Download, DollarSign, RefreshCw, Clock, TrendingUp, Building2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import QuickActionCard from '@/components/smartoffice/QuickActionCard';
import SmartOfficeChat from '@/components/smartoffice/SmartOfficeChat';
import FilterPanel, { FilterValues } from '@/components/smartoffice/FilterPanel';
import ExportButton from '@/components/smartoffice/ExportButton';
import PremiumTrendChart from '@/components/smartoffice/charts/PremiumTrendChart';
import CarrierBreakdownChart from '@/components/smartoffice/charts/CarrierBreakdownChart';
import StatusFunnelChart from '@/components/smartoffice/charts/StatusFunnelChart';
import AgentPerformanceChart from '@/components/smartoffice/charts/AgentPerformanceChart';
import SavedFilters from '@/components/smartoffice/SavedFilters';
import SaveFilterDialog from '@/components/smartoffice/SaveFilterDialog';
import InboundEmailCard from '@/components/smartoffice/InboundEmailCard';

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

interface DashboardContentProps {
  inboundEmailAddress: string;
}

export default function DashboardContent({ inboundEmailAddress }: DashboardContentProps) {
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Get active filter from URL
  const activeFilter = searchParams.get('filter') || null;

  // Get advanced filters from URL
  const getFiltersFromURL = (): FilterValues => {
    const filters: FilterValues = {};

    const statusParam = searchParams.get('status');
    if (statusParam) filters.status = statusParam.split(',');

    const carrierParam = searchParams.get('carrier');
    if (carrierParam) filters.carrier = carrierParam.split(',');

    const typeParam = searchParams.get('type');
    if (typeParam) filters.type = typeParam.split(',');

    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) filters.dateFrom = dateFrom;

    const dateTo = searchParams.get('dateTo');
    if (dateTo) filters.dateTo = dateTo;

    const premiumMin = searchParams.get('premiumMin');
    if (premiumMin) filters.premiumMin = Number(premiumMin);

    const premiumMax = searchParams.get('premiumMax');
    if (premiumMax) filters.premiumMax = Number(premiumMax);

    return filters;
  };

  const advancedFilters = getFiltersFromURL();

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
  }, [activeTab, pagination.page, activeFilter, searchParams]);

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
      const response = await fetch('/api/smartoffice/stats', {
        credentials: 'include',
      });
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

      // Add advanced filters
      if (advancedFilters.status && advancedFilters.status.length > 0) {
        params.append('statusList', advancedFilters.status.join(','));
      }
      if (advancedFilters.carrier && advancedFilters.carrier.length > 0) {
        params.append('carrierList', advancedFilters.carrier.join(','));
      }
      if (advancedFilters.type && advancedFilters.type.length > 0) {
        params.append('typeList', advancedFilters.type.join(','));
      }
      if (advancedFilters.dateFrom) {
        params.append('dateFrom', advancedFilters.dateFrom);
      }
      if (advancedFilters.dateTo) {
        params.append('dateTo', advancedFilters.dateTo);
      }
      if (advancedFilters.premiumMin) {
        params.append('premiumMin', advancedFilters.premiumMin.toString());
      }
      if (advancedFilters.premiumMax) {
        params.append('premiumMax', advancedFilters.premiumMax.toString());
      }

      const response = await fetch(`/api/smartoffice/policies?${params}`, {
        credentials: 'include',
      });
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

      const response = await fetch(`/api/smartoffice/agents?${params}`, {
        credentials: 'include',
      });
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

    // Clear advanced filters when using quick actions
    params.delete('statusList');
    params.delete('carrierList');
    params.delete('typeList');
    params.delete('dateFrom');
    params.delete('dateTo');
    params.delete('premiumMin');
    params.delete('premiumMax');

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
  };

  // Advanced filter handlers
  const handleApplyFilters = (filters: FilterValues) => {
    const params = new URLSearchParams();

    // Clear quick action filter
    params.delete('filter');

    if (filters.status && filters.status.length > 0) {
      params.set('status', filters.status.join(','));
    }
    if (filters.carrier && filters.carrier.length > 0) {
      params.set('carrier', filters.carrier.join(','));
    }
    if (filters.type && filters.type.length > 0) {
      params.set('type', filters.type.join(','));
    }
    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo);
    }
    if (filters.premiumMin) {
      params.set('premiumMin', filters.premiumMin.toString());
    }
    if (filters.premiumMax) {
      params.set('premiumMax', filters.premiumMax.toString());
    }

    setPagination(prev => ({ ...prev, page: 1 }));
    router.push(`/smartoffice?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push('/smartoffice');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getCurrentFilters = () => {
    const filters: Record<string, any> = {};
    const statusParam = searchParams.get('status');
    if (statusParam) filters.status = statusParam;
    const carrierParam = searchParams.get('carrier');
    if (carrierParam) filters.carrier = carrierParam;
    const typeParam = searchParams.get('type');
    if (typeParam) filters.type = typeParam;
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) filters.dateFrom = dateFrom;
    const dateTo = searchParams.get('dateTo');
    if (dateTo) filters.dateTo = dateTo;
    const premiumMin = searchParams.get('premiumMin');
    if (premiumMin) filters.premiumMin = premiumMin;
    const premiumMax = searchParams.get('premiumMax');
    if (premiumMax) filters.premiumMax = premiumMax;
    return filters;
  };

  const handleSaveFilter = async (name: string, isDefault: boolean) => {
    const response = await fetch('/api/smartoffice/saved-filters', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        filters: getCurrentFilters(),
        isDefault,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to save filter');
    }

    // Reload page to refresh SavedFilters component
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-white font-medium">SmartOffice Intelligence</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                SmartOffice Intelligence
              </h1>
              <p className="text-lg text-blue-100">
                AI-powered insights for your insurance data
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  fetchStats();
                  if (activeTab === 'policies') fetchPolicies();
                  else fetchAgents();
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 inline-flex items-center gap-2 backdrop-blur-sm border border-white/20"
                aria-label="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Refresh</span>
              </button>
              <Link
                href="/smartoffice/import"
                className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 inline-flex items-center gap-2 font-semibold shadow-lg"
                aria-label="Import SmartOffice data"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">Import Data</span>
                <span className="sm:hidden">Import</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Inbound Email Address */}
        <div className="mb-8">
          <InboundEmailCard emailAddress={inboundEmailAddress} />
        </div>

        {/* Stats Cards with Gradients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Policies */}
          <div data-testid="stat-card-policies" className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <FileSpreadsheet className="w-full h-full" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <span className="text-white/70 text-xs font-semibold">+12% ↑</span>
              </div>
              <h3 className="text-sm font-medium text-blue-100 mb-1">Total Policies</h3>
              <p className="text-4xl font-bold text-white">{stats.totalPolicies.toLocaleString()}</p>
            </div>
          </div>

          {/* Total Agents */}
          <div data-testid="stat-card-agents" className="group relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <Users className="w-full h-full" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-white/70 text-xs font-semibold">+5% ↑</span>
              </div>
              <h3 className="text-sm font-medium text-green-100 mb-1">Total Agents</h3>
              <p className="text-4xl font-bold text-white">{stats.totalAgents.toLocaleString()}</p>
            </div>
          </div>

          {/* Total Premium */}
          <div data-testid="stat-card-premium" className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <DollarSign className="w-full h-full" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-white/70 text-xs font-semibold">+18% ↑</span>
              </div>
              <h3 className="text-sm font-medium text-purple-100 mb-1">Total Premium</h3>
              <p className="text-4xl font-bold text-white">{formatCurrency(stats.totalPremium)}</p>
            </div>
          </div>

          {/* Last Sync */}
          <div data-testid="stat-card-sync" className="group relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <Clock className="w-full h-full" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className={`w-3 h-3 rounded-full ${stats.lastSync ? 'bg-green-300' : 'bg-red-300'} shadow-lg`}></div>
              </div>
              <h3 className="text-sm font-medium text-orange-100 mb-1">Last Sync</h3>
              <p className="text-2xl font-bold text-white">
                {stats.lastSync ? formatDate(stats.lastSync) : 'Never synced'}
              </p>
            </div>
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

        {/* Charts & Visualizations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Insights & Analytics</h2>
            <p className="text-sm text-gray-600">Real-time performance metrics</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 min-h-[400px]">
              <PremiumTrendChart />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 min-h-[400px]">
              <CarrierBreakdownChart />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 min-h-[400px]">
              <StatusFunnelChart />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 min-h-[400px]">
              <AgentPerformanceChart />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="border-b border-gray-100">
            <div className="flex gap-2 px-8 bg-gradient-to-r from-gray-50 to-white">
              <button
                onClick={() => {
                  setActiveTab('policies');
                  setSearchTerm('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                data-active={activeTab === 'policies'}
                className={`py-5 px-6 border-b-4 font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'policies'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Policies</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                    {stats.totalPolicies}
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('agents');
                  setSearchTerm('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                data-active={activeTab === 'agents'}
                className={`py-5 px-6 border-b-4 font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'agents'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>Agents</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                    {stats.totalAgents}
                  </span>
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
              <SavedFilters />
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={Object.keys(getCurrentFilters()).length === 0}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Save current filter"
              >
                <Save className="w-4 h-4" />
                Save Filter
              </button>
              <FilterPanel
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                initialFilters={advancedFilters}
              />
              <ExportButton
                exportType={activeTab}
                currentFilters={searchParams}
                disabled={loading}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {loading ? (
              <div className="space-y-4">
                {/* Loading skeleton */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : policies.length === 0 && agents.length === 0 && !searchTerm ? (
              <div className="text-center py-12 px-4">
                <FileSpreadsheet className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                  No Data Yet
                </h3>
                <p className="text-sm md:text-base text-gray-600 mb-6 max-w-md mx-auto">
                  Import your first SmartOffice report to get started with AI-powered insights
                </p>
                <Link
                  href="/smartoffice/import"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                >
                  Import Data
                </Link>
              </div>
            ) : (
              <>
                {/* Policies Table */}
                {activeTab === 'policies' && (
                  <div className="overflow-x-auto">
                    {searching && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Searching...</span>
                        </div>
                      </div>
                    )}
                    {!searching && policies.length === 0 && searchTerm ? (
                      <div className="text-center py-12 px-4">
                        <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-base font-medium text-gray-900 mb-2">
                          No Results Found
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          No policies found matching "{searchTerm}"
                        </p>
                        <p className="text-xs text-gray-500">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    ) : !searching && policies.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-base font-medium text-gray-900 mb-2">
                          No Data Yet
                        </h3>
                        <p className="text-sm text-gray-600">
                          No policies available
                        </p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Policy #
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Advisor
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Carrier
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Insured
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Premium
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {policies.map((policy, idx) => (
                            <tr
                              key={policy.id}
                              onClick={() => router.push(`/smartoffice/policies/${policy.id}`)}
                              className={`cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:shadow-md hover:scale-[1.01] ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                              }`}
                            >
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
                    {searching && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Searching...</span>
                        </div>
                      </div>
                    )}
                    {!searching && agents.length === 0 && searchTerm ? (
                      <div className="text-center py-12 px-4">
                        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-base font-medium text-gray-900 mb-2">
                          No Results Found
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          No agents found matching "{searchTerm}"
                        </p>
                        <p className="text-xs text-gray-500">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    ) : !searching && agents.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-base font-medium text-gray-900 mb-2">
                          No Data Yet
                        </h3>
                        <p className="text-sm text-gray-600">
                          No agents available
                        </p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Phone
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Supervisor
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              NPN
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {agents.map((agent, idx) => (
                            <tr
                              key={agent.id}
                              onClick={() => router.push(`/smartoffice/agents/${agent.id}`)}
                              className={`cursor-pointer transition-all duration-200 hover:bg-green-50 hover:shadow-md hover:scale-[1.01] ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                              }`}
                            >
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

      <SaveFilterDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        currentFilters={getCurrentFilters()}
        onSave={handleSaveFilter}
      />
    </div>
  );
}
