import { NextRequest, NextResponse } from "next/server";
import {
  addCaseRequirement,
  completeRequirement,
} from "@/lib/cases/workflow";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * POST /api/cases/:id/requirements
 * Add a requirement to a case
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();
    const { type, description, dueDate, assignedTo } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: "type and description are required" },
        { status: 400 }
      );
    }

    const updatedCase = await addCaseRequirement(caseId, {
      type,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo,
    });

    return NextResponse.json({
      success: true,
      data: updatedCase,
    });
  } catch (error: any) {
    console.error("Add requirement error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add requirement" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/:id/requirements
 * Complete a requirement
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();
    const { requirementId, notes } = body;

    if (!requirementId) {
      return NextResponse.json(
        { error: "requirementId is required" },
        { status: 400 }
      );
    }

    const userId = await getUserIdOrDemo();

    const updatedCase = await completeRequirement(
      caseId,
      requirementId,
      userId,
      notes
    );

    return NextResponse.json({
      success: true,
      data: updatedCase,
    });
  } catch (error: any) {
    console.error("Complete requirement error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete requirement" },
      { status: 500 }
    );
  }
}
