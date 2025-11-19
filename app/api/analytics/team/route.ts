import { NextRequest, NextResponse } from "next/server";
import { calculateTeamMetrics } from "@/lib/analytics/dashboard";

/**
 * GET /api/analytics/team
 * Get team analytics for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId query parameter is required" },
        { status: 400 }
      );
    }

    const teamMetrics = await calculateTeamMetrics(organizationId);

    return NextResponse.json({
      success: true,
      data: teamMetrics,
    });
  } catch (error: any) {
    console.error("Team analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate team analytics" },
      { status: 500 }
    );
  }
}
