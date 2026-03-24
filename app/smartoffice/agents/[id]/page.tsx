'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Save, X, User, Mail, Phone, Users, FileText, Calendar } from 'lucide-react';

interface Agent {
  id: string;
  lastName: string;
  firstName: string;
  fullName: string;
  email: string | null;
  phones: string | null;
  addresses: string | null;
  supervisor: string | null;
  subSource: string | null;
  contractList: string | null;
  ssn: string | null;
  npn: string | null;
  sourceFile: string | null;
  lastSyncDate: string | null;
  createdAt: string;
  updatedAt: string;
  rawData: any;
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedAgent, setEditedAgent] = useState<Partial<Agent>>({});

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchAgent();
    }
  }, [id]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/smartoffice/agents/${id}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch agent');
      }

      setAgent(data.data);
      setEditedAgent(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/smartoffice/agents/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedAgent),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update agent');
      }

      setAgent(data.data);
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/smartoffice/agents/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete agent');
      }

      router.push('/smartoffice?deleted=true');
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
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

  if (error && !agent) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/smartoffice" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            <h2 className="text-lg font-semibold mb-2">Error Loading Agent</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
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
            <h1 className="text-3xl font-bold text-gray-900">Agent Details</h1>
            <p className="text-gray-600 mt-1">{agent.fullName}</p>
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
                  setEditedAgent(agent);
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

        {/* Agent Information */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{agent.fullName}</h2>
                <p className="text-green-100">{agent.email || 'No email'}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4" />
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAgent.firstName || ''}
                    onChange={(e) => setEditedAgent({ ...editedAgent, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{agent.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4" />
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAgent.lastName || ''}
                    onChange={(e) => setEditedAgent({ ...editedAgent, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{agent.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedAgent.email || ''}
                    onChange={(e) => setEditedAgent({ ...editedAgent, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{agent.email || '-'}</p>
                )}
              </div>

              {/* NPN */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4" />
                  NPN
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAgent.npn || ''}
                    onChange={(e) => setEditedAgent({ ...editedAgent, npn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{agent.npn || '-'}</p>
                )}
              </div>

              {/* Supervisor */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4" />
                  Supervisor
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAgent.supervisor || ''}
                    onChange={(e) => setEditedAgent({ ...editedAgent, supervisor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{agent.supervisor || '-'}</p>
                )}
              </div>

              {/* Sub Source */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4" />
                  Source
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAgent.subSource || ''}
                    onChange={(e) => setEditedAgent({ ...editedAgent, subSource: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{agent.subSource || '-'}</p>
                )}
              </div>

              {/* Phones */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Phone className="w-4 h-4" />
                  Phone Numbers
                </label>
                {isEditing ? (
                  <textarea
                    value={editedAgent.phones || ''}
                    onChange={(e) => setEditedAgent({ ...editedAgent, phones: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="One phone number per line"
                  />
                ) : (
                  <p className="text-lg text-gray-900 whitespace-pre-wrap">{agent.phones || '-'}</p>
                )}
              </div>

              {/* Addresses */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Addresses</label>
                {isEditing ? (
                  <textarea
                    value={editedAgent.addresses || ''}
                    onChange={(e) => setEditedAgent({ ...editedAgent, addresses: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="One address per line"
                  />
                ) : (
                  <p className="text-lg text-gray-900 whitespace-pre-wrap">{agent.addresses || '-'}</p>
                )}
              </div>

              {/* Contract List */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Contract List</label>
                {isEditing ? (
                  <textarea
                    value={editedAgent.contractList || ''}
                    onChange={(e) => setEditedAgent({ ...editedAgent, contractList: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900 whitespace-pre-wrap">{agent.contractList || '-'}</p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Source File:</span>
                  <span className="ml-2 text-gray-900 font-medium">{agent.sourceFile || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="ml-2 text-gray-900 font-medium">{formatDate(agent.lastSyncDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 text-gray-900 font-medium">{formatDate(agent.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 text-gray-900 font-medium">{formatDate(agent.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
