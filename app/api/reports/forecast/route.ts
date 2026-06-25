import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { type PolicyWithMetadata } from '@/lib/smartoffice/data-service';
import { prisma } from '@/lib/db/prisma';
import { getScopedPolicies } from '@/lib/downline/service';

const ADMIN_ROLES = ['ADMINISTRATOR', 'EXECUTIVE'];

/**
 * GET /api/reports/forecast — commission forecast from the SmartOffice book
 * (single source of truth). Projections are based on the recent-period
 * commissionable-premium run-rate (commAnnualizedPrem) by statusDate.
 * Scoped to the user's own + downline policies (admins/executives see all).
 * Response shape is preserved for the page.
 */
const comm = (p: PolicyWithMetadata) => Number(p.commAnnualizedPrem) || 0;
const prem = (p: PolicyWithMetadata) => Number(p.targetAmount) || 0;

export async function GET(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    const authUser = await requireAuth(request);
    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id }, select: { email: true, role: true } });
    const email = dbUser?.email || authUser.email || '';
    const isAdmin = !!dbUser && ADMIN_ROLES.includes(dbUser.role);

    const timeframe = request.nextUrl.searchParams.get('timeframe') || '12month';
    const monthCount = timeframe === '3month' ? 3 : timeframe === '6month' ? 6 : 12;

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const allPolicies = (await getScopedPolicies(tenant.tenantId, email, isAdmin)) as PolicyWithMetadata[];

    // Historical book: policies with a statusDate in the last 6 months.
    const historical = allPolicies.filter((p) => {
      const d = p.statusDate ? new Date(p.statusDate) : null;
      return !!d && d >= sixMonthsAgo && d <= now;
    });

    // Monthly commissionable totals (run-rate basis).
    const monthlyTotals: Record<string, number> = {};
    historical.forEach((p) => {
      const d = new Date(p.statusDate as Date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + comm(p);
    });

    const monthsObserved = Object.keys(monthlyTotals).length || 1;
    const historicalMonthlyAverage =
      Object.values(monthlyTotals).reduce((s, v) => s + v, 0) / monthsObserved;

    // Growth trend: average month-over-month change across observed months,
    // CLAMPED to a sane band so lumpy book data can't produce runaway forecasts.
    const sortedMonths = Object.entries(monthlyTotals).sort((a, b) => a[0].localeCompare(b[0]));
    let growthRate = 0;
    if (sortedMonths.length >= 2) {
      const deltas: number[] = [];
      for (let m = 1; m < sortedMonths.length; m++) {
        const prev = sortedMonths[m - 1][1];
        const curr = sortedMonths[m][1];
        if (prev > 0) deltas.push((curr - prev) / prev);
      }
      const avgDelta = deltas.length ? deltas.reduce((s, v) => s + v, 0) / deltas.length : 0;
      // Clamp monthly growth to ±10% so a 12-month projection stays realistic.
      growthRate = Math.max(-0.1, Math.min(0.1, avgDelta));
    }

    // Monthly forecast with conservative/projected/optimistic bands.
    const monthlyForecast = [];
    for (let i = 0; i < monthCount; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + i);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Compound the clamped monthly growth rate (stable, not linear blow-up).
      const baseProjected = historicalMonthlyAverage * Math.pow(1 + growthRate, i);
      const variance = baseProjected * 0.15;

      monthlyForecast.push({
        month,
        conservative: Math.floor(baseProjected - variance),
        projected: Math.floor(baseProjected),
        optimistic: Math.floor(baseProjected + variance),
        actual: undefined as number | undefined,
      });
    }

    // Forecast by agent (recent-performance run-rate per advisor).
    const agentTotals: Record<string, number[]> = {};
    historical.forEach((p) => {
      const name = p.primaryAdvisor || 'Unknown';
      if (!agentTotals[name]) agentTotals[name] = [];
      agentTotals[name].push(comm(p));
    });

    const byAgent = Object.entries(agentTotals)
      .map(([agentName, amounts]) => {
        const avgMonthly = amounts.reduce((s, v) => s + v, 0) / monthsObserved;
        const mean = amounts.length ? amounts.reduce((s, v) => s + v, 0) / amounts.length : 0;
        const variance =
          amounts.length > 0
            ? Math.sqrt(amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length)
            : 0;
        const confidence =
          mean > 0 ? Math.min(95, Math.max(50, 100 - (variance / mean) * 100)) : 50;
        return {
          agentName,
          projected: Math.floor(avgMonthly * (1 + growthRate)),
          confidence: Math.floor(confidence),
        };
      })
      .filter((a) => a.projected > 0)
      .sort((a, b) => b.projected - a.projected)
      .slice(0, 10);

    // Forecast by carrier (recent-period premium run-rate).
    const carrierTotals: Record<string, number> = {};
    historical.forEach((p) => {
      const name = p.carrierName || 'Unknown';
      carrierTotals[name] = (carrierTotals[name] || 0) + prem(p);
    });
    const totalCarrierPremium = Object.values(carrierTotals).reduce((s, v) => s + v, 0);
    const byCarrier = Object.entries(carrierTotals)
      .map(([carrierName, total]) => ({
        carrierName,
        projected: Math.floor(total / 6), // monthly average over the 6-month window
        percentage: totalCarrierPremium > 0 ? (total / totalCarrierPremium) * 100 : 0,
      }))
      .sort((a, b) => b.projected - a.projected)
      .slice(0, 10);

    const nextMonth = monthlyForecast[0]?.projected || 0;
    const nextQuarter = monthlyForecast.slice(0, 3).reduce((s, m) => s + m.projected, 0);
    const nextYear = monthlyForecast.reduce((s, m) => s + m.projected, 0);

    // Confidence: agent-level average where available, else a neutral default.
    const confidenceLevel = byAgent.length
      ? Math.round(byAgent.reduce((s, a) => s + a.confidence, 0) / byAgent.length)
      : 75;

    // Assumptions block (page reads these three fields).
    const totalCommissionable = historical.reduce((s, p) => s + comm(p), 0);
    const totalAnnualPremium = historical.reduce((s, p) => s + prem(p), 0);
    const averageCommissionRate =
      totalAnnualPremium > 0 ? (totalCommissionable / totalAnnualPremium) * 100 : 0;

    return NextResponse.json({
      summary: {
        nextMonth,
        nextQuarter,
        nextYear,
        confidenceLevel,
      },
      monthlyForecast,
      byAgent,
      byCarrier,
      assumptions: {
        averageCommissionRate: Math.round(averageCommissionRate * 10) / 10,
        expectedGrowthRate: Math.round(growthRate * 1000) / 10,
        historicalAccuracy: confidenceLevel,
      },
      timeframe,
    });
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
