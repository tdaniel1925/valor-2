import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";
import { requireAuth } from "@/lib/auth/server-auth";

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

    // TODO: Add admin role check for user

    const contracts = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.contract.findMany({
        where: {
          tenantId: tenantContext.tenantId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          requestedAt: 'desc',
        },
      });
    });

    return NextResponse.json({ contracts });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[ADMIN_CONTRACTS_API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contracts',
      },
      { status: 500 }
    );
  }
}
