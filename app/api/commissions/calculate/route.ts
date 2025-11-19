import { NextRequest, NextResponse } from "next/server";
import { calculateCommission } from "@/lib/commissions/calculator";

/**
 * POST /api/commissions/calculate
 * Preview commission splits before creating records
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

    // Calculate commission splits
    const result = await calculateCommission({
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
      data: result,
    });
  } catch (error: any) {
    console.error("Commission calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate commission" },
      { status: 500 }
    );
  }
}
