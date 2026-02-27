import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";
import { requireAuth } from "@/lib/auth/server-auth";

// GET /api/contracts - Get all contracts for current user (tenant-scoped)
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication
    const user = await requireAuth(request);

    const contracts = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.contract.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          userId: user.id,
        },
        orderBy: { requestedAt: "desc" },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ contracts });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}
