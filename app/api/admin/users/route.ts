import { NextRequest, NextResponse } from "next/server";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/admin/user-management";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * GET /api/admin/users
 * Get all users with filters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin role check from Supabase auth
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
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin role check
    const body = await request.json();
    const adminId = await getUserIdOrDemo();

    const user = await createUser(body, adminId);

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update a user (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    // TODO: Add admin role check
    const body = await request.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const adminId = await getUserIdOrDemo();
    const user = await updateUser(userId, updates, adminId);

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Delete a user (soft delete) (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add admin role check
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const adminId = await getUserIdOrDemo();
    await deleteUser(userId, adminId);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
