import { NextRequest, NextResponse } from "next/server";
import { getGoalLeaderboard } from "@/lib/goals/calculator";

/**
 * GET /api/goals/leaderboard
 * Get goal leaderboard for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get("organizationId");
    const metric = searchParams.get("metric");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!organizationId || !metric || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: organizationId, metric, startDate, endDate",
        },
        { status: 400 }
      );
    }

    const leaderboard = await getGoalLeaderboard(
      organizationId,
      metric,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({
      success: true,
      data: leaderboard,
    });
  } catch (error: any) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}
