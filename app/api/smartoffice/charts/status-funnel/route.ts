import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/charts/status-funnel
 *
 * Get status distribution (conversion funnel)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Require authentication
    await requireAuth(request);

    const data = await withTenantContext(tenantContext.tenantId, async (db) => {
      const statusCounts = await db.smartOfficePolicy.groupBy({
        by: ['status'],
        where: {
          tenantId: tenantContext.tenantId,
        },
        _count: {
          id: true,
        },
      });

      // Convert to chart format with funnel order
      const statusOrder = ['PENDING', 'SUBMITTED', 'INFORCE', 'DECLINED', 'WITHDRAWN'];

      const chartData = statusOrder
        .map((status) => {
          const found = statusCounts.find((s) => s.status === status);
          return {
            name: status,
            value: found ? found._count.id : 0,
          };
        })
        .filter((item) => item.value > 0); // Only include statuses with data

      return chartData;
    });

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Status funnel chart error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status funnel data' },
      { status: 500 }
    );
  }
}
