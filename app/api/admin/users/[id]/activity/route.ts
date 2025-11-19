import { NextRequest, NextResponse } from "next/server";
import { getUserActivity } from "@/lib/admin/user-management";

/**
 * GET /api/admin/users/:id/activity
 * Get user activity statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days")
      ? parseInt(searchParams.get("days")!)
      : 30;

    const activity = await getUserActivity(userId, days);

    return NextResponse.json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    console.error("Get user activity error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get user activity" },
      { status: 500 }
    );
  }
}
