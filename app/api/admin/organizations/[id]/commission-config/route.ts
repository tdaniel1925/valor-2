import { NextRequest, NextResponse } from "next/server";
import {
  getOrganizationCommissionConfig,
  updateMemberCommissionSplit,
  bulkUpdateCommissionSplits,
  validateCommissionConfig,
  autoBalanceCommissionSplits,
} from "@/lib/admin/commission-config";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * GET /api/admin/organizations/:id/commission-config
 * Get commission split configuration for organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;

    const config = await getOrganizationCommissionConfig(organizationId);

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error("Get commission config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get commission configuration" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/organizations/:id/commission-config
 * Update commission split for a member
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const body = await request.json();
    const { userId, split } = body;

    if (!userId || split === undefined) {
      return NextResponse.json(
        { error: "userId and split are required" },
        { status: 400 }
      );
    }

    const adminId = await getUserIdOrDemo();

    const member = await updateMemberCommissionSplit(
      organizationId,
      userId,
      split,
      adminId
    );

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error: any) {
    console.error("Update commission split error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update commission split" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/organizations/:id/commission-config
 * Bulk update commission splits
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const body = await request.json();
    const { action, configs } = body;

    const adminId = await getUserIdOrDemo();

    if (action === "auto-balance") {
      const result = await autoBalanceCommissionSplits(organizationId, adminId);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    if (action === "bulk-update") {
      if (!configs || !Array.isArray(configs)) {
        return NextResponse.json(
          { error: "configs array is required for bulk update" },
          { status: 400 }
        );
      }

      const results = await bulkUpdateCommissionSplits(configs, adminId);

      return NextResponse.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          },
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'auto-balance' or 'bulk-update'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Commission config action error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform commission config action" },
      { status: 500 }
    );
  }
}
