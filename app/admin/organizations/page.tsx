"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";
import OrganizationTree from "@/components/organizations/OrganizationTree";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  type: string;
  ein?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
    type: string;
  };
  _count?: {
    members: number;
    contracts: number;
  };
}

export default function OrganizationsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "tree">("tree");

  // Fetch organizations
  const { data, isLoading, error } = useQuery<{ organizations: Organization[] }>({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await fetch("/api/organizations");
      if (!res.ok) throw new Error("Failed to fetch organizations");
      return res.json();
    },
  });

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: async (orgData: any) => {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgData),
      });
      if (!res.ok) throw new Error("Failed to create organization");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setShowCreateModal(false);
    },
  });

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: async (orgData: any) => {
      const res = await fetch("/api/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgData),
      });
      if (!res.ok) throw new Error("Failed to update organization");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setEditingOrg(null);
    },
  });

  // Delete organization mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/organizations?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete organization");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const organizations = data?.organizations || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, isEdit: boolean) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orgData: any = {
      name: formData.get("name"),
      type: formData.get("type"),
      ein: formData.get("ein"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      zipCode: formData.get("zipCode"),
      parentId: formData.get("parentId") || null,
    };

    if (isEdit && editingOrg) {
      updateMutation.mutate({ ...orgData, id: editingOrg.id });
    } else {
      createMutation.mutate(orgData);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading organizations...</p>
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
              <p className="text-red-600 dark:text-red-400">Failed to load organizations</p>
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Organizations</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage organization hierarchy and structure
            </p>
          </div>
          <div className="flex gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === "tree"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === "table"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Table View
              </button>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Organization
            </Button>
          </div>
        </div>

        {/* Organizations Display */}
        <Card>
          <CardContent className={viewMode === "tree" ? "p-4" : "p-0"}>
            {viewMode === "tree" ? (
              <OrganizationTree
                organizations={organizations}
                onEditOrganization={setEditingOrg}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Members
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
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{org.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info">{org.type}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {org.parent ? org.parent.name : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{org._count?.members || 0} members</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {org._count?.contracts || 0} contracts
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={org.status === "ACTIVE" ? "success" : "default"}>
                          {org.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/organizations/${org.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Members
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingOrg(org)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${org.name}?`)) {
                                deleteMutation.mutate(org.id);
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
              {organizations.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No organizations found</p>
                  <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                    Create Your First Organization
                  </Button>
                </div>
              )}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Create Organization Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <Card className="max-w-2xl w-full mx-4 my-8">
              <CardHeader>
                <CardTitle>Create Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Organization Name" name="name" required />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        name="type"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select type...</option>
                        <option value="MGA">MGA (Managing General Agent)</option>
                        <option value="IMO">IMO (Independent Marketing Organization)</option>
                        <option value="AGENCY">Agency</option>
                        <option value="TEAM">Team</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="EIN (Tax ID)" name="ein" placeholder="XX-XXXXXXX" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parent Organization
                      </label>
                      <select
                        name="parentId"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None (Top Level)</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} ({org.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Phone" name="phone" type="tel" placeholder="(555) 123-4567" />
                    <Input label="Email" name="email" type="email" placeholder="contact@example.com" />
                  </div>

                  <Input label="Address" name="address" placeholder="123 Main St" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="City" name="city" />
                    <Input label="State" name="state" placeholder="CA" />
                    <Input label="ZIP Code" name="zipCode" placeholder="12345" />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={createMutation.isPending}>
                      Create Organization
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Organization Modal */}
        {editingOrg && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <Card className="max-w-2xl w-full mx-4 my-8">
              <CardHeader>
                <CardTitle>Edit Organization: {editingOrg.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Organization Name" name="name" defaultValue={editingOrg.name} required />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        name="type"
                        defaultValue={editingOrg.type}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MGA">MGA (Managing General Agent)</option>
                        <option value="IMO">IMO (Independent Marketing Organization)</option>
                        <option value="AGENCY">Agency</option>
                        <option value="TEAM">Team</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="EIN (Tax ID)" name="ein" defaultValue={editingOrg.ein} placeholder="XX-XXXXXXX" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parent Organization
                      </label>
                      <select
                        name="parentId"
                        defaultValue={editingOrg.parentId || ""}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None (Top Level)</option>
                        {organizations
                          .filter((org) => org.id !== editingOrg.id)
                          .map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name} ({org.type})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Phone" name="phone" type="tel" defaultValue={editingOrg.phone} />
                    <Input label="Email" name="email" type="email" defaultValue={editingOrg.email} />
                  </div>

                  <Input label="Address" name="address" defaultValue={editingOrg.address} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="City" name="city" defaultValue={editingOrg.city} />
                    <Input label="State" name="state" defaultValue={editingOrg.state} />
                    <Input label="ZIP Code" name="zipCode" defaultValue={editingOrg.zipCode} />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingOrg(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={updateMutation.isPending}>
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
