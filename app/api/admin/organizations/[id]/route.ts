import { NextRequest, NextResponse } from "next/server";
import {
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from "@/lib/admin/organization-management";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * GET /api/admin/organizations/:id
 * Get organization by ID with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;

    const organization = await getOrganizationById(organizationId);

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    console.error("Get organization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get organization" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/organizations/:id
 * Update organization by ID
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const body = await request.json();

    const adminId = await getUserIdOrDemo();
    const organization = await updateOrganization(organizationId, body, adminId);

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    console.error("Update organization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update organization" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/organizations/:id
 * Delete organization by ID (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;

    const adminId = await getUserIdOrDemo();
    await deleteOrganization(organizationId, adminId);

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete organization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete organization" },
      { status: 500 }
    );
  }
}
