import { NextRequest, NextResponse } from "next/server";
import { createCommissionRecords } from "@/lib/commissions/calculator";

/**
 * POST /api/commissions/create
 * Create commission records when a case is issued
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      caseId,
      carrier,
      policyNumber,
      grossPremium,
      commissionRate,
      type,
      periodStart,
      periodEnd,
    } = body;

    // Validate required fields
    if (
      !userId ||
      !caseId ||
      !carrier ||
      !policyNumber ||
      grossPremium === undefined ||
      commissionRate === undefined ||
      !type ||
      !periodStart ||
      !periodEnd
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create commission records
    await createCommissionRecords({
      userId,
      caseId,
      carrier,
      policyNumber,
      grossPremium: parseFloat(grossPremium),
      commissionRate: parseFloat(commissionRate),
      type,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
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
