import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { type PolicyWithMetadata } from '@/lib/smartoffice/data-service';
import { prisma } from '@/lib/db/prisma';
import { getScopedPolicies } from '@/lib/downline/service';
import { statusBucket } from '@/lib/ai/valor-data-adapter';

const ADMIN_ROLES = ['ADMINISTRATOR', 'EXECUTIVE'];

/**
 * GET /api/reports/production — production report from the SmartOffice book
 * (single source of truth). Policies are the unit of production; "premium" =
 * targetAmount (annual), "commission" = commAnnualizedPrem (commissionable).
 * Period filters by statusDate. Response shape is preserved for the page.
 */
const querySchema = z.object({
  period: z.enum(['month', 'quarter', 'year', 'ytd']).default('month'),
  advisor: z.string().optional(),
  teamView: z.string().optional().default('false').pipe(z.string().transform((v) => v === 'true')),
});

export async function GET(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    const authUser = await requireAuth(request);
    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id }, select: { email: true, role: true } });
    const email = dbUser?.email || authUser.email || '';
    const isAdmin = !!dbUser && ADMIN_ROLES.includes(dbUser.role);

    const sp = request.nextUrl.searchParams;
    const { period, advisor, teamView } = querySchema.parse({
      period: sp.get('period') || 'month',
      advisor: sp.get('advisor') || undefined,
      teamView: sp.get('teamView') || 'false',
    });

    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case 'month': startDate.setMonth(now.getMonth() - 1); break;
      case 'quarter': startDate.setMonth(now.getMonth() - 3); break;
      case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
    }

    let allPolicies = (await getScopedPolicies(tenant.tenantId, email, isAdmin)) as PolicyWithMetadata[];
    if (advisor) allPolicies = allPolicies.filter((p) => (p.primaryAdvisor || '').toLowerCase().includes(advisor.toLowerCase()));
    const policies = allPolicies.filter((p) => {
      const d = p.statusDate ? new Date(p.statusDate) : null;
      return d && d >= startDate && d <= now;
    });

    const prem = (p: PolicyWithMetadata) => Number(p.targetAmount) || 0;
    const comm = (p: PolicyWithMetadata) => Number(p.commAnnualizedPrem) || 0;
    const isInforce = (p: PolicyWithMetadata) => statusBucket(p.status) === 'INFORCE';
    const isPending = (p: PolicyWithMetadata) => statusBucket(p.status) === 'PENDING';

    const totalCases = policies.length;
    const totalPremium = policies.reduce((s, p) => s + prem(p), 0);
    const totalCommission = policies.reduce((s, p) => s + comm(p), 0);

    const byStatus = policies.reduce((acc: Record<string, { count: number; premium: number }>, p) => {
      const s = p.status || 'Unknown';
      acc[s] = acc[s] || { count: 0, premium: 0 };
      acc[s].count++; acc[s].premium += prem(p);
      return acc;
    }, {});

    const submittedCases = policies.filter((p) => isInforce(p) || isPending(p)).length;
    const issuedCases = policies.filter(isInforce).length;
    const conversionRate = totalCases > 0 ? (submittedCases / totalCases) * 100 : 0;
    const issueRate = submittedCases > 0 ? (issuedCases / submittedCases) * 100 : 0;

    const groupBy = (key: (p: PolicyWithMetadata) => string) =>
      policies.reduce((acc: Record<string, { count: number; premium: number; commission: number }>, p) => {
        const k = key(p) || 'Unknown';
        acc[k] = acc[k] || { count: 0, premium: 0, commission: 0 };
        acc[k].count++; acc[k].premium += prem(p); acc[k].commission += comm(p);
        return acc;
      }, {});

    const byProductType = groupBy((p) => p.type || p.productName || 'Unknown');
    const byCarrier = groupBy((p) => p.carrierName || 'Unknown');

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const mp = allPolicies.filter((p) => {
        const d = p.statusDate ? new Date(p.statusDate) : null;
        return d && d >= ms && d <= me;
      });
      monthlyTrend.push({
        month: ms.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        cases: mp.length,
        premium: mp.reduce((s, p) => s + prem(p), 0),
        commission: mp.reduce((s, p) => s + comm(p), 0),
        submitted: mp.filter((p) => isInforce(p) || isPending(p)).length,
        issued: mp.filter(isInforce).length,
      });
    }

    // Always compute rankings (the page renders them regardless of teamView).
    const splitName = (full: string) => {
      const parts = (full || 'Unknown').trim().split(/\s+/);
      return { firstName: parts[0] || 'Unknown', lastName: parts.slice(1).join(' ') };
    };
    const rankStats = policies.reduce((acc: Record<string, { agent: { id: string; firstName: string; lastName: string; email: string }; cases: number; premium: number; commission: number; submitted: number; issued: number }>, p) => {
      const name = p.primaryAdvisor || 'Unknown';
      if (!acc[name]) {
        const { firstName, lastName } = splitName(name);
        acc[name] = { agent: { id: name, firstName, lastName, email: '' }, cases: 0, premium: 0, commission: 0, submitted: 0, issued: 0 };
      }
      acc[name].cases++; acc[name].premium += prem(p); acc[name].commission += comm(p);
      if (isInforce(p) || isPending(p)) acc[name].submitted++;
      if (isInforce(p)) acc[name].issued++;
      return acc;
    }, {});
    const agentRankings = Object.values(rankStats).sort((a, b) => b.premium - a.premium).slice(0, 10);

    const topProducts = Object.entries(byProductType).map(([type, s]) => ({ type, ...s })).sort((a, b) => b.premium - a.premium).slice(0, 5);
    const topCarriers = Object.entries(byCarrier).map(([carrier, s]) => ({ carrier, ...s })).sort((a, b) => b.premium - a.premium).slice(0, 5);

    return NextResponse.json({
      success: true,
      period,
      teamView,
      dateRange: { start: startDate.toISOString(), end: now.toISOString() },
      summary: {
        totalCases,
        totalPremium,
        totalCommission,
        submittedCases,
        issuedCases,
        conversionRate,
        issueRate,
        averagePremium: totalCases > 0 ? totalPremium / totalCases : 0,
        averageCommission: totalCases > 0 ? totalCommission / totalCases : 0,
      },
      byStatus,
      byProductType,
      byCarrier,
      monthlyTrend,
      agentRankings,
      topProducts,
      topCarriers,
      recentCases: policies.slice(0, 10),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 });
    }
    console.error('[PRODUCTION_REPORT_API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch production data' },
      { status: 500 }
    );
  }
}
