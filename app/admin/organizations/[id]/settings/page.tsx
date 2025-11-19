"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";
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
}

export default function OrganizationSettingsPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();

  // Fetch organization details
  const { data, isLoading } = useQuery<{ organizations: Organization[] }>({
    queryKey: ["organization", params.id],
    queryFn: async () => {
      const res = await fetch("/api/organizations");
      if (!res.ok) throw new Error("Failed to fetch organization");
      return res.json();
    },
  });

  // Fetch all organizations for parent selection
  const { data: allOrgsData } = useQuery<{ organizations: Organization[] }>({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await fetch("/api/organizations");
      if (!res.ok) throw new Error("Failed to fetch organizations");
      return res.json();
    },
  });

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: async (orgData: any) => {
      const res = await fetch("/api/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...orgData, id: params.id }),
      });
      if (!res.ok) throw new Error("Failed to update organization");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", params.id] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const organization = data?.organizations?.find((org) => org.id === params.id);
  const allOrganizations = allOrgsData?.organizations || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const orgData = {
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
      status: formData.get("status"),
    };

    updateMutation.mutate(orgData);
  };

  if (isLoading || !organization) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/admin/organizations/${params.id}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Organization
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Organization Settings
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage {organization.name} settings and details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Organization Name"
                  name="name"
                  defaultValue={organization.name}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    defaultValue={organization.type}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MGA">MGA (Managing General Agent)</option>
                    <option value="IMO">IMO (Independent Marketing Organization)</option>
                    <option value="AGENCY">Agency</option>
                    <option value="TEAM">Team</option>
                  </select>
                </div>
                <Input
                  label="EIN (Tax ID)"
                  name="ein"
                  defaultValue={organization.ein}
                  placeholder="XX-XXXXXXX"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={organization.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hierarchy */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Hierarchy</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Organization
                </label>
                <select
                  name="parentId"
                  defaultValue={organization.parentId || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Top Level)</option>
                  {allOrganizations
                    .filter((org) => org.id !== params.id)
                    .map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.type})
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Setting a parent organization creates a hierarchical relationship
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  defaultValue={organization.phone}
                  placeholder="(555) 123-4567"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={organization.email}
                  placeholder="contact@example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Street Address"
                  name="address"
                  defaultValue={organization.address}
                  placeholder="123 Main St"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    name="city"
                    defaultValue={organization.city}
                  />
                  <Input
                    label="State"
                    name="state"
                    defaultValue={organization.state}
                    placeholder="CA"
                  />
                  <Input
                    label="ZIP Code"
                    name="zipCode"
                    defaultValue={organization.zipCode}
                    placeholder="12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Deactivate Organization
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Deactivating this organization will prevent members from accessing it
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to deactivate this organization?")) {
                        updateMutation.mutate({ status: "INACTIVE" });
                      }
                    }}
                  >
                    Deactivate Organization
                  </Button>
                </div>
                <div className="border-t border-red-200 pt-3">
                  <h4 className="text-sm font-medium text-red-600 mb-1">
                    Delete Organization
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Permanently delete this organization and all associated data
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      alert("Delete functionality would be implemented here with proper confirmation");
                    }}
                  >
                    Delete Organization
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Link href={`/admin/organizations/${params.id}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
