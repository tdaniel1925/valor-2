"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  profile?: {
    licenseNumber?: string;
    licenseState?: string;
    agencyName?: string;
    photoUrl?: string;
  };
  _count: {
    cases: number;
    contracts: number;
    commissions: number;
  };
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showBulkRoleModal, setShowBulkRoleModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);

  // Fetch users with filters
  const { data, isLoading, error } = useQuery<{ users: User[] }>({
    queryKey: ["admin-users", searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, role, status }: { userId: string; role?: string; status?: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role, status }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ action, data }: { action: string; data?: any }) => {
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userIds: Array.from(selectedUsers),
          data,
        }),
      });
      if (!res.ok) throw new Error("Failed to perform bulk operation");

      // Handle export action differently
      if (action === "export") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-export-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true };
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUsers(new Set());
    },
  });

  const users = data?.users || [];

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "danger";
      case "EXECUTIVE":
        return "warning";
      case "MANAGER":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "default";
      case "SUSPENDED":
        return "danger";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400">Failed to load users</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions across the platform
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Search Users"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Roles</option>
                  <option value="AGENT">Agent</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <Card className="mb-8 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {selectedUsers.size} user{selectedUsers.size > 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkRoleModal(true)}
                  >
                    Change Role
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkStatusModal(true)}
                  >
                    Change Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkOperationMutation.mutate({ action: "export" })}
                    isLoading={bulkOperationMutation.isPending}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)?`)) {
                        bulkOperationMutation.mutate({ action: "delete" });
                      }
                    }}
                  >
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Agency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profile?.photoUrl ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.profile.photoUrl}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                                  {user.firstName[0]}
                                  {user.lastName[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {user.profile?.agencyName || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {user._count.cases} cases
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user._count.contracts} contracts
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>
                  Edit User: {editingUser.firstName} {editingUser.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      defaultValue={editingUser.role}
                      id="edit-role"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="AGENT">Agent</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="EXECUTIVE">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      defaultValue={editingUser.status}
                      id="edit-status"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => setEditingUser(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const role = (document.getElementById("edit-role") as HTMLSelectElement).value;
                        const status = (document.getElementById("edit-status") as HTMLSelectElement).value;
                        updateUserMutation.mutate({
                          userId: editingUser.id,
                          role,
                          status,
                        });
                      }}
                      isLoading={updateUserMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Change Role Modal */}
        {showBulkRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Change Role for {selectedUsers.size} User(s)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Role
                    </label>
                    <select
                      id="bulk-role"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="AGENT">Agent</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="EXECUTIVE">Executive</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => setShowBulkRoleModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const role = (document.getElementById("bulk-role") as HTMLSelectElement).value;
                        bulkOperationMutation.mutate({
                          action: "updateRole",
                          data: { role },
                        });
                        setShowBulkRoleModal(false);
                      }}
                      isLoading={bulkOperationMutation.isPending}
                    >
                      Update Role
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Change Status Modal */}
        {showBulkStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Change Status for {selectedUsers.size} User(s)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Status
                    </label>
                    <select
                      id="bulk-status"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => setShowBulkStatusModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const status = (document.getElementById("bulk-status") as HTMLSelectElement).value;
                        bulkOperationMutation.mutate({
                          action: "updateStatus",
                          data: { status },
                        });
                        setShowBulkStatusModal(false);
                      }}
                      isLoading={bulkOperationMutation.isPending}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
