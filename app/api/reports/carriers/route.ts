import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { getPolicies, type PolicyWithMetadata } from '@/lib/smartoffice/data-service';
import { statusBucket } from '@/lib/ai/valor-data-adapter';

/**
 * GET /api/reports/carriers — carrier analytics from the SmartOffice book
 * (single source of truth). Policies are grouped by `carrierName`.
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

interface CarrierAccum {
  carrierName: string;
  totalPremium: number;
  policyCount: number;
  submitted: number;
  approved: number;
  totalCommissions: number;
  productTypes: Record<string, number>;
}

export async function GET(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    await requireAuth(request);

    const period = request.nextUrl.searchParams.get('period') || 'ytd';
    const { startDate, endDate } = getDateRange(period);

    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);

    const { policies: allPolicies } = await getPolicies(tenant.tenantId, {});

    const currentPolicies = allPolicies.filter((p) => inDateRange(p, startDate, endDate));
    const prevPolicies = allPolicies.filter((p) => inDateRange(p, prevStartDate, startDate));

    // Previous-period premium per carrier (for growth).
    const prevCarrierPremiums = new Map<string, number>();
    prevPolicies.forEach((p) => {
      const name = p.carrierName || 'Unknown';
      prevCarrierPremiums.set(name, (prevCarrierPremiums.get(name) || 0) + prem(p));
    });

    // Group current policies by carrier.
    const carrierMap = new Map<string, CarrierAccum>();
    currentPolicies.forEach((p) => {
      const carrierName = p.carrierName || 'Unknown';
      if (!carrierMap.has(carrierName)) {
        carrierMap.set(carrierName, {
          carrierName,
          totalPremium: 0,
          policyCount: 0,
          submitted: 0,
          approved: 0,
          totalCommissions: 0,
          productTypes: {},
        });
      }
      const c = carrierMap.get(carrierName)!;
      c.totalPremium += prem(p);
      c.totalCommissions += comm(p);
      if (isInforce(p) || isPending(p)) c.submitted += 1;
      if (isInforce(p)) {
        c.approved += 1;
        c.policyCount += 1;
      }
      const productType = (p.type || p.productName || 'OTHER').toUpperCase();
      c.productTypes[productType] = (c.productTypes[productType] || 0) + 1;
    });

    const totalPremium = Array.from(carrierMap.values()).reduce((s, c) => s + c.totalPremium, 0);

    const carrierMetrics = Array.from(carrierMap.values()).map((carrier) => {
      const approvalRate =
        carrier.submitted > 0 ? (carrier.approved / carrier.submitted) * 100 : 0;
      const averagePremium =
        carrier.policyCount > 0 ? carrier.totalPremium / carrier.policyCount : 0;
      const marketShare = totalPremium > 0 ? (carrier.totalPremium / totalPremium) * 100 : 0;
      const commissionRate =
        carrier.totalPremium > 0 ? (carrier.totalCommissions / carrier.totalPremium) * 100 : 0;

      const prevPremium = prevCarrierPremiums.get(carrier.carrierName) || 0;
      const growth =
        prevPremium > 0
          ? ((carrier.totalPremium - prevPremium) / prevPremium) * 100
          : carrier.totalPremium > 0
          ? 100
          : 0;

      // Underwriting time: no submit→issue delta exists in the book.
      const averageUnderwritingTime = 0;

      // Product mix as percentages, mapped to the page's life/annuity/term keys.
      const totalProducts = Object.values(carrier.productTypes).reduce<number>(
        (s, c) => s + c,
        0
      );
      const denom = totalProducts || 1;
      const sumWhere = (pred: (t: string) => boolean) =>
        Object.entries(carrier.productTypes).reduce((s, [t, c]) => (pred(t) ? s + c : s), 0);
      const productTypes = {
        life: (sumWhere((t) => t.includes('LIFE')) / denom) * 100,
        annuity: (sumWhere((t) => t.includes('ANNUIT')) / denom) * 100,
        term: (sumWhere((t) => t.includes('TERM')) / denom) * 100,
      };

      // Top 3 products by count (premium synthesized from per-type totals).
      const topProducts = Object.entries(carrier.productTypes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({
          name,
          count,
          premium: 0,
        }));

      return {
        carrierId: carrier.carrierName.toLowerCase().replace(/\s+/g, '-'),
        carrierName: carrier.carrierName,
        totalPremium: Math.round(carrier.totalPremium),
        policyCount: carrier.policyCount,
        averagePremium: Math.round(averagePremium),
        commissionRate: Math.round(commissionRate * 100) / 100,
        totalCommissions: Math.round(carrier.totalCommissions),
        marketShare: Math.round(marketShare * 100) / 100,
        growth: Math.round(growth * 100) / 100,
        approvalRate: Math.round(approvalRate * 100) / 100,
        averageUnderwritingTime,
        productTypes,
        topProducts,
      };
    });

    carrierMetrics.sort((a, b) => b.totalPremium - a.totalPremium);

    const totalCarriers = carrierMetrics.length;
    const totalPolicies = carrierMetrics.reduce((s, c) => s + c.policyCount, 0);
    const averageApprovalRate =
      carrierMetrics.reduce((s, c) => s + c.approvalRate, 0) / (totalCarriers || 1);
    // topCarrierShare = market share of the top carrier (page reads this).
    const topCarrierShare = carrierMetrics.length ? carrierMetrics[0].marketShare : 0;

    return NextResponse.json({
      summary: {
        totalCarriers,
        totalPolicies,
        totalPremium: Math.round(totalPremium),
        averageApprovalRate: Math.round(averageApprovalRate),
        topCarrierShare: Math.round(topCarrierShare * 100) / 100,
      },
      carriers: carrierMetrics,
      period,
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Carrier analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carrier analytics' },
      { status: 500 }
    );
  }
}
