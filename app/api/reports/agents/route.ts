import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

function getDateRange(period: string) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'mtd':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'qtd':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'ytd':
    default:
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return { startDate, endDate: now };
}

export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'ytd';
    const { startDate, endDate } = getDateRange(period);

    const data = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Get all agents in the tenant
      const agents = await db.user.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          role: { in: ['AGENT', 'MANAGER'] },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      // Get metrics for each agent
      const agentMetrics = await Promise.all(
        agents.map(async (agent) => {
          // Get cases for this agent
          const cases = await db.case.findMany({
            where: {
              tenantId: tenantContext.tenantId,
              userId: agent.id,
              createdAt: { gte: startDate, lte: endDate },
            },
            include: {
              quote: {
                select: {
                  premium: true,
                  type: true,
                },
              },
            },
          });

          // Get commissions
          const commissions = await db.commission.aggregate({
            where: {
              tenantId: tenantContext.tenantId,
              userId: agent.id,
              createdAt: { gte: startDate, lte: endDate },
            },
            _sum: {
              amount: true,
            },
          });

          // Calculate metrics
          const totalPremium = cases.reduce(
            (sum, c) => sum + (c.quote?.premium || 0),
            0
          );
          const policyCount = cases.filter((c) => c.status === 'APPROVED').length;
          const averageCase = policyCount > 0 ? totalPremium / policyCount : 0;

          // Product mix
          const productCounts = cases.reduce(
            (acc, c) => {
              const type = c.quote?.type || 'OTHER';
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          const totalCases = cases.length || 1;
          const productMix = {
            life: ((productCounts['TERM_LIFE'] || 0) / totalCases) * 100,
            annuity: ((productCounts['ANNUITY'] || 0) / totalCases) * 100,
            term: ((productCounts['WHOLE_LIFE'] || 0) / totalCases) * 100,
          };

          // Monthly trend (last 6 months)
          const monthlyTrend = [];
          for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthCases = cases.filter(
              (c) =>
                c.createdAt >= monthStart && c.createdAt <= monthEnd
            );

            const monthPremium = monthCases.reduce(
              (sum, c) => sum + (c.quote?.premium || 0),
              0
            );

            monthlyTrend.push({
              month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
              premium: monthPremium,
              cases: monthCases.length,
            });
          }

          return {
            userId: agent.id,
            agentName: `${agent.firstName} ${agent.lastName}`,
            email: agent.email,
            organization: '', // TODO: Add org relationship if needed
            totalPremium,
            policyCount,
            averageCase,
            conversionRate: 0, // TODO: Calculate from quotes vs cases
            quoteToAppRatio: 0, // TODO: Calculate
            averageTimeToClose: 0, // TODO: Calculate from case dates
            persistency: 0, // TODO: Calculate
            rank: 0, // Will be calculated after sorting
            growth: 0, // TODO: Compare with previous period
            productMix,
            monthlyTrend,
          };
        })
      );

      // Sort by total premium and assign ranks
      agentMetrics.sort((a, b) => b.totalPremium - a.totalPremium);
      agentMetrics.forEach((agent, index) => {
        agent.rank = index + 1;
      });

      // Calculate summary
      const totalAgents = agentMetrics.length;
      const activeAgents = agentMetrics.filter((a) => a.policyCount > 0).length;
      const averagePremium =
        agentMetrics.reduce((sum, a) => sum + a.totalPremium, 0) / (totalAgents || 1);
      const topPerformerGrowth = Math.max(...agentMetrics.map((a) => a.growth), 0);

      return {
        summary: {
          totalAgents,
          activeAgents,
          averagePremium: Math.round(averagePremium),
          topPerformerGrowth: Math.round(topPerformerGrowth),
        },
        agents: agentMetrics,
        period,
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Agent analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent analytics' },
      { status: 500 }
    );
  }
}
