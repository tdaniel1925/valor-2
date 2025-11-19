"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Organization {
  id: string;
  name: string;
  type: string;
}

interface OrganizationMember {
  organizationId: string;
  organization: Organization;
  role: string;
  isActive: boolean;
}

export default function OrganizationSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("currentOrganizationId") : null
  );

  // Fetch user's organizations
  const { data } = useQuery<{ organizations: OrganizationMember[] }>({
    queryKey: ["user-organizations"],
    queryFn: async () => {
      // TODO: Replace with actual user ID from Supabase auth
      const userId = "demo-user-id";
      const res = await fetch(`/api/users/${userId}/organizations`);
      if (!res.ok) return { organizations: [] };
      return res.json();
    },
  });

  const organizations = data?.organizations || [];
  const currentOrg = organizations.find((org) => org.organizationId === currentOrgId);

  const handleSwitch = (orgId: string) => {
    setCurrentOrgId(orgId);
    localStorage.setItem("currentOrganizationId", orgId);
    setIsOpen(false);
    // Trigger a page reload or state update to reflect the new organization
    window.dispatchEvent(new Event("organizationChanged"));
  };

  if (organizations.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {currentOrg?.organization.name || "Select Organization"}
          </div>
          {currentOrg && (
            <div className="text-xs text-gray-500">
              {currentOrg.organization.type}
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">
                Switch Organization
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {organizations.length} organization{organizations.length > 1 ? "s" : ""} available
              </p>
            </div>

            {/* Organizations List */}
            <div className="py-2 max-h-96 overflow-y-auto">
              {organizations.map((org) => (
                <button
                  key={org.organizationId}
                  onClick={() => handleSwitch(org.organizationId)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    org.organizationId === currentOrgId ? "bg-blue-50" : ""
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    org.organizationId === currentOrgId
                      ? "bg-blue-100"
                      : "bg-gray-100"
                  }`}>
                    <svg
                      className={`w-5 h-5 ${
                        org.organizationId === currentOrgId
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      org.organizationId === currentOrgId
                        ? "text-blue-900"
                        : "text-gray-900"
                    }`}>
                      {org.organization.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {org.organization.type} • {org.role}
                    </div>
                  </div>
                  {org.organizationId === currentOrgId && (
                    <svg
                      className="flex-shrink-0 w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <a
                href="/admin/organizations"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Organizations →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
