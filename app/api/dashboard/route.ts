import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  calculateDashboardMetrics,
  calculateTimeSeriesData,
  calculateProductMix,
} from "@/lib/analytics/dashboard";

/**
 * GET /api/dashboard - Get enhanced dashboard data with real-time metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // For demo purposes, using the demo user ID
    // TODO: Replace with actual auth user ID from Supabase
    const userId = searchParams.get("userId") || "demo-user-id";

    // Calculate comprehensive dashboard metrics
    const [metrics, user, notifications, productMix, timeSeriesData] =
      await Promise.all([
        calculateDashboardMetrics(userId),
        prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        }),
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        calculateProductMix(userId),
        calculateTimeSeriesData(userId, "PREMIUM", 12),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        user,
        metrics,
        charts: {
          productMix,
          revenueTimeSeries: timeSeriesData,
        },
        notifications: notifications.map((n) => ({
          ...n,
          isNew: !n.isRead,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
