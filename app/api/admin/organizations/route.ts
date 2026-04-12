import { NextRequest, NextResponse } from "next/server";
import {
  getOrganizations,
  createOrganization,
} from "@/lib/admin/organization-management";
import { getUserId } from "@/lib/auth/supabase";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { requireAdmin } from "@/lib/auth/server-auth";
import { createOrganizationSchema } from "@/lib/validation/admin-schemas";
import { ZodError } from "zod";

/**
 * GET /api/admin/organizations
 * Get all organizations with filters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireAdmin(request);

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
    // Require admin role
    await requireAdmin(request);

    const body = await request.json();

    // Validate input with Zod
    const validatedData = createOrganizationSchema.parse(body);

    const adminId = await getUserId();
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    const organization = await createOrganization(tenantContext.tenantId, validatedData, adminId);

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
