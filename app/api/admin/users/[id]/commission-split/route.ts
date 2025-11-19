import { NextRequest, NextResponse } from "next/server";
import { getUserEffectiveCommissionSplit } from "@/lib/admin/commission-config";

/**
 * GET /api/admin/users/:id/commission-split
 * Get user's effective commission split across all organizations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const splits = await getUserEffectiveCommissionSplit(userId);

    return NextResponse.json({
      success: true,
      data: splits,
    });
  } catch (error: any) {
    console.error("Get user commission split error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get user commission split" },
      { status: 500 }
    );
  }
}
