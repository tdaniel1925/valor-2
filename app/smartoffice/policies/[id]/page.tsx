'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Save, X, DollarSign, User, Building2, Calendar, Shield, FileText } from 'lucide-react';

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
  targetAmount: number | null;
  statusDate: string | null;
  sourceFile: string | null;
  lastSyncDate: string | null;
  createdAt: string;
  updatedAt: string;
  rawData: any;
}

export default function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState<Partial<Policy>>({});

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchPolicy();
    }
  }, [id]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/smartoffice/policies/${id}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch policy');
      }

      setPolicy(data.data);
      setEditedPolicy(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/smartoffice/policies/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedPolicy),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update policy');
      }

      setPolicy(data.data);
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/smartoffice/policies/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete policy');
      }

      router.push('/smartoffice?deleted=true');
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-md p-8 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !policy) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/smartoffice" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            <h2 className="text-lg font-semibold mb-2">Error Loading Policy</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/smartoffice" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Policy Details</h1>
            <p className="text-gray-600 mt-1">Policy #{policy.policyNumber}</p>
          </div>

          {!isEditing && (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedPolicy(policy);
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
            {error}
          </div>
        )}

        {/* Policy Information */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Status Badge */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{policy.policyNumber}</h2>
                <p className="text-blue-100">{policy.productName}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                policy.status === 'INFORCE' ? 'bg-green-500 text-white' :
                policy.status === 'PENDING' ? 'bg-yellow-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                {policy.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Advisor */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4" />
                  Primary Advisor
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPolicy.primaryAdvisor || ''}
                    onChange={(e) => setEditedPolicy({ ...editedPolicy, primaryAdvisor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{policy.primaryAdvisor}</p>
                )}
              </div>

              {/* Primary Insured */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Shield className="w-4 h-4" />
                  Primary Insured
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPolicy.primaryInsured || ''}
                    onChange={(e) => setEditedPolicy({ ...editedPolicy, primaryInsured: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{policy.primaryInsured}</p>
                )}
              </div>

              {/* Carrier */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building2 className="w-4 h-4" />
                  Carrier
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPolicy.carrierName || ''}
                    onChange={(e) => setEditedPolicy({ ...editedPolicy, carrierName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{policy.carrierName}</p>
                )}
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4" />
                  Product
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPolicy.productName || ''}
                    onChange={(e) => setEditedPolicy({ ...editedPolicy, productName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{policy.productName}</p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Type</label>
                {isEditing ? (
                  <select
                    value={editedPolicy.type || ''}
                    onChange={(e) => setEditedPolicy({ ...editedPolicy, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="TERM_LIFE">Term Life</option>
                    <option value="WHOLE_LIFE">Whole Life</option>
                    <option value="UNIVERSAL_LIFE">Universal Life</option>
                    <option value="VARIABLE_LIFE">Variable Life</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <p className="text-lg text-gray-900">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {policy.type.replace('_', ' ')}
                    </span>
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                {isEditing ? (
                  <select
                    value={editedPolicy.status || ''}
                    onChange={(e) => setEditedPolicy({ ...editedPolicy, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="INFORCE">In Force</option>
                    <option value="PENDING">Pending</option>
                    <option value="LAPSED">Lapsed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                ) : (
                  <p className="text-lg text-gray-900">{policy.status}</p>
                )}
              </div>

              {/* Annualized Premium */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <DollarSign className="w-4 h-4" />
                  Annualized Premium
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedPolicy.commAnnualizedPrem || ''}
                    onChange={(e) => setEditedPolicy({ ...editedPolicy, commAnnualizedPrem: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(policy.commAnnualizedPrem)}</p>
                )}
              </div>

              {/* Weighted Premium */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <DollarSign className="w-4 h-4" />
                  Weighted Premium
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedPolicy.weightedPremium || ''}
                    onChange={(e) => setEditedPolicy({ ...editedPolicy, weightedPremium: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(policy.weightedPremium)}</p>
                )}
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <DollarSign className="w-4 h-4" />
                  Target Amount
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedPolicy.targetAmount || ''}
                    onChange={(e) => setEditedPolicy({ ...editedPolicy, targetAmount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(policy.targetAmount)}</p>
                )}
              </div>

              {/* Status Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4" />
                  Status Date
                </label>
                <p className="text-lg text-gray-900">{formatDate(policy.statusDate)}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Source File:</span>
                  <span className="ml-2 text-gray-900 font-medium">{policy.sourceFile || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="ml-2 text-gray-900 font-medium">{formatDate(policy.lastSyncDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 text-gray-900 font-medium">{formatDate(policy.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 text-gray-900 font-medium">{formatDate(policy.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
