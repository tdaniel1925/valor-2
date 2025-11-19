import { NextRequest, NextResponse } from "next/server";
import { bulkTransitionCases } from "@/lib/cases/workflow";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * POST /api/cases/bulk-transition
 * Transition multiple cases to a new status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseIds, newStatus, notes } = body;

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json(
        { error: "caseIds array is required" },
        { status: 400 }
      );
    }

    if (!newStatus) {
      return NextResponse.json(
        { error: "newStatus is required" },
        { status: 400 }
      );
    }

    const userId = await getUserIdOrDemo();

    const results = await bulkTransitionCases(caseIds, newStatus, userId, notes);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Bulk transition error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transition cases" },
      { status: 500 }
    );
  }
}
