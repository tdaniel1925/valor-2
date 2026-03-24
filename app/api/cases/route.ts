import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";
import { requireAuth } from "@/lib/auth/server-auth";
import prisma from "@/lib/db/prisma";

// GET /api/cases - Get all cases for current tenant
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    const user = await requireAuth(request);
    const userId = user.id;

    // Use tenant-scoped database client with RLS
    const cases = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.case.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          userId: userId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          quote: {
            select: {
              id: true,
              type: true,
              carrier: true,
              premium: true,
              status: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}
