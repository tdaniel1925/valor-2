import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/agents/[id]
 *
 * Fetch a single agent by ID with their policies and performance metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const data = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Fetch the agent
      const agent = await db.smartOfficeAgent.findFirst({
        where: {
          id,
          tenantId: tenantContext.tenantId,
        },
      });

      if (!agent) {
        return null;
      }

      // Find all policies for this agent
      const policies = await db.smartOfficePolicy.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          primaryAdvisor: {
            contains: agent.fullName,
            mode: 'insensitive',
          },
        },
        orderBy: {
          statusDate: 'desc',
        },
      });

      // Calculate performance metrics
      const totalPolicies = policies.length;
      const totalPremium = policies.reduce((sum, p) => sum + (p.commAnnualizedPrem || 0), 0);
      const avgPremium = totalPolicies > 0 ? totalPremium / totalPolicies : 0;
      const totalCommission = policies.reduce((sum, p) =>
        sum + (p.firstYearCommission || 0) + (p.renewalCommission || 0), 0
      );

      // Status breakdown
      const statusBreakdown = policies.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Carrier breakdown (top 5)
      const carrierCounts = policies.reduce((acc, p) => {
        acc[p.carrierName] = (acc[p.carrierName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCarriers = Object.entries(carrierCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Recent policies (last 6 months by status date)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentPolicies = policies.filter(p =>
        p.statusDate && new Date(p.statusDate) >= sixMonthsAgo
      );

      const metrics = {
        totalPolicies,
        totalPremium,
        avgPremium,
        totalCommission,
        statusBreakdown,
        topCarriers,
        recentCount: recentPolicies.length,
      };

      return {
        agent,
        policies,
        metrics,
      };
    });

    if (!data) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Agent detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agent details' },
      { status: 500 }
    );
  }
}
