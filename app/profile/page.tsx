"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  profile?: {
    licenseNumber?: string;
    licenseState?: string;
    licenseExpiration?: string;
    npn?: string;
    gaid?: string;
    agencyName?: string;
    yearsOfExperience?: number;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data, isLoading, error } = useQuery<{ user: UserProfile }>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (userData: Partial<UserProfile>) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
    },
  });

  const user = data?.user;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Failed to load profile</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Badge variant="info">{user.role}</Badge>
                  <Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>
                    {user.status}
                  </Badge>
                </div>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className="mt-6 w-full"
                >
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={user.firstName}
                    disabled={!isEditing}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={user.lastName}
                    disabled={!isEditing}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={user.email}
                    disabled
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={user.phone || ""}
                    disabled={!isEditing}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </CardContent>
            </Card>

            {/* License Information */}
            <Card>
              <CardHeader>
                <CardTitle>License & Certification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="License Number"
                    value={user.profile?.licenseNumber || ""}
                    disabled={!isEditing}
                    placeholder="Enter license number"
                  />
                  <Input
                    label="License State"
                    value={user.profile?.licenseState || ""}
                    disabled={!isEditing}
                    placeholder="e.g., CA"
                  />
                  <Input
                    label="License Expiration"
                    type="date"
                    value={user.profile?.licenseExpiration || ""}
                    disabled={!isEditing}
                  />
                  <Input
                    label="NPN (National Producer Number)"
                    value={user.profile?.npn || ""}
                    disabled={!isEditing}
                    placeholder="Enter NPN"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="GAID (General Agent ID)"
                    value={user.profile?.gaid || ""}
                    disabled={!isEditing}
                    placeholder="Enter GAID"
                  />
                  <Input
                    label="Agency Name"
                    value={user.profile?.agencyName || ""}
                    disabled={!isEditing}
                    placeholder="Enter agency name"
                  />
                  <Input
                    label="Years of Experience"
                    type="number"
                    value={user.profile?.yearsOfExperience || ""}
                    disabled={!isEditing}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={user.profile?.emailNotifications ?? true}
                      disabled={!isEditing}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Email notifications
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={user.profile?.smsNotifications ?? false}
                      disabled={!isEditing}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      SMS notifications
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={user.profile?.pushNotifications ?? true}
                      disabled={!isEditing}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Push notifications
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {isEditing && (
              <div className="flex justify-end gap-4">
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Implement form submission
                    updateMutation.mutate(user);
                  }}
                  isLoading={updateMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
