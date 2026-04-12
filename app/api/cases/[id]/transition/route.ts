import { NextRequest, NextResponse } from "next/server";
import { transitionCaseStatus } from "@/lib/cases/workflow";
import { getUserId } from "@/lib/auth/supabase";
import { z } from "zod";

// UUID validation schema for case ID
const caseIdSchema = z.string().uuid('Invalid case ID');

// Case status enum
const caseStatusSchema = z.enum([
  'LEAD',
  'CONTACTED',
  'QUOTED',
  'SUBMITTED',
  'UNDERWRITING',
  'APPROVED',
  'ISSUED',
  'DECLINED',
  'CANCELLED',
  'LAPSED',
]);

// Transition request schema
const transitionSchema = z.object({
  newStatus: caseStatusSchema,
  notes: z.string().max(1000, 'Notes cannot exceed 1,000 characters').optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/cases/:id/transition
 * Transition a case to a new status
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
    const validatedData = transitionSchema.parse(body);

    const userId = await getUserId();

    const result = await transitionCaseStatus({
      caseId,
      newStatus: validatedData.newStatus,
      userId,
      notes: validatedData.notes,
      metadata: validatedData.metadata,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error("Case transition error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transition case" },
      { status: 500 }
    );
  }
}
