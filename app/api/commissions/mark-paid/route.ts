import { NextRequest, NextResponse } from "next/server";
import { markCommissionsPaid } from "@/lib/commissions/calculator";

/**
 * POST /api/commissions/mark-paid
 * Batch mark commissions as paid
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commissionIds } = body;

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        { error: "commissionIds array is required" },
        { status: 400 }
      );
    }

    await markCommissionsPaid(commissionIds);

    return NextResponse.json({
      success: true,
      message: `${commissionIds.length} commission(s) marked as paid`,
    });
  } catch (error: any) {
    console.error("Mark commissions paid error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark commissions as paid" },
      { status: 500 }
    );
  }
}
