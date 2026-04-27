import { NextRequest, NextResponse } from "next/server";
import {
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from "@/lib/admin/organization-management";
import { requireAdmin } from "@/lib/auth/server-auth";

/**
 * GET /api/admin/organizations/:id
 * Get organization by ID with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id: organizationId } = await params;

    const organization = await getOrganizationById(organizationId);

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions - admin access required") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
    }
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
    const admin = await requireAdmin(request);

    const { id: organizationId } = await params;
    const body = await request.json();

    const organization = await updateOrganization(organizationId, body, admin.id);

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Insufficient permissions - admin access required") return NextResponse.json({ error: error.message }, { status: 403 });
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
    const admin = await requireAdmin(request);

    const { id: organizationId } = await params;

    await deleteOrganization(organizationId, admin.id);

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Insufficient permissions - admin access required") return NextResponse.json({ error: error.message }, { status: 403 });
    console.error("Delete organization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete organization" },
      { status: 500 }
    );
  }
}
