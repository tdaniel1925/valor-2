import { NextRequest, NextResponse } from "next/server";
import {
  getOrganizations,
  createOrganization,
} from "@/lib/admin/organization-management";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * GET /api/admin/organizations
 * Get all organizations with filters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await getOrganizations({
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      parentId: searchParams.get("parentId") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Get organizations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get organizations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/organizations
 * Create a new organization (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminId = await getUserIdOrDemo();

    const organization = await createOrganization(body, adminId);

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    console.error("Create organization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create organization" },
      { status: 500 }
    );
  }
}
