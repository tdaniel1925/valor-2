import { NextRequest, NextResponse } from "next/server";
import { getCasesPendingAction, getCaseStatistics } from "@/lib/cases/workflow";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/cases/pending
 * Get cases pending action
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and get user ID from session
    const user = await requireAuth(request);
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") === "true";

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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Get pending cases error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get pending cases" },
      { status: 500 }
    );
  }
}
