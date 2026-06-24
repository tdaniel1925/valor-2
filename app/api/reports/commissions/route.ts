import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { getPolicies, type PolicyWithMetadata } from '@/lib/smartoffice/data-service';
import { statusBucket } from '@/lib/ai/valor-data-adapter';

/**
 * GET /api/reports/commissions — commission report from the SmartOffice book
 * (single source of truth). There is no internal commission-workflow table, so
 * each policy IS a commission record: "amount" = commAnnualizedPrem
 * (commissionable annualized premium). SmartOffice has no PAID/PENDING payment
 * workflow, so commission status is synthesized from the policy status bucket:
 * INFORCE -> PAID (earned), everything else -> PENDING. Response shape preserved
 * for the consuming page (app/reports/commissions/page.tsx).
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // month, quarter, year, ytd
    const advisor = searchParams.get('userId') || undefined; // optional advisor-name filter

    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case 'month': startDate.setMonth(now.getMonth() - 1); break;
      case 'quarter': startDate.setMonth(now.getMonth() - 3); break;
      case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
    }

    const { policies: allPolicies } = await getPolicies(
      tenant.tenantId,
      advisor ? { agent: advisor } : {}
    );

    // A "commission" maps 1:1 to a policy; filter the period by statusDate.
    const policies = allPolicies.filter((p) => {
      const d = p.statusDate ? new Date(p.statusDate) : null;
      return !!d && d >= startDate && d <= now;
    });

    const amount = (p: PolicyWithMetadata) => Number(p.commAnnualizedPrem) || 0;
    const prem = (p: PolicyWithMetadata) => Number(p.targetAmount) || 0;
    // Synthesize a PAID/PENDING payment status from the policy status bucket.
    const commStatus = (p: PolicyWithMetadata) => (statusBucket(p.status) === 'INFORCE' ? 'PAID' : 'PENDING');

    // Shape each policy into the commission record the page expects.
    const commissions = policies
      .map((p) => ({
        id: p.id,
        createdAt: p.statusDate ? new Date(p.statusDate).toISOString() : new Date().toISOString(),
        amount: amount(p),
        status: commStatus(p),
        case: {
          id: p.id,
          clientName: p.primaryInsured || 'N/A',
          status: p.status,
          premium: prem(p),
          carrier: p.carrierName || 'Unknown',
          productType: p.type || p.productName || 'Unknown',
        },
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingCommission = commissions
      .filter((c) => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amount, 0);
    const paidCommission = commissions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + c.amount, 0);

    const byStatus = commissions.reduce((acc: Record<string, { count: number; amount: number }>, c) => {
      const status = c.status || 'PENDING';
      if (!acc[status]) acc[status] = { count: 0, amount: 0 };
      acc[status].count++;
      acc[status].amount += c.amount;
      return acc;
    }, {});

    const byCarrier = commissions.reduce((acc: Record<string, { count: number; amount: number }>, c) => {
      const carrier = c.case.carrier || 'Unknown';
      if (!acc[carrier]) acc[carrier] = { count: 0, amount: 0 };
      acc[carrier].count++;
      acc[carrier].amount += c.amount;
      return acc;
    }, {});

    const byProductType = commissions.reduce((acc: Record<string, { count: number; amount: number }>, c) => {
      const productType = c.case.productType || 'Unknown';
      if (!acc[productType]) acc[productType] = { count: 0, amount: 0 };
      acc[productType].count++;
      acc[productType].amount += c.amount;
      return acc;
    }, {});

    // Monthly trend (last 6 months) by statusDate.
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthCommissions = commissions.filter((c) => {
        const d = new Date(c.createdAt);
        return d >= monthStart && d <= monthEnd;
      });

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: monthCommissions.reduce((sum, c) => sum + c.amount, 0),
        paid: monthCommissions.filter((c) => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0),
        pending: monthCommissions.filter((c) => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0),
        count: monthCommissions.length,
      });
    }

    return NextResponse.json({
      success: true,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        total: totalCommission,
        pending: pendingCommission,
        paid: paidCommission,
        count: commissions.length,
      },
      byStatus,
      byCarrier,
      byProductType,
      monthlyTrend,
      recentCommissions: commissions.slice(0, 10),
    });
  } catch (error) {
    console.error('[COMMISSION_REPORT_API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch commission data',
      },
      { status: 500 }
    );
  }
}
