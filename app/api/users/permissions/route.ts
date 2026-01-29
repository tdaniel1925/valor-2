import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getPermissionsForRole, mergeRolePermissions, Permission } from "@/lib/auth/permissions";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/users/permissions - Get user's permissions including hierarchical inheritance
 *
 * This endpoint calculates permissions from:
 * 1. User's base role permissions
 * 2. Custom permissions granted at organization level
 * 3. Inherited permissions from parent organizations in the hierarchy
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and get user ID from session
    const authUser = await requireAuth(request);
    const userId = authUser.id;

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId"); // Current context organization

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 404 }
      );
    }

    // Start with base role permissions
    const basePermissions = getPermissionsForRole(user.role);
    const allPermissions = new Set<Permission>(basePermissions);

    // If organization context is provided, add organization-specific permissions
    if (organizationId) {
      // Get all organizations in the hierarchy (current + all parents)
      const organizationHierarchy = await getOrganizationHierarchy(organizationId);

      // Get user's memberships in all organizations in the hierarchy
      const memberships = await prisma.organizationMember.findMany({
        where: {
          userId,
          organizationId: { in: organizationHierarchy.map(org => org.id) },
          isActive: true,
        },
        include: {
          organization: {
            select: { id: true, name: true, type: true, parentId: true },
          },
        },
      });

      // Add permissions from each organization membership
      // Permissions from parent organizations are inherited by child organizations
      memberships.forEach(membership => {
        membership.permissions.forEach(permission => {
          allPermissions.add(permission as Permission);
        });

        // Add role-based permissions from organization role (if different from user role)
        const orgRolePermissions = getPermissionsForRole(membership.role);
        orgRolePermissions.forEach(permission => {
          allPermissions.add(permission);
        });
      });
    } else {
      // No organization context - get permissions from all active memberships
      const memberships = await prisma.organizationMember.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      memberships.forEach(membership => {
        membership.permissions.forEach(permission => {
          allPermissions.add(permission as Permission);
        });

        // Add role-based permissions
        const orgRolePermissions = getPermissionsForRole(membership.role);
        orgRolePermissions.forEach(permission => {
          allPermissions.add(permission);
        });
      });
    }

    return NextResponse.json({
      permissions: Array.from(allPermissions),
      userId,
      organizationId: organizationId || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get organization hierarchy (current org + all parents)
 */
async function getOrganizationHierarchy(organizationId: string) {
  const hierarchy: { id: string; name: string; type: string; parentId: string | null }[] = [];
  let currentOrgId: string | null = organizationId;

  while (currentOrgId) {
    const org: { id: string; name: string; type: string; parentId: string | null } | null = await prisma.organization.findUnique({
      where: { id: currentOrgId },
      select: { id: true, name: true, type: true, parentId: true },
    });

    if (!org) break;

    hierarchy.push(org);
    currentOrgId = org.parentId;
  }

  return hierarchy;
}

/**
 * PUT /api/users/permissions - Update user's custom permissions in an organization
 */
export async function PUT(request: NextRequest) {
  try {
    // Require authentication - only admins should be able to update permissions
    const authUser = await requireAuth(request);

    const body = await request.json();
    const { userId, organizationId, permissions } = body;

    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: "userId and organizationId are required" },
        { status: 400 }
      );
    }

    // Check if the authenticated user has permission to modify permissions
    // (You should implement proper role/permission checks here)
    const adminUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (adminUser?.role !== 'ADMINISTRATOR' && adminUser?.role !== 'EXECUTIVE') {
      return NextResponse.json(
        { error: "You do not have permission to modify user permissions" },
        { status: 403 }
      );
    }

    // Update organization member permissions
    const updated = await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: {
        permissions: permissions || [],
      },
    });

    return NextResponse.json({
      success: true,
      member: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error updating permissions:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
