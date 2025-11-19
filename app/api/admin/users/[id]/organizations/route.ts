import { NextRequest, NextResponse } from "next/server";
import {
  assignUserToOrganization,
  removeUserFromOrganization,
} from "@/lib/admin/user-management";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * POST /api/admin/users/:id/organizations
 * Assign user to an organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { organizationId, role, commissionSplit } = body;

    if (!organizationId || !role) {
      return NextResponse.json(
        { error: "organizationId and role are required" },
        { status: 400 }
      );
    }

    const adminId = await getUserIdOrDemo();

    const member = await assignUserToOrganization(
      userId,
      organizationId,
      role,
      commissionSplit,
      adminId
    );

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error: any) {
    console.error("Assign user to organization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign user to organization" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:id/organizations
 * Remove user from an organization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const adminId = await getUserIdOrDemo();

    await removeUserFromOrganization(userId, organizationId, adminId);

    return NextResponse.json({
      success: true,
      message: "User removed from organization successfully",
    });
  } catch (error: any) {
    console.error("Remove user from organization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove user from organization" },
      { status: 500 }
    );
  }
}
