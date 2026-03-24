import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";
import { requireAuth } from "@/lib/auth/server-auth";

// GET /api/quotes - Get all quotes for current tenant
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
    const quotes = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.quote.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          userId: userId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          cases: {
            select: {
              id: true,
              clientName: true,
              status: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
