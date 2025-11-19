import { NextRequest, NextResponse } from "next/server";
import { validateCommissionConfig } from "@/lib/admin/commission-config";

/**
 * GET /api/admin/organizations/:id/commission-config/validate
 * Validate commission split configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;

    const validation = await validateCommissionConfig(organizationId);

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error: any) {
    console.error("Validate commission config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate commission configuration" },
      { status: 500 }
    );
  }
}
