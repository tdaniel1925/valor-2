import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/charts/agent-performance
 *
 * Get top agents by premium
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
          primaryAdvisor: true,
          commAnnualizedPrem: true,
        },
      });

      // Group by agent and sum premiums
      const agentData: Record<string, number> = {};

      policies.forEach((policy) => {
        const agent = policy.primaryAdvisor;
        const premium = policy.commAnnualizedPrem || 0;

        agentData[agent] = (agentData[agent] || 0) + premium;
      });

      // Convert to array and get top 10
      const chartData = Object.entries(agentData)
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
    console.error('[SmartOffice] Agent performance chart error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agent performance data' },
      { status: 500 }
    );
  }
}
