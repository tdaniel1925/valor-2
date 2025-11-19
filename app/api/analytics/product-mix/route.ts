import { NextRequest, NextResponse } from "next/server";
import { calculateProductMix } from "@/lib/analytics/dashboard";

/**
 * GET /api/analytics/product-mix
 * Get product mix breakdown
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user-id";

    const productMix = await calculateProductMix(userId);

    return NextResponse.json({
      success: true,
      data: productMix,
    });
  } catch (error: any) {
    console.error("Product mix analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate product mix" },
      { status: 500 }
    );
  }
}
