import { NextRequest, NextResponse } from "next/server";
import { createCommissionRecords } from "@/lib/commissions/calculator";
import { createCommissionSchema } from "@/lib/validation/commission-schemas";
import { ZodError } from "zod";

/**
 * POST /api/commissions/create
 * Create commission records when a case is issued
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createCommissionSchema.parse(body);

    // Create commission records
    await createCommissionRecords({
      userId: validatedData.userId,
      caseId: validatedData.caseId,
      carrier: validatedData.carrier,
      policyNumber: validatedData.policyNumber,
      grossPremium: typeof validatedData.grossPremium === 'string'
        ? parseFloat(validatedData.grossPremium)
        : validatedData.grossPremium,
      commissionRate: typeof validatedData.commissionRate === 'string'
        ? parseFloat(validatedData.commissionRate)
        : validatedData.commissionRate,
      type: validatedData.type,
      periodStart: typeof validatedData.periodStart === 'string'
        ? new Date(validatedData.periodStart)
        : validatedData.periodStart,
      periodEnd: typeof validatedData.periodEnd === 'string'
        ? new Date(validatedData.periodEnd)
        : validatedData.periodEnd,
    });

    return NextResponse.json({
      success: true,
      message: "Commission records created successfully",
    });
  } catch (error: any) {
    console.error("Commission creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create commission records" },
      { status: 500 }
    );
  }
}
