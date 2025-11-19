"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  commissionSplit?: number;
  isActive: boolean;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    status: string;
    profile?: {
      photoUrl?: string;
      licenseNumber?: string;
      licenseState?: string;
    };
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

export default function OrganizationDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch organization details
  const { data: orgData } = useQuery({
    queryKey: ["organization", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/organizations?id=${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch organization");
      return res.json();
    },
  });

  // Fetch organization members
  const { data: membersData, isLoading } = useQuery<{ members: OrganizationMember[] }>({
    queryKey: ["organization-members", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${params.id}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  // Fetch all users for adding members
  const { data: usersData } = useQuery<{ users: User[] }>({
    queryKey: ["all-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: showAddMemberModal,
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string; commissionSplit?: string }) => {
      const res = await fetch(`/api/organizations/${params.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", params.id] });
      setShowAddMemberModal(false);
      setSelectedUserId("");
    },
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (data: { userId: string; role?: string; commissionSplit?: string; isActive?: boolean }) => {
      const res = await fetch(`/api/organizations/${params.id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", params.id] });
      setEditingMember(null);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/organizations/${params.id}/members?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", params.id] });
    },
  });

  const members = membersData?.members || [];
  const allUsers = usersData?.users || [];

  // Filter out users who are already members
  const availableUsers = allUsers.filter(
    (user) => !members.some((member) => member.userId === user.id)
  );

  const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addMemberMutation.mutate({
      userId: formData.get("userId") as string,
      role: formData.get("role") as string,
      commissionSplit: formData.get("commissionSplit") as string,
    });
  };

  const handleUpdateMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;

    const formData = new FormData(e.currentTarget);
    updateMemberMutation.mutate({
      userId: editingMember.userId,
      role: formData.get("role") as string,
      commissionSplit: formData.get("commissionSplit") as string,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/organizations"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Organizations
          </Link>
          <div className="flex justify-between items-center mt-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {orgData?.organization?.name || "Organization"}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage members and their roles
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/organizations/${params.id}/settings`}>
                <Button variant="outline">
                  Settings
                </Button>
              </Link>
              <Button onClick={() => setShowAddMemberModal(true)}>
                Add Member
              </Button>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading members...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No members in this organization</p>
                <Button onClick={() => setShowAddMemberModal(true)} className="mt-4">
                  Add First Member
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission Split
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {member.user.profile?.photoUrl ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={member.user.profile.photoUrl}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {member.user.firstName[0]}
                                    {member.user.lastName[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.user.firstName} {member.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{member.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="info">{member.role}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {member.commissionSplit ? `${(member.commissionSplit * 100).toFixed(1)}%` : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={member.isActive ? "success" : "default"}>
                            {member.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingMember(member)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Remove ${member.user.firstName} ${member.user.lastName} from this organization?`)) {
                                  removeMemberMutation.mutate(member.userId);
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Add Member</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select User
                    </label>
                    <select
                      name="userId"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a user...</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role in Organization
                    </label>
                    <select
                      name="role"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AGENT">Agent</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="EXECUTIVE">Executive</option>
                    </select>
                  </div>

                  <Input
                    label="Commission Split (%)"
                    name="commissionSplit"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g., 50 for 50%"
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowAddMemberModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={addMemberMutation.isPending}>
                      Add Member
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Member Modal */}
        {editingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>
                  Edit Member: {editingMember.user.firstName} {editingMember.user.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role in Organization
                    </label>
                    <select
                      name="role"
                      defaultValue={editingMember.role}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AGENT">Agent</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="EXECUTIVE">Executive</option>
                    </select>
                  </div>

                  <Input
                    label="Commission Split (%)"
                    name="commissionSplit"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue={editingMember.commissionSplit ? editingMember.commissionSplit * 100 : ""}
                    placeholder="e.g., 50 for 50%"
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingMember(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={updateMemberMutation.isPending}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
