"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

interface AuditLog {
  id: string;
  userId: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    userId: "",
    startDate: "",
    endDate: "",
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Build query params
  const queryParams = new URLSearchParams({ page: page.toString(), limit: "50" });
  if (filters.action) queryParams.append("action", filters.action);
  if (filters.entityType) queryParams.append("entityType", filters.entityType);
  if (filters.userId) queryParams.append("userId", filters.userId);
  if (filters.startDate) queryParams.append("startDate", filters.startDate);
  if (filters.endDate) queryParams.append("endDate", filters.endDate);

  // Fetch audit logs
  const { data, isLoading, refetch } = useQuery<{
    logs: AuditLog[];
    pagination: Pagination;
  }>({
    queryKey: ["audit-logs", page, filters],
    queryFn: async () => {
      const res = await fetch(`/api/audit-logs?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (action.includes("DELETE")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (action.includes("LOGIN") || action.includes("LOGOUT")) return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      entityType: "",
      userId: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading audit logs...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View system activity and user actions
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Action
                </label>
                <input
                  type="text"
                  value={filters.action}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                  placeholder="e.g., LOGIN, CREATE_CASE"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Type
                </label>
                <input
                  type="text"
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange("entityType", e.target.value)}
                  placeholder="e.g., User, Case, Contract"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Activity Log ({pagination?.total || 0} total records)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Entity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            {log.user ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {log.user.firstName} {log.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{log.user.email}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">System</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={getActionColor(log.action)}>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {log.entityType ? (
                              <div>
                                <div className="text-sm text-gray-900 dark:text-gray-100">{log.entityType}</div>
                                {log.entityId && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                    {log.entityId.substring(0, 8)}...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {log.ipAddress || "-"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing page {pagination.page} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Log Details Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Audit Log Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
                    <p className="mt-1">
                      <Badge className={getActionColor(selectedLog.action)}>
                        {selectedLog.action}
                      </Badge>
                    </p>
                  </div>
                </div>

                {selectedLog.user && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {selectedLog.user.firstName} {selectedLog.user.lastName} ({selectedLog.user.email})
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Role: {selectedLog.user.role}</p>
                  </div>
                )}

                {selectedLog.entityType && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Entity Type</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedLog.entityType}</p>
                    </div>
                    {selectedLog.entityId && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Entity ID</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 font-mono">{selectedLog.entityId}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.ipAddress && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedLog.ipAddress}</p>
                    </div>
                  )}
                </div>

                {selectedLog.userAgent && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User Agent</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 break-all">{selectedLog.userAgent}</p>
                  </div>
                )}

                {selectedLog.changes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Changes</label>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-600 overflow-x-auto text-gray-900 dark:text-gray-100">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setSelectedLog(null)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
