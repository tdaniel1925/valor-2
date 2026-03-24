import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

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
    const timeframe = searchParams.get('timeframe') || '12month';
    const monthCount = timeframe === '3month' ? 3 : timeframe === '6month' ? 6 : 12;

    const data = await withTenantContext(tenantContext.tenantId, async (db) => {
      const now = new Date();

      // Get historical commissions for the last 6 months to calculate trends
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const historicalCommissions = await db.commission.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          amount: true,
          createdAt: true,
          userId: true,
        },
      });

      // Calculate monthly historical averages
      const monthlyTotals: { [key: string]: number } = {};
      historicalCommissions.forEach((comm) => {
        const monthKey = `${comm.createdAt.getFullYear()}-${comm.createdAt.getMonth()}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + comm.amount;
      });

      const historicalMonthlyAverage =
        Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0) /
        (Object.keys(monthlyTotals).length || 1);

      // Calculate growth trend
      const sortedMonths = Object.entries(monthlyTotals).sort((a, b) => a[0].localeCompare(b[0]));
      let growthRate = 0;
      if (sortedMonths.length >= 2) {
        const firstMonth = sortedMonths[0][1];
        const lastMonth = sortedMonths[sortedMonths.length - 1][1];
        growthRate = firstMonth > 0 ? (lastMonth - firstMonth) / firstMonth : 0;
      }

      // Generate monthly forecasts
      const monthlyForecast = [];
      for (let i = 0; i < monthCount; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() + i);
        const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        // Apply growth rate to projection
        const baseProjected = historicalMonthlyAverage * (1 + growthRate * i);
        const variance = baseProjected * 0.15;

        monthlyForecast.push({
          month,
          conservative: Math.floor(baseProjected - variance),
          projected: Math.floor(baseProjected),
          optimistic: Math.floor(baseProjected + variance),
          actual: undefined, // Could fill with actual data for past months
        });
      }

      // Forecast by agent (using recent performance)
      const users = await db.user.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          role: { in: ['AGENT', 'MANAGER'] },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      const byAgent = await Promise.all(
        users.slice(0, 10).map(async (user) => {
          const userCommissions = historicalCommissions.filter((c) => c.userId === user.id);
          const avgMonthly =
            userCommissions.reduce((sum, c) => sum + c.amount, 0) /
            (Object.keys(monthlyTotals).length || 1);

          // Simple confidence based on consistency
          const variance =
            userCommissions.length > 0
              ? Math.sqrt(
                  userCommissions.reduce((sum, c) => sum + Math.pow(c.amount - avgMonthly, 2), 0) /
                    userCommissions.length
                )
              : 0;
          const confidence = Math.min(95, Math.max(50, 100 - (variance / avgMonthly) * 100));

          return {
            agentName: `${user.firstName} ${user.lastName}`,
            projected: Math.floor(avgMonthly * (1 + growthRate)),
            confidence: Math.floor(confidence),
          };
        })
      );

      // Sort by projected amount
      byAgent.sort((a, b) => b.projected - a.projected);

      // Forecast by carrier (from recent quotes)
      const recentQuotes = await db.quote.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          createdAt: { gte: sixMonthsAgo },
          carrier: { not: null },
        },
        select: {
          carrier: true,
          premium: true,
        },
      });

      const carrierTotals: { [key: string]: number } = {};
      recentQuotes.forEach((quote) => {
        if (quote.carrier) {
          carrierTotals[quote.carrier] = (carrierTotals[quote.carrier] || 0) + (quote.premium || 0);
        }
      });

      const totalCarrierPremium = Object.values(carrierTotals).reduce((sum, val) => sum + val, 0);
      const byCarrier = Object.entries(carrierTotals)
        .map(([carrierName, total]) => ({
          carrierName,
          projected: Math.floor(total / 6), // Monthly average
          percentage: totalCarrierPremium > 0 ? (total / totalCarrierPremium) * 100 : 0,
        }))
        .sort((a, b) => b.projected - a.projected)
        .slice(0, 10);

      // Calculate summary
      const nextMonth = monthlyForecast[0]?.projected || 0;
      const nextQuarter = monthlyForecast.slice(0, 3).reduce((sum, m) => sum + m.projected, 0);
      const nextYear = monthlyForecast.reduce((sum, m) => sum + m.projected, 0);

      return {
        summary: {
          nextMonth,
          nextQuarter,
          nextYear,
          confidence: 75, // TODO: Calculate based on data consistency
          trend: growthRate > 0 ? 'UP' : growthRate < 0 ? 'DOWN' : 'STABLE',
          growthRate: Math.round(growthRate * 100),
        },
        monthlyForecast,
        byAgent: byAgent.filter((a) => a.projected > 0),
        byCarrier,
        timeframe,
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Forecast API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
