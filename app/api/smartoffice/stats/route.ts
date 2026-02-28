import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/stats
 *
 * Get overview statistics
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

    const stats = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Calculate start of current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get counts
      const [totalPolicies, totalAgents, lastSync, pendingCount, thisMonthCount] = await Promise.all([
        db.smartOfficePolicy.count({
          where: { tenantId: tenantContext.tenantId },
        }),
        db.smartOfficeAgent.count({
          where: { tenantId: tenantContext.tenantId },
        }),
        db.smartOfficeSyncLog.findFirst({
          where: {
            tenantId: tenantContext.tenantId,
            status: 'success',
          },
          orderBy: { completedAt: 'desc' },
        }),
        // Count pending policies
        db.smartOfficePolicy.count({
          where: {
            tenantId: tenantContext.tenantId,
            status: 'PENDING',
          },
        }),
        // Count policies from this month
        db.smartOfficePolicy.count({
          where: {
            tenantId: tenantContext.tenantId,
            statusDate: {
              gte: firstDayOfMonth,
            },
          },
        }),
      ]);

      // Calculate total premium
      const premiumResult = await db.smartOfficePolicy.aggregate({
        where: { tenantId: tenantContext.tenantId },
        _sum: {
          commAnnualizedPrem: true,
          weightedPremium: true,
        },
      });

      // Get top 5 carriers by policy count
      const carrierCounts = await db.smartOfficePolicy.groupBy({
        by: ['carrierName'],
        where: { tenantId: tenantContext.tenantId },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      const topCarriers = carrierCounts.map(c => ({
        name: c.carrierName,
        count: c._count.id,
      }));

      return {
        totalPolicies,
        totalAgents,
        totalPremium: premiumResult._sum.commAnnualizedPrem || 0,
        totalWeightedPremium: premiumResult._sum.weightedPremium || 0,
        lastSync: lastSync?.completedAt || null,
        pendingCount,
        thisMonthCount,
        topCarriers,
      };
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Fetch stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
