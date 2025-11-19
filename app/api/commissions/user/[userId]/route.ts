import { NextRequest, NextResponse } from "next/server";
import { calculateUserCommissions } from "@/lib/commissions/calculator";

/**
 * GET /api/commissions/user/:userId
 * Get user's commission summary for a date range
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate query parameters are required" },
        { status: 400 }
      );
    }

    const summary = await calculateUserCommissions(
      userId,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("User commission summary error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate user commissions" },
      { status: 500 }
    );
  }
}
