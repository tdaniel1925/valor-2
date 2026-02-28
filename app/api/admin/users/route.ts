import { NextRequest, NextResponse } from "next/server";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/admin/user-management";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/admin/users
 * Get all users with filters (admin only, tenant-scoped)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication
    const user = await requireAuth(request);

    // TODO: Add admin role check for user
    // TODO: Update getUsers function to accept tenantId and use withTenantContext
    const { searchParams } = new URL(request.url);

    const result = await getUsers({
      role: searchParams.get("role") as any,
      status: searchParams.get("status") as any,
      search: searchParams.get("search") || undefined,
      organizationId: searchParams.get("organizationId") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin only, tenant-scoped)
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication
    const user = await requireAuth(request);

    // TODO: Add admin role check
    const body = await request.json();

    const newUser = await createUser(tenantContext.tenantId, body, user.id);

    return NextResponse.json({
      success: true,
      data: newUser,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update a user (admin only, tenant-scoped)
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication
    const user = await requireAuth(request);

    // TODO: Add admin role check
    // TODO: Update updateUser function to accept tenantId and use withTenantContext
    const body = await request.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(userId, updates, user.id);

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Delete a user (soft delete) (admin only, tenant-scoped)
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication
    const user = await requireAuth(request);

    // TODO: Add admin role check
    // TODO: Update deleteUser function to accept tenantId and use withTenantContext
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    await deleteUser(userId, user.id);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
