import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";

// GET /api/quotes - Get all quotes for current tenant
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // For demo purposes, using the demo user ID
    // TODO: Replace with actual auth user ID from Supabase
    const userId = "demo-user-id";

    // Use tenant-scoped database client with RLS
    const quotes = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.quote.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          agentId: userId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          case: {
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
