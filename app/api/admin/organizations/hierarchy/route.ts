import { NextRequest, NextResponse } from "next/server";
import { getOrganizationHierarchy } from "@/lib/admin/organization-management";

/**
 * GET /api/admin/organizations/hierarchy
 * Get full organization hierarchy tree (all root organizations)
 */
export async function GET(request: NextRequest) {
  try {
    const hierarchy = await getOrganizationHierarchy();

    return NextResponse.json({
      success: true,
      data: hierarchy,
    });
  } catch (error: any) {
    console.error("Get full hierarchy error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get organization hierarchy" },
      { status: 500 }
    );
  }
}
