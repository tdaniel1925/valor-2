import { NextRequest } from "next/server";
import { createClient } from "./supabase-server";
import { prisma } from "@/lib/db/prisma";

/**
 * Get the authenticated user from the request
 * Returns null if no user is authenticated
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the authenticated user ID from the request
 * Returns null if no user is authenticated
 */
export async function getAuthenticatedUserId(
  request: NextRequest
): Promise<string | null> {
  const user = await getAuthenticatedUser(request);
  return user?.id || null;
}

/**
 * Require authentication - throws 401 error if not authenticated
 */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Require admin role - throws 403 error if not admin
 * Admin roles: ADMINISTRATOR, EXECUTIVE
 */
export async function requireAdmin(request: NextRequest) {
  const authUser = await requireAuth(request);

  // Get full user record with role
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true, tenantId: true, email: true },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  // Check if user has admin role
  const adminRoles = ['ADMINISTRATOR', 'EXECUTIVE'];
  if (!adminRoles.includes(dbUser.role)) {
    throw new Error("Insufficient permissions - admin access required");
  }

  return dbUser;
}

/**
 * Check if user has access to a resource owned by a specific user
 */
export async function canAccessUserResource(
  request: NextRequest,
  resourceUserId: string
): Promise<boolean> {
  const currentUserId = await getAuthenticatedUserId(request);

  if (!currentUserId) {
    return false;
  }

  // User can access their own resources
  if (currentUserId === resourceUserId) {
    return true;
  }

  // Check if user is admin or manager with org-level access
  const dbUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      role: true,
      organizations: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!dbUser) {
    return false;
  }

  // Admins and executives can access all resources in their tenant
  if (['ADMINISTRATOR', 'EXECUTIVE'].includes(dbUser.role)) {
    return true;
  }

  // Managers can access resources in their organization
  if (dbUser.role === 'MANAGER' && dbUser.organizations.length > 0) {
    const resourceUser = await prisma.user.findUnique({
      where: { id: resourceUserId },
      select: {
        organizations: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    // Check if any organization overlaps
    const currentUserOrgIds = dbUser.organizations.map(o => o.organizationId);
    const resourceUserOrgIds = resourceUser?.organizations.map(o => o.organizationId) || [];
    const hasSharedOrg = currentUserOrgIds.some(id => resourceUserOrgIds.includes(id));

    if (hasSharedOrg) {
      return true;
    }
  }

  return false;
}
