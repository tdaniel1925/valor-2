import { NextRequest, NextResponse } from "next/server";
import { getOrganizationStats } from "@/lib/admin/organization-management";

/**
 * GET /api/admin/organizations/:id/stats
 * Get organization statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;

    const stats = await getOrganizationStats(organizationId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Get organization stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get organization stats" },
      { status: 500 }
    );
  }
}
