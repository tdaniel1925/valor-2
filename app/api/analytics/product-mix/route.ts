import { NextRequest, NextResponse } from "next/server";
import { calculateProductMix } from "@/lib/analytics/dashboard";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/analytics/product-mix
 * Get product mix breakdown
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and get user ID from session
    const user = await requireAuth(request);
    const userId = user.id;

    const productMix = await calculateProductMix(userId);

    return NextResponse.json({
      success: true,
      data: productMix,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Product mix analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate product mix" },
      { status: 500 }
    );
  }
}
