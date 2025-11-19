import { NextRequest, NextResponse } from "next/server";
import { calculateTimeSeriesData } from "@/lib/analytics/dashboard";

/**
 * GET /api/analytics/timeseries
 * Get time-series data for charts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user-id";
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
    console.error("Time series analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate time series data" },
      { status: 500 }
    );
  }
}
