"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

interface Integration {
  name: string;
  displayName: string;
  enabled: boolean;
  configured: boolean;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  baseUrl?: string;
  timeout: number;
  retryAttempts: number;
  validation: {
    valid: boolean;
    errors: string[];
  };
}

interface IntegrationsData {
  integrations: Integration[];
  summary: {
    total: number;
    enabled: number;
    configured: number;
    needsConfiguration: number;
  };
}

export default function AdminIntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const { data, isLoading, error } = useQuery<IntegrationsData>({
    queryKey: ["admin-integrations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/integrations");
      if (!res.ok) throw new Error("Failed to fetch integrations");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusVariant = (integration: Integration) => {
    if (!integration.enabled) return "default";
    if (integration.configured && integration.validation.valid) return "success";
    if (integration.enabled && !integration.configured) return "warning";
    if (integration.validation.errors.length > 0) return "danger";
    return "default";
  };

  const getStatusText = (integration: Integration) => {
    if (!integration.enabled) return "Disabled";
    if (integration.configured && integration.validation.valid) return "Ready";
    if (integration.enabled && !integration.configured) return "Needs Config";
    if (integration.validation.errors.length > 0) return "Error";
    return "Unknown";
  };

  const handleConfigureClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowConfigModal(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading integrations...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">Failed to load integrations</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  API Integrations
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Manage third-party API connections and credentials
                </p>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ← Back to Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Integrations
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {data.summary.total}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enabled</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {data.summary.enabled}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Configured</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {data.summary.configured}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Needs Configuration
              </p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {data.summary.needsConfiguration}
              </p>
            </div>
          </div>

          {/* Integrations List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Integration Status
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure API keys and credentials for third-party services
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Integration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credentials
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Configuration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.integrations.map((integration) => (
                    <tr key={integration.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {integration.displayName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {integration.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusVariant(integration)}>
                          {getStatusText(integration)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {integration.hasApiKey && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="h-4 w-4 text-green-500 dark:text-green-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-xs">API Key</span>
                            </div>
                          )}
                          {integration.hasApiSecret && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="h-4 w-4 text-green-500 dark:text-green-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-xs">API Secret</span>
                            </div>
                          )}
                          {!integration.hasApiKey && !integration.hasApiSecret && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              No credentials
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div>Timeout: {integration.timeout}ms</div>
                          <div>Retries: {integration.retryAttempts}</div>
                          {integration.baseUrl && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xs">
                              {integration.baseUrl}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleConfigureClick(integration)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation Errors Section */}
          {data.integrations.some((i) => i.validation.errors.length > 0) && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-300">
                  Configuration Errors
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {data.integrations
                  .filter((i) => i.validation.errors.length > 0)
                  .map((integration) => (
                    <div
                      key={integration.name}
                      className="border border-red-200 dark:border-red-800 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {integration.displayName}
                      </h3>
                      <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
                        {integration.validation.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Environment Variables Required
                </h3>
                <div className="mt-2 text-sm text-blue-800 dark:text-blue-400">
                  <p>
                    API credentials are configured through environment variables for
                    security. To enable an integration:
                  </p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>
                      Set <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
                        INTEGRATION_NAME_ENABLED=true
                      </code>
                    </li>
                    <li>
                      Add API credentials:{" "}
                      <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
                        INTEGRATION_NAME_API_KEY=your_key
                      </code>
                    </li>
                    <li>Restart the application to apply changes</li>
                  </ol>
                  <p className="mt-2">
                    Example:{" "}
                    <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
                      WINFLEX_ENABLED=true
                    </code>{" "}
                    and{" "}
                    <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
                      WINFLEX_API_KEY=abc123
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Configuration Modal */}
        {showConfigModal && selectedIntegration && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity"
                onClick={() => setShowConfigModal(false)}
              />
              <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all">
                <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Configure {selectedIntegration.displayName}
                    </h3>
                    <button
                      onClick={() => setShowConfigModal(false)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <svg
                        className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                          Security Notice
                        </h4>
                        <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
                          API credentials must be configured through environment
                          variables (.env.local file) for security reasons. This
                          interface displays configuration status only.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Environment Variables Required:
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm space-y-2">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            {selectedIntegration.name.toUpperCase()}_ENABLED=
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">true</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            {selectedIntegration.name.toUpperCase()}_API_KEY=
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">your_api_key_here</span>
                        </div>
                        {selectedIntegration.hasApiSecret && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {selectedIntegration.name.toUpperCase()}_API_SECRET=
                            </span>
                            <span className="text-blue-600 dark:text-blue-400">
                              your_api_secret_here
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            {selectedIntegration.name.toUpperCase()}_BASE_URL=
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {selectedIntegration.baseUrl || "api_base_url"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Current Status:
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Enabled:</span>
                          <span
                            className={
                              selectedIntegration.enabled
                                ? "text-green-600 dark:text-green-400 font-semibold"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {selectedIntegration.enabled ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">API Key Set:</span>
                          <span
                            className={
                              selectedIntegration.hasApiKey
                                ? "text-green-600 dark:text-green-400 font-semibold"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {selectedIntegration.hasApiKey ? "Yes" : "No"}
                          </span>
                        </div>
                        {selectedIntegration.hasApiSecret !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">API Secret Set:</span>
                            <span
                              className={
                                selectedIntegration.hasApiSecret
                                  ? "text-green-600 dark:text-green-400 font-semibold"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              {selectedIntegration.hasApiSecret ? "Yes" : "No"}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Timeout:</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {selectedIntegration.timeout}ms
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Retry Attempts:</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {selectedIntegration.retryAttempts}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedIntegration.validation.errors.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                          Validation Errors:
                        </h4>
                        <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
                          {selectedIntegration.validation.errors.map(
                            (error, idx) => (
                              <li key={idx}>{error}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
