import { NextRequest, NextResponse } from "next/server";
import { getOrganizationHierarchy } from "@/lib/admin/organization-management";

/**
 * GET /api/admin/organizations/:id/hierarchy
 * Get organization hierarchy tree
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;

    const hierarchy = await getOrganizationHierarchy(organizationId);

    return NextResponse.json({
      success: true,
      data: hierarchy,
    });
  } catch (error: any) {
    console.error("Get organization hierarchy error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get organization hierarchy" },
      { status: 500 }
    );
  }
}
