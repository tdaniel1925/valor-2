import { NextRequest, NextResponse } from "next/server";
import { getCommissionSplitHistory } from "@/lib/admin/commission-config";

/**
 * GET /api/admin/organizations/:id/commission-config/history
 * Get commission split configuration history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;

    const history = await getCommissionSplitHistory(organizationId, limit);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error("Get commission config history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get commission configuration history" },
      { status: 500 }
    );
  }
}
