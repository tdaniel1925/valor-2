import { NextRequest, NextResponse } from "next/server";
import { getCasesPendingAction, getCaseStatistics } from "@/lib/cases/workflow";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * GET /api/cases/pending
 * Get cases pending action
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") === "true";
    const userIdParam = searchParams.get("userId");

    const userId = userIdParam || (await getUserIdOrDemo());

    const pendingCases = await getCasesPendingAction(userId);

    const response: any = {
      success: true,
      data: {
        cases: pendingCases,
      },
    };

    if (includeStats) {
      const stats = await getCaseStatistics(userId);
      response.data.statistics = stats;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Get pending cases error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get pending cases" },
      { status: 500 }
    );
  }
}
