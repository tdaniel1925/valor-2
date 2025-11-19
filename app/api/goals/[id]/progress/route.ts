import { NextRequest, NextResponse } from "next/server";
import { calculateGoalProgress } from "@/lib/goals/calculator";

/**
 * GET /api/goals/:id/progress
 * Get detailed progress for a specific goal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const progress = await calculateGoalProgress(id);

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error("Goal progress error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate goal progress" },
      { status: 500 }
    );
  }
}
