import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";
import { requireAuth } from "@/lib/auth/server-auth";

// GET /api/notifications - Get all notifications for current user (tenant-scoped)
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

    const notifications = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.notification.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          userId: user.id,
        },
        orderBy: { createdAt: "desc" },
        take: 50, // Limit to last 50 notifications
      });
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
