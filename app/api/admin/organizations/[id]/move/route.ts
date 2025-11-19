import { NextRequest, NextResponse } from "next/server";
import { moveOrganization } from "@/lib/admin/organization-management";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * POST /api/admin/organizations/:id/move
 * Move organization to a new parent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const body = await request.json();
    const { newParentId } = body;

    const adminId = await getUserIdOrDemo();

    await moveOrganization(organizationId, newParentId || null, adminId);

    return NextResponse.json({
      success: true,
      message: "Organization moved successfully",
    });
  } catch (error: any) {
    console.error("Move organization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to move organization" },
      { status: 500 }
    );
  }
}
