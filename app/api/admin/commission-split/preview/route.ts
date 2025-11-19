import { NextRequest, NextResponse } from "next/server";
import { previewCommissionSplit } from "@/lib/admin/commission-config";

/**
 * POST /api/admin/commission-split/preview
 * Preview commission split for a case
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, totalCommission } = body;

    if (!caseId || !totalCommission) {
      return NextResponse.json(
        { error: "caseId and totalCommission are required" },
        { status: 400 }
      );
    }

    const preview = await previewCommissionSplit(caseId, totalCommission);

    return NextResponse.json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    console.error("Preview commission split error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to preview commission split" },
      { status: 500 }
    );
  }
}
