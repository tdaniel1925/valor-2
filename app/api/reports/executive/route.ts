import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { type PolicyWithMetadata } from '@/lib/smartoffice/data-service';
import { prisma } from '@/lib/db/prisma';
import { getScopedPolicies } from '@/lib/downline/service';
import { statusBucket } from '@/lib/ai/valor-data-adapter';

const ADMIN_ROLES = ['ADMINISTRATOR', 'EXECUTIVE'];

/**
 * GET /api/reports/executive — executive dashboard from the SmartOffice book
 * (single source of truth). Policies are the unit of production; "premium" =
 * targetAmount (annual), "commission" = commAnnualizedPrem (commissionable).
 * Periods are derived by filtering on statusDate. Response shape is preserved
 * so the consuming page (app/reports/executive/page.tsx) keeps rendering.
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    const authUser = await requireAuth(request);
    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id }, select: { email: true, role: true } });
    const email = dbUser?.email || authUser.email || '';
    const isAdmin = !!dbUser && ADMIN_ROLES.includes(dbUser.role);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const ytdStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

    const allPolicies = (await getScopedPolicies(tenant.tenantId, email, isAdmin)) as PolicyWithMetadata[];

    const inRange = (p: PolicyWithMetadata, start: Date, end: Date) => {
      const d = p.statusDate ? new Date(p.statusDate) : null;
      return !!d && d >= start && d <= end;
    };

    const ytdCases = allPolicies.filter((p) => inRange(p, ytdStart, now));
    const lastYearCases = allPolicies.filter((p) => inRange(p, lastYearStart, lastYearEnd));
    const thisMonthCases = allPolicies.filter((p) => inRange(p, thisMonthStart, now));
    const lastMonthCases = allPolicies.filter((p) => inRange(p, lastMonthStart, lastMonthEnd));

    const prem = (p: PolicyWithMetadata) => Number(p.targetAmount) || 0;
    const comm = (p: PolicyWithMetadata) => Number(p.commAnnualizedPrem) || 0;
    const isInforce = (p: PolicyWithMetadata) => statusBucket(p.status) === 'INFORCE';
    const isPending = (p: PolicyWithMetadata) => statusBucket(p.status) === 'PENDING';

    const calculateMetrics = (cases: PolicyWithMetadata[]) => {
      const totalCases = cases.length;
      const totalPremium = cases.reduce((sum, c) => sum + prem(c), 0);
      const totalCommission = cases.reduce((sum, c) => sum + comm(c), 0);
      // INFORCE or PENDING == submitted; INFORCE == issued.
      const submittedCases = cases.filter((c) => isInforce(c) || isPending(c)).length;
      const issuedCases = cases.filter(isInforce).length;

      return {
        totalCases,
        totalPremium,
        totalCommission,
        submittedCases,
        issuedCases,
        averagePremium: totalCases > 0 ? totalPremium / totalCases : 0,
        conversionRate: totalCases > 0 ? (submittedCases / totalCases) * 100 : 0,
        issueRate: submittedCases > 0 ? (issuedCases / submittedCases) * 100 : 0,
      };
    };

    const ytdMetrics = calculateMetrics(ytdCases);
    const lastYearMetrics = calculateMetrics(lastYearCases);
    const thisMonthMetrics = calculateMetrics(thisMonthCases);
    const lastMonthMetrics = calculateMetrics(lastMonthCases);

    const growthVsLastYear = {
      cases:
        lastYearMetrics.totalCases > 0
          ? ((ytdMetrics.totalCases - lastYearMetrics.totalCases) / lastYearMetrics.totalCases) * 100
          : 0,
      premium:
        lastYearMetrics.totalPremium > 0
          ? ((ytdMetrics.totalPremium - lastYearMetrics.totalPremium) / lastYearMetrics.totalPremium) * 100
          : 0,
      commission:
        lastYearMetrics.totalCommission > 0
          ? ((ytdMetrics.totalCommission - lastYearMetrics.totalCommission) / lastYearMetrics.totalCommission) * 100
          : 0,
    };

    const growthVsLastMonth = {
      cases:
        lastMonthMetrics.totalCases > 0
          ? ((thisMonthMetrics.totalCases - lastMonthMetrics.totalCases) / lastMonthMetrics.totalCases) * 100
          : 0,
      premium:
        lastMonthMetrics.totalPremium > 0
          ? ((thisMonthMetrics.totalPremium - lastMonthMetrics.totalPremium) / lastMonthMetrics.totalPremium) * 100
          : 0,
    };

    // Monthly trend across the current year (Jan..Dec).
    const monthlyTrend = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), i, 1);
      const monthEnd = new Date(now.getFullYear(), i + 1, 0);
      const monthCases = ytdCases.filter((c) => inRange(c, monthStart, monthEnd));

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        cases: monthCases.length,
        premium: monthCases.reduce((sum, c) => sum + prem(c), 0),
        commission: monthCases.reduce((sum, c) => sum + comm(c), 0),
        submitted: monthCases.filter((c) => isInforce(c) || isPending(c)).length,
        issued: monthCases.filter(isInforce).length,
      });
    }

    // Product mix (by premium) with percentage.
    const productMix = ytdCases.reduce(
      (acc: Record<string, { count: number; premium: number; percentage: number }>, c) => {
        const type = c.type || c.productName || 'Unknown';
        if (!acc[type]) acc[type] = { count: 0, premium: 0, percentage: 0 };
        acc[type].count++;
        acc[type].premium += prem(c);
        return acc;
      },
      {}
    );
    Object.keys(productMix).forEach((key) => {
      productMix[key].percentage =
        ytdMetrics.totalPremium > 0 ? (productMix[key].premium / ytdMetrics.totalPremium) * 100 : 0;
    });

    // Agents are derived by grouping policies on primaryAdvisor (the book links
    // policies to agents by name). "Total" agents = distinct advisors in the book;
    // "active" = advisors with at least one YTD policy.
    const allAdvisors = new Set(
      allPolicies.map((p) => p.primaryAdvisor).filter((n): n is string => !!n)
    );
    const activeAdvisors = new Set(
      ytdCases.map((p) => p.primaryAdvisor).filter((n): n is string => !!n)
    );
    const agentCount = allAdvisors.size;
    const activeAgents = activeAdvisors.size;

    // Pipeline by raw status string.
    const pipelineByStatus = ytdCases.reduce((acc: Record<string, { count: number; premium: number }>, c) => {
      const status = c.status || 'Unknown';
      if (!acc[status]) acc[status] = { count: 0, premium: 0 };
      acc[status].count++;
      acc[status].premium += prem(c);
      return acc;
    }, {});

    // Top performers grouped by advisor name. Page reads `agent.{id,firstName,lastName}`,
    // so we synthesize an `agent` object keyed on the advisor name (no user table).
    const agentPerformance = ytdCases.reduce(
      (
        acc: Record<string, { agent: { id: string; firstName: string; lastName: string }; cases: number; premium: number; commission: number }>,
        c
      ) => {
        const name = c.primaryAdvisor || 'Unknown';
        if (!acc[name]) {
          acc[name] = { agent: { id: name, firstName: name, lastName: '' }, cases: 0, premium: 0, commission: 0 };
        }
        acc[name].cases++;
        acc[name].premium += prem(c);
        acc[name].commission += comm(c);
        return acc;
      },
      {}
    );
    const topAgents = Object.values(agentPerformance)
      .sort((a, b) => b.premium - a.premium)
      .slice(0, 5);

    // Carrier distribution.
    const carrierDistribution = ytdCases.reduce((acc: Record<string, { count: number; premium: number }>, c) => {
      const carrier = c.carrierName || 'Unknown';
      if (!acc[carrier]) acc[carrier] = { count: 0, premium: 0 };
      acc[carrier].count++;
      acc[carrier].premium += prem(c);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ytd: ytdMetrics,
      lastYear: lastYearMetrics,
      thisMonth: thisMonthMetrics,
      lastMonth: lastMonthMetrics,
      growth: {
        vsLastYear: growthVsLastYear,
        vsLastMonth: growthVsLastMonth,
      },
      monthlyTrend,
      productMix,
      agents: {
        total: agentCount,
        active: activeAgents,
        activePercentage: agentCount > 0 ? (activeAgents / agentCount) * 100 : 0,
      },
      pipeline: pipelineByStatus,
      topAgents,
      carrierDistribution,
    });
  } catch (error) {
    console.error('[EXECUTIVE_REPORT_API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch executive data',
      },
      { status: 500 }
    );
  }
}
