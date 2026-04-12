import { NextRequest, NextResponse } from "next/server";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/admin/user-management";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { requireAdmin } from "@/lib/auth/server-auth";
import { createUserSchema, updateUserSchema } from "@/lib/validation/admin-schemas";
import { ZodError } from "zod";
import { createLogger } from "@/lib/logging/logger";
import { getRequestId } from "@/lib/logging/request-id";

/**
 * GET /api/admin/users
 * Get all users with filters (admin only, tenant-scoped)
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/admin/users',
  });

  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require admin authentication
    const user = await requireAdmin(request);
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
    logger.error('Get users error', { error: error.message, stack: error.stack });
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
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/admin/users',
  });

  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require admin authentication
    const user = await requireAdmin(request);

    const body = await request.json();

    // Validate input with Zod
    const validatedData = createUserSchema.parse(body);

    const newUser = await createUser(tenantContext.tenantId, validatedData, user.id);

    logger.info('User created by admin', {
      newUserId: newUser.id,
      email: newUser.email,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: newUser,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Create user error', { error: error.message, stack: error.stack });
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
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/admin/users',
  });

  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require admin authentication
    const user = await requireAdmin(request);

    const body = await request.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Validate update fields with Zod
    const validatedUpdates = updateUserSchema.parse(updates);

    const updatedUser = await updateUser(userId, validatedUpdates, user.id);

    logger.info('User updated by admin', {
      updatedUserId: userId,
      updatedBy: user.id,
      fields: Object.keys(validatedUpdates),
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Update user error', { error: error.message, stack: error.stack });
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
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/admin/users',
  });

  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require admin authentication
    const user = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    await deleteUser(userId, user.id);

    logger.info('User deleted by admin', {
      deletedUserId: userId,
      deletedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Delete user error', { error: error.message, stack: error.stack });
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
