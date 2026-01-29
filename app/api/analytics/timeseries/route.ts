import { NextRequest, NextResponse } from "next/server";
import { calculateTimeSeriesData } from "@/lib/analytics/dashboard";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/analytics/timeseries
 * Get time-series data for charts
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and get user ID from session
    const user = await requireAuth(request);
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") || "PREMIUM";
    const months = parseInt(searchParams.get("months") || "12");

    if (!["PREMIUM", "COMMISSIONS", "CASES"].includes(metric)) {
      return NextResponse.json(
        { error: "metric must be PREMIUM, COMMISSIONS, or CASES" },
        { status: 400 }
      );
    }

    const data = await calculateTimeSeriesData(
      userId,
      metric as "PREMIUM" | "COMMISSIONS" | "CASES",
      months
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Time series analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate time series data" },
      { status: 500 }
    );
  }
}
