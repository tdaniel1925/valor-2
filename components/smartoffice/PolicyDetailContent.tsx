'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Mail,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import PolicyNotes from '@/components/smartoffice/PolicyNotes';

interface PolicyNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Policy {
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
  importDate: string;
  lastSyncDate: string;
  notes: PolicyNote[];
}

interface RelatedPolicy {
  id: string;
  policyNumber: string;
  productName: string;
  status: string;
  statusDate: string | null;
}

export default function PolicyDetailContent() {
  const params = useParams();
  const router = useRouter();
  const policyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [relatedPolicies, setRelatedPolicies] = useState<RelatedPolicy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPolicyDetails();
  }, [policyId]);

  const fetchPolicyDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/smartoffice/policies/${policyId}`, { credentials: 'include' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch policy details');
      }

      if (data.success) {
        setPolicy(data.data.policy);
        setRelatedPolicies(data.data.relatedPolicies);
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
      month: 'long',
      day: 'numeric',
    });
  };

  const copyPolicyNumber = () => {
    if (policy) {
      navigator.clipboard.writeText(policy.policyNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'INFORCE':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'SUBMITTED':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'DECLINED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return null; // Skeleton in parent handles this
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Policy Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'The policy you are looking for does not exist or you do not have access to it.'}
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
                Policy #{policy.policyNumber}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {policy.productName} - {policy.carrierName}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyPolicyNumber}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2 text-sm"
                title="Copy Policy Number"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={`mailto:${policy.primaryAdvisor}?subject=Re: Policy ${policy.policyNumber}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm"
              >
                <Mail className="w-4 h-4" />
                Email Advisor
              </a>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Policy Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(policy.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(policy.status)}`}>
                  {policy.status}
                </span>
                {policy.statusDate && (
                  <span className="text-sm text-gray-500">
                    as of {formatDate(policy.statusDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Core Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Policy Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Policy Number" value={policy.policyNumber} />
                <InfoItem label="Product" value={policy.productName} />
                <InfoItem label="Carrier" value={policy.carrierName} />
                <InfoItem label="Primary Insured" value={policy.primaryInsured} />
                <InfoItem label="Primary Advisor" value={policy.primaryAdvisor} />
                <InfoItem label="Type" value={policy.type.replace('_', ' ')} />
                <InfoItem label="Status Date" value={formatDate(policy.statusDate)} />
                <InfoItem label="Last Sync" value={formatDate(policy.lastSyncDate)} />
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Financial Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Target Amount" value={formatCurrency(policy.targetAmount)} />
                <InfoItem label="Annual Premium" value={formatCurrency(policy.commAnnualizedPrem)} />
                <InfoItem label="Weighted Premium" value={formatCurrency(policy.weightedPremium)} />
                <InfoItem label="First Year Commission" value={formatCurrency(policy.firstYearCommission)} />
                <InfoItem label="Renewal Commission" value={formatCurrency(policy.renewalCommission)} />
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Timeline
              </h2>

              <div className="space-y-3">
                <TimelineItem
                  label="Imported"
                  date={formatDate(policy.importDate)}
                  icon={<FileText className="w-4 h-4" />}
                />
                {policy.statusDate && (
                  <TimelineItem
                    label={`Status: ${policy.status}`}
                    date={formatDate(policy.statusDate)}
                    icon={getStatusIcon(policy.status)}
                  />
                )}
                <TimelineItem
                  label="Last Synced"
                  date={formatDate(policy.lastSyncDate)}
                  icon={<Clock className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Notes & Related */}
          <div className="lg:col-span-1 space-y-6">
            {/* Notes */}
            <PolicyNotes
              policyId={policy.id}
              initialNotes={policy.notes}
              onNotesChange={fetchPolicyDetails}
            />

            {/* Related Policies */}
            {relatedPolicies.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Related Policies
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Other policies for {policy.primaryInsured}
                </p>

                <div className="space-y-3">
                  {relatedPolicies.map((relatedPolicy) => (
                    <Link
                      key={relatedPolicy.id}
                      href={`/smartoffice/policies/${relatedPolicy.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {relatedPolicy.policyNumber}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {relatedPolicy.productName}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(relatedPolicy.status)}`}>
                          {relatedPolicy.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
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

function TimelineItem({ label, date, icon }: { label: string; date: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-600">{date}</p>
      </div>
    </div>
  );
}
