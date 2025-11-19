import { NextRequest, NextResponse } from "next/server";
import { getOrganizationPath } from "@/lib/admin/organization-management";

/**
 * GET /api/admin/organizations/:id/path
 * Get organization ancestry path (root to current)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;

    const path = await getOrganizationPath(organizationId);

    return NextResponse.json({
      success: true,
      data: path,
    });
  } catch (error: any) {
    console.error("Get organization path error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get organization path" },
      { status: 500 }
    );
  }
}
