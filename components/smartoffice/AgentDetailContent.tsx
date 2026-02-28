'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  FileText,
  DollarSign,
  TrendingUp,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface Agent {
  id: string;
  fullName: string;
  email: string | null;
  phones: string | null;
  supervisor: string | null;
  npn: string | null;
  subSource: string | null;
}

interface Policy {
  id: string;
  policyNumber: string;
  productName: string;
  carrierName: string;
  primaryInsured: string;
  status: string;
  statusDate: string | null;
  commAnnualizedPrem: number | null;
}

interface Metrics {
  totalPolicies: number;
  totalPremium: number;
  avgPremium: number;
  totalCommission: number;
  statusBreakdown: Record<string, number>;
  topCarriers: { name: string; count: number }[];
  recentCount: number;
}

export default function AgentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentDetails();
  }, [agentId]);

  const fetchAgentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/smartoffice/agents/${agentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch agent details');
      }

      if (data.success) {
        setAgent(data.data.agent);
        setPolicies(data.data.policies);
        setMetrics(data.data.metrics);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INFORCE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return null; // Skeleton in parent handles this
  }

  if (error || !agent || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Agent Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'The agent you are looking for does not exist or you do not have access to it.'}
            </p>
            <Link
              href="/smartoffice"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link
            href="/smartoffice"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {agent.fullName}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {agent.subSource || 'Insurance Agent'}
              </p>
            </div>

            <div className="flex gap-2">
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              )}
              {agent.phones && (
                <a
                  href={`tel:${agent.phones.split('\n')[0]}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Agent Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Agent Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoItem label="Email" value={agent.email || '-'} />
            <InfoItem label="Phone" value={agent.phones ? agent.phones.split('\n')[0] : '-'} />
            <InfoItem label="NPN" value={agent.npn || '-'} />
            <InfoItem label="Supervisor" value={agent.supervisor || '-'} />
            <InfoItem label="Source" value={agent.subSource || '-'} />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<FileText className="w-6 h-6 text-blue-600" />}
            label="Total Policies"
            value={metrics.totalPolicies.toString()}
            subtext={`${metrics.recentCount} in last 6 months`}
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            label="Total Premium"
            value={formatCurrency(metrics.totalPremium)}
            subtext="Annualized"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            label="Avg Premium"
            value={formatCurrency(metrics.avgPremium)}
            subtext="Per policy"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6 text-yellow-600" />}
            label="Total Commission"
            value={formatCurrency(metrics.totalCommission)}
            subtext="1st year + renewal"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Status Breakdown
            </h2>

            <div className="space-y-3">
              {Object.entries(metrics.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status).replace('100', '500')}`}
                        style={{ width: `${(count / metrics.totalPolicies) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Carriers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Top Carriers
            </h2>

            <div className="space-y-3">
              {metrics.topCarriers.map((carrier, index) => (
                <div key={carrier.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{carrier.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(carrier.count / metrics.totalPolicies) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{carrier.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Policies List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Agent's Policies ({policies.length})
          </h2>

          {policies.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No policies found for this agent.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Policy #
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {policies.map((policy) => (
                    <tr
                      key={policy.id}
                      onClick={() => router.push(`/smartoffice/policies/${policy.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {policy.policyNumber}
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(policy.status)}`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(policy.statusDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{label}</h3>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  );
}
