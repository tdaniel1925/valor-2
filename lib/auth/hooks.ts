"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsForRole,
} from "./permissions";

interface User {
  id: string;
  role: string;
  status: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface UserPermissions {
  permissions: Permission[];
}

/**
 * Hook to get the current authenticated user
 */
export function useCurrentUser() {
  return useQuery<{ user: User }>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      // TODO: Replace with actual Supabase auth
      // For now, return demo user
      return {
        user: {
          id: "demo-user-id",
          role: "ADMIN",
          status: "ACTIVE",
          email: "admin@example.com",
          firstName: "Demo",
          lastName: "User",
        },
      };
    },
  });
}

/**
 * Hook to get the current user's permissions
 */
export function usePermissions() {
  const { data: userData } = useCurrentUser();

  return useQuery<UserPermissions>({
    queryKey: ["userPermissions", userData?.user?.id],
    queryFn: async () => {
      // Get permissions based on user role
      const role = userData?.user?.role || "AGENT";
      const permissions = getPermissionsForRole(role);

      // TODO: In production, fetch custom permissions from API
      // This would include organization-level permissions and custom grants

      return { permissions };
    },
    enabled: !!userData?.user,
  });
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { data } = usePermissions();
  const permissions = data?.permissions || [];
  return hasPermission(permissions, permission);
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(requiredPermissions: Permission[]): boolean {
  const { data } = usePermissions();
  const permissions = data?.permissions || [];
  return hasAnyPermission(permissions, requiredPermissions);
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useHasAllPermissions(requiredPermissions: Permission[]): boolean {
  const { data } = usePermissions();
  const permissions = data?.permissions || [];
  return hasAllPermissions(permissions, requiredPermissions);
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: string | string[]): boolean {
  const { data } = useCurrentUser();
  const userRole = data?.user?.role;

  if (!userRole) return false;

  if (Array.isArray(role)) {
    return role.includes(userRole);
  }

  return userRole === role;
}

/**
 * Hook to check if user is an admin
 */
export function useIsAdmin(): boolean {
  return useHasRole("ADMIN");
}

/**
 * Hook to check if user is a manager or admin
 */
export function useIsManagerOrAdmin(): boolean {
  return useHasRole(["ADMIN", "MANAGER"]);
}

/**
 * Hook to get user's role
 */
export function useUserRole(): string | undefined {
  const { data } = useCurrentUser();
  return data?.user?.role;
}

/**
 * Hook to check if user is active
 */
export function useIsActive(): boolean {
  const { data } = useCurrentUser();
  return data?.user?.status === "ACTIVE";
}
