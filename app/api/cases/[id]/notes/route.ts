import { NextRequest, NextResponse } from "next/server";
import { addCaseNote, getCaseHistory } from "@/lib/cases/workflow";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * GET /api/cases/:id/notes
 * Get all notes and history for a case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;

    const history = await getCaseHistory(caseId);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error("Get case history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get case history" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases/:id/notes
 * Add a note to a case
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();
    const { content, isInternal } = body;

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const userId = await getUserIdOrDemo();

    const note = await addCaseNote(
      caseId,
      content,
      userId,
      isInternal || false
    );

    return NextResponse.json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    console.error("Add case note error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add note" },
      { status: 500 }
    );
  }
}
