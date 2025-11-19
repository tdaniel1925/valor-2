"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/auth/permissions";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  profile?: {
    photoUrl?: string;
  };
}

interface RoleInfo {
  name: string;
  displayName: string;
  description: string;
  permissionCount: number;
  color: string;
}

const ROLE_INFO: Record<string, RoleInfo> = {
  ADMIN: {
    name: "ADMIN",
    displayName: "Administrator",
    description: "Full system access with all permissions",
    permissionCount: 1, // ALL permission
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  MANAGER: {
    name: "MANAGER",
    displayName: "Manager",
    description: "Manage teams, approve cases and commissions",
    permissionCount: ROLE_PERMISSIONS.MANAGER.length,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  AGENT: {
    name: "AGENT",
    displayName: "Agent",
    description: "Create cases, quotes, and track commissions",
    permissionCount: ROLE_PERMISSIONS.AGENT.length,
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  SUPPORT: {
    name: "SUPPORT",
    displayName: "Support",
    description: "View and assist with cases and quotes",
    permissionCount: ROLE_PERMISSIONS.SUPPORT.length,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
};

export default function RolesManagementPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigningUser, setAssigningUser] = useState<User | null>(null);

  // Fetch all users
  const { data: usersData, isLoading } = useQuery<{ users: User[] }>({
    queryKey: ["all-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setAssigningUser(null);
    },
  });

  const users = usersData?.users || [];

  // Filter users by role and search term
  const filteredUsers = users.filter((user) => {
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesSearch =
      !searchTerm ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Count users by role
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleAssignRole = (newRole: string) => {
    if (!assigningUser) return;
    updateRoleMutation.mutate({ userId: assigningUser.id, role: newRole });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading roles...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Role Management</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage user roles and permissions across the organization
          </p>
        </div>

        {/* Role Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.values(ROLE_INFO).map((roleInfo) => (
            <Card
              key={roleInfo.name}
              className={`cursor-pointer transition-all ${
                selectedRole === roleInfo.name ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedRole(selectedRole === roleInfo.name ? null : roleInfo.name)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{roleInfo.displayName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {roleInfo.permissionCount} permission{roleInfo.permissionCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge className={roleInfo.color}>{roleCounts[roleInfo.name] || 0}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{roleInfo.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          {selectedRole && (
            <Button variant="secondary" onClick={() => setSelectedRole(null)}>
              Clear Filter
            </Button>
          )}
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Users {selectedRole && `with ${ROLE_INFO[selectedRole].displayName} role`} ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Current Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                          <Badge className={ROLE_INFO[user.role]?.color || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"}>
                            {ROLE_INFO[user.role]?.displayName || user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.status === "ACTIVE" ? "success" : "default"}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssigningUser(user)}
                          >
                            Change Role
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Role Modal */}
        {assigningUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full mx-4">
              <CardHeader>
                <CardTitle>
                  Change Role: {assigningUser.firstName} {assigningUser.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Role:</p>
                  <Badge className={ROLE_INFO[assigningUser.role]?.color || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"}>
                    {ROLE_INFO[assigningUser.role]?.displayName || assigningUser.role}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select New Role:</p>
                  {Object.values(ROLE_INFO).map((roleInfo) => (
                    <button
                      key={roleInfo.name}
                      onClick={() => handleAssignRole(roleInfo.name)}
                      disabled={assigningUser.role === roleInfo.name || updateRoleMutation.isPending}
                      className={`w-full p-4 border rounded-lg text-left transition-all ${
                        assigningUser.role === roleInfo.name
                          ? "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{roleInfo.displayName}</h4>
                            {assigningUser.role === roleInfo.name && (
                              <Badge variant="info" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{roleInfo.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {roleInfo.permissionCount} permission{roleInfo.permissionCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAssigningUser(null)}
                    disabled={updateRoleMutation.isPending}
                  >
                    Cancel
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
