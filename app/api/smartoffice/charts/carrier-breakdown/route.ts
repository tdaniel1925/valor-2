import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/charts/carrier-breakdown
 *
 * Get carrier distribution by premium
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
      const policies = await db.smartOfficePolicy.findMany({
        where: {
          tenantId: tenantContext.tenantId,
        },
        select: {
          carrierName: true,
          commAnnualizedPrem: true,
        },
      });

      // Group by carrier and sum premiums
      const carrierData: Record<string, number> = {};

      policies.forEach((policy) => {
        const carrier = policy.carrierName;
        const premium = policy.commAnnualizedPrem || 0;

        carrierData[carrier] = (carrierData[carrier] || 0) + premium;
      });

      // Convert to array and get top 10
      const chartData = Object.entries(carrierData)
        .map(([name, value]) => ({
          name,
          value: Math.round(value),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

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
    console.error('[SmartOffice] Carrier breakdown chart error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch carrier breakdown data' },
      { status: 500 }
    );
  }
}
