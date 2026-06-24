import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { getPolicies, getAgents, type PolicyWithMetadata } from '@/lib/smartoffice/data-service';
import { statusBucket } from '@/lib/ai/valor-data-adapter';

/**
 * GET /api/reports/agents — agent analytics from the SmartOffice book
 * (single source of truth). Agents are derived by grouping policies on
 * `primaryAdvisor`; the SmartOffice agent roster supplies email/org context.
 * "premium" = targetAmount (annual), "commission" = commAnnualizedPrem.
 * Period filters by statusDate. Response shape is preserved for the page.
 */
function getDateRange(period: string) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case 'year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case 'ytd':
    default:
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return { startDate, endDate: now };
}

const prem = (p: PolicyWithMetadata) => Number(p.targetAmount) || 0;
const comm = (p: PolicyWithMetadata) => Number(p.commAnnualizedPrem) || 0;
const isInforce = (p: PolicyWithMetadata) => statusBucket(p.status) === 'INFORCE';
const isPending = (p: PolicyWithMetadata) => statusBucket(p.status) === 'PENDING';
const inDateRange = (p: PolicyWithMetadata, start: Date, end: Date) => {
  const d = p.statusDate ? new Date(p.statusDate) : null;
  return !!d && d >= start && d <= end;
};

export async function GET(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    await requireAuth(request);

    const period = request.nextUrl.searchParams.get('period') || 'ytd';
    const { startDate, endDate } = getDateRange(period);

    // Previous period of equal length for growth comparison.
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);

    const [{ policies: allPolicies }, { agents: roster }] = await Promise.all([
      getPolicies(tenant.tenantId, {}),
      getAgents(tenant.tenantId, { limit: 1000 }),
    ]);

    // Roster lookup by advisor name for email/org enrichment.
    const rosterByName = new Map<string, (typeof roster)[number]>();
    roster.forEach((a) => {
      if (a.fullName) rosterByName.set(a.fullName.trim().toLowerCase(), a);
    });

    const currentPolicies = allPolicies.filter((p) => inDateRange(p, startDate, endDate));
    const prevPolicies = allPolicies.filter((p) => inDateRange(p, prevStartDate, startDate));

    // Previous-period commissionable premium per advisor (for growth).
    const prevByAgent = new Map<string, number>();
    prevPolicies.forEach((p) => {
      const name = p.primaryAdvisor || 'Unknown';
      prevByAgent.set(name, (prevByAgent.get(name) || 0) + comm(p));
    });

    // Group current policies by advisor.
    const grouped = new Map<string, PolicyWithMetadata[]>();
    currentPolicies.forEach((p) => {
      const name = p.primaryAdvisor || 'Unknown';
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(p);
    });

    const now = new Date();

    const agentMetrics = Array.from(grouped.entries()).map(([agentName, policies]) => {
      const rosterMatch = rosterByName.get(agentName.trim().toLowerCase());

      const totalPremium = policies.reduce((s, p) => s + prem(p), 0);
      const totalCommission = policies.reduce((s, p) => s + comm(p), 0);
      const policyCount = policies.filter(isInforce).length;
      const submitted = policies.filter((p) => isInforce(p) || isPending(p)).length;
      const averageCase = policyCount > 0 ? totalPremium / policyCount : 0;

      const totalCases = policies.length;
      // Conversion: inforce policies / all policies touched by this agent.
      const conversionRate = totalCases > 0 ? (policyCount / totalCases) * 100 : 0;
      // Quote-to-app: submitted (inforce + pending) / all policies.
      const quoteToAppRatio = totalCases > 0 ? (submitted / totalCases) * 100 : 0;

      // Average time to close: statusDate is the only date in the book, so we
      // have no submit→issue delta. Default to 0 (no synthetic data).
      const averageTimeToClose = 0;

      // Persistency: share of this agent's policies not in a closed bucket.
      const closed = policies.filter((p) => {
        const b = statusBucket(p.status);
        return b === 'CLOSED' || b === 'DECLINED';
      }).length;
      const persistency = totalCases > 0 ? ((totalCases - closed) / totalCases) * 100 : 100;

      // Growth: current vs previous-period commissionable premium.
      const prevCommission = prevByAgent.get(agentName) || 0;
      const growth =
        prevCommission > 0
          ? ((totalCommission - prevCommission) / prevCommission) * 100
          : totalCommission > 0
          ? 100
          : 0;

      // Product mix as percentages, mapped to the page's life/annuity/term keys.
      const typeCounts = policies.reduce((acc: Record<string, number>, p) => {
        const t = (p.type || p.productName || 'OTHER').toUpperCase();
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const denom = totalCases || 1;
      const sumWhere = (pred: (t: string) => boolean) =>
        Object.entries(typeCounts).reduce((s, [t, c]) => (pred(t) ? s + c : s), 0);
      const productMix = {
        life: (sumWhere((t) => t.includes('LIFE')) / denom) * 100,
        annuity: (sumWhere((t) => t.includes('ANNUIT')) / denom) * 100,
        term: (sumWhere((t) => t.includes('TERM')) / denom) * 100,
      };

      // Last 6 months trend for this agent.
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const mp = policies.filter((p) => inDateRange(p, ms, me));
        monthlyTrend.push({
          month: ms.toLocaleDateString('en-US', { month: 'short' }),
          premium: mp.reduce((s, p) => s + prem(p), 0),
          cases: mp.length,
        });
      }

      return {
        agentId: rosterMatch?.id || agentName.toLowerCase().replace(/\s+/g, '-'),
        agentName,
        email: rosterMatch?.email || '',
        organization: rosterMatch?.supervisor || '',
        totalPremium: Math.round(totalPremium),
        policyCount,
        averageCase: Math.round(averageCase),
        conversionRate: Math.round(conversionRate * 100) / 100,
        quoteToAppRatio: Math.round(quoteToAppRatio * 100) / 100,
        averageTimeToClose,
        persistency: Math.round(persistency * 100) / 100,
        rank: 0, // assigned after sorting
        growth: Math.round(growth * 100) / 100,
        productMix,
        monthlyTrend,
      };
    });

    // Sort by total premium and assign ranks.
    agentMetrics.sort((a, b) => b.totalPremium - a.totalPremium);
    agentMetrics.forEach((agent, index) => {
      agent.rank = index + 1;
    });

    const totalAgents = agentMetrics.length;
    const activeAgents = agentMetrics.filter((a) => a.policyCount > 0).length;
    const averagePremium =
      agentMetrics.reduce((sum, a) => sum + a.totalPremium, 0) / (totalAgents || 1);
    const topPerformerGrowth = agentMetrics.length
      ? Math.max(...agentMetrics.map((a) => a.growth), 0)
      : 0;

    return NextResponse.json({
      summary: {
        totalAgents,
        activeAgents,
        averagePremium: Math.round(averagePremium),
        topPerformerGrowth: Math.round(topPerformerGrowth),
      },
      agents: agentMetrics,
      period,
    });
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
