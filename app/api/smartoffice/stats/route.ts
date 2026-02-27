import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/stats
 *
 * Get overview statistics
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Require authentication
    await requireAuth(request);

    const stats = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Get counts
      const [totalPolicies, totalAgents, lastSync] = await Promise.all([
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
      ]);

      // Calculate total premium
      const premiumResult = await db.smartOfficePolicy.aggregate({
        where: { tenantId: tenantContext.tenantId },
        _sum: {
          commAnnualizedPrem: true,
          weightedPremium: true,
        },
      });

      return {
        totalPolicies,
        totalAgents,
        totalPremium: premiumResult._sum.commAnnualizedPrem || 0,
        totalWeightedPremium: premiumResult._sum.weightedPremium || 0,
        lastSync: lastSync?.completedAt || null,
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
