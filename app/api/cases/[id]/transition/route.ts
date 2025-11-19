import { NextRequest, NextResponse } from "next/server";
import { transitionCaseStatus } from "@/lib/cases/workflow";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * POST /api/cases/:id/transition
 * Transition a case to a new status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();
    const { newStatus, notes, metadata } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "newStatus is required" },
        { status: 400 }
      );
    }

    const userId = await getUserIdOrDemo();

    const result = await transitionCaseStatus({
      caseId,
      newStatus,
      userId,
      notes,
      metadata,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Case transition error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transition case" },
      { status: 500 }
    );
  }
}
