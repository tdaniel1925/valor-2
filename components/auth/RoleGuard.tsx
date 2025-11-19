"use client";

import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallback?: ReactNode;
}

interface User {
  id: string;
  role: string;
  status: string;
}

/**
 * RoleGuard component - Conditionally renders children based on user role
 *
 * Usage:
 * <RoleGuard allowedRoles={["ADMIN", "MANAGER"]}>
 *   <AdminPanel />
 * </RoleGuard>
 */
export function RoleGuard({ children, allowedRoles = [], fallback = null }: RoleGuardProps) {
  // TODO: Replace with actual user from Supabase auth
  const { data: userData } = useQuery<{ user: User }>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      // For now, return demo user
      // In production, this would fetch from Supabase auth
      return {
        user: {
          id: "demo-user-id",
          role: "ADMIN",
          status: "ACTIVE",
        },
      };
    },
  });

  const user = userData?.user;

  if (!user) {
    return <>{fallback}</>;
  }

  // If user is inactive, don't show content
  if (user.status !== "ACTIVE") {
    return <>{fallback}</>;
  }

  // If no roles specified, show to all authenticated users
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user's role is in allowed roles
  if (allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface PermissionGuardProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

/**
 * PermissionGuard component - Conditionally renders children based on specific permission
 *
 * Usage:
 * <PermissionGuard permission="users:delete">
 *   <DeleteUserButton />
 * </PermissionGuard>
 */
export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const { data: permissionsData } = useQuery<{ permissions: string[] }>({
    queryKey: ["userPermissions"],
    queryFn: async () => {
      // TODO: Fetch from API endpoint that returns user permissions
      // For now, return demo permissions
      return {
        permissions: [
          "users:read",
          "users:write",
          "users:delete",
          "organizations:read",
          "organizations:write",
          "cases:read",
          "cases:write",
          "commissions:read",
          "commissions:write",
        ],
      };
    },
  });

  const permissions = permissionsData?.permissions || [];

  if (permissions.includes(permission) || permissions.includes("*")) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface ConditionalRenderProps {
  children: ReactNode;
  condition: boolean;
  fallback?: ReactNode;
}

/**
 * ConditionalRender - Helper component for conditional rendering
 */
export function ConditionalRender({ children, condition, fallback = null }: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>;
}
