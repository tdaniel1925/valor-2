'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge, Card, CardHeader, CardContent } from '@/components/ui';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, ChevronDown, ChevronUp, FileText, DollarSign, User, Building2, Calendar, Info } from 'lucide-react';

interface PolicyDetail {
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
  rawData: any;
  sourceFile: string | null;
  importDate: string;
  lastSyncDate: string;
  createdAt: string;
  updatedAt: string;
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const policyId = params.id as string;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    financial: true,
    metadata: false,
    raw: false,
  });

  const { data: policy, isLoading, error } = useQuery<PolicyDetail>({
    queryKey: ['policy', policyId],
    queryFn: async () => {
      const res = await fetch(`/api/cases/policies/${policyId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch policy');
      const result = await res.json();
      return result.policy;
    },
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading policy details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !policy) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Failed to load policy</p>
            <button
              onClick={() => router.push('/cases')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Policies
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const sections: Section[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: FileText,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Policy Number
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {policy.policyNumber}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Primary Insured
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {policy.primaryInsured}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Product Name
            </label>
            <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
              {policy.productName}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Product Type
            </label>
            <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
              {policy.type}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Carrier
            </label>
            <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
              {policy.carrierName}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Primary Advisor
            </label>
            <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
              {policy.primaryAdvisor}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Status
            </label>
            <div className="mt-1">
              <Badge variant={getStatusVariant(policy.status)}>
                {policy.status}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Status Date
            </label>
            <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
              {policy.statusDate ? formatDate(policy.statusDate) : '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'financial',
      title: 'Financial Information',
      icon: DollarSign,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Target Amount
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {policy.targetAmount ? formatCurrency(policy.targetAmount) : '—'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Annualized Premium
            </label>
            <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
              {policy.commAnnualizedPrem ? formatCurrency(policy.commAnnualizedPrem) : '—'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Weighted Premium
            </label>
            <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
              {policy.weightedPremium ? formatCurrency(policy.weightedPremium) : '—'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              First Year Commission
            </label>
            <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
              {policy.firstYearCommission ? formatCurrency(policy.firstYearCommission) : '—'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Renewal Commission
            </label>
            <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
              {policy.renewalCommission ? formatCurrency(policy.renewalCommission) : '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'metadata',
      title: 'Import & Sync Information',
      icon: Info,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Source File
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-all">
              {policy.sourceFile || '—'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Import Date
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(policy.importDate)}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Last Sync Date
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(policy.lastSyncDate)}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Created At
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(policy.createdAt)}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'raw',
      title: 'Raw Data',
      icon: Building2,
      content: (
        <div className="space-y-4">
          {policy.additionalData && Object.keys(policy.additionalData).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Additional Data
              </h4>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(policy.additionalData, null, 2)}
              </pre>
            </div>
          )}
          {policy.rawData && Object.keys(policy.rawData).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Original Import Data
              </h4>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(policy.rawData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Policies
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {policy.policyNumber}
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {policy.primaryInsured}
              </p>
            </div>
            <Badge variant={getStatusVariant(policy.status)} className="text-base px-4 py-2">
              {policy.status}
            </Badge>
          </div>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id];

            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -mx-6 -my-4 px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {section.title}
                      </h2>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                      {section.content}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Notes Section */}
        {policy.notes && policy.notes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Notes
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policy.notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{note.content}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
