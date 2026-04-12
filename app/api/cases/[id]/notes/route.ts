import { NextRequest, NextResponse } from "next/server";
import { addCaseNote, getCaseHistory } from "@/lib/cases/workflow";
import { getUserId } from "@/lib/auth/supabase";
import { z } from "zod";

// UUID validation schema for case ID
const caseIdSchema = z.string().uuid('Invalid case ID');

/**
 * GET /api/cases/:id/notes
 * Get all notes and history for a case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate case ID
    const caseId = caseIdSchema.parse(id);

    const history = await getCaseHistory(caseId);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error("Get case history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get case history" },
      { status: 500 }
    );
  }
}

// Schema for adding a note
const addNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(5000, 'Note cannot exceed 5,000 characters'),
  isInternal: z.boolean().default(false),
});

/**
 * POST /api/cases/:id/notes
 * Add a note to a case
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate case ID
    const caseId = caseIdSchema.parse(id);

    // Validate request body
    const body = await request.json();
    const validatedData = addNoteSchema.parse(body);

    const userId = await getUserId();

    const note = await addCaseNote(
      caseId,
      validatedData.content,
      userId,
      validatedData.isInternal
    );

    return NextResponse.json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error("Add case note error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add note" },
      { status: 500 }
    );
  }
}
