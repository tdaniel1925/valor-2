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
      // Get all quotes with carrier information
      const quotes = await db.quote.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          createdAt: { gte: startDate, lte: endDate },
          carrier: { not: null },
        },
        select: {
          id: true,
          carrier: true,
          premium: true,
          type: true,
          status: true,
          createdAt: true,
          cases: {
            select: {
              status: true,
              createdAt: true,
            },
          },
        },
      });

      // Group by carrier
      const carrierMap = new Map<string, any>();

      quotes.forEach((quote) => {
        const carrierName = quote.carrier || 'Unknown';

        if (!carrierMap.has(carrierName)) {
          carrierMap.set(carrierName, {
            carrierName,
            totalPremium: 0,
            policyCount: 0,
            quotesSubmitted: 0,
            casesApproved: 0,
            totalCommissions: 0,
            productTypes: {} as Record<string, number>,
          });
        }

        const carrier = carrierMap.get(carrierName);
        carrier.totalPremium += quote.premium || 0;
        carrier.quotesSubmitted += 1;

        // Count product types
        const productType = quote.type || 'OTHER';
        carrier.productTypes[productType] = (carrier.productTypes[productType] || 0) + 1;

        // Count approved cases
        const approvedCase = quote.cases.find((c: any) => c.status === 'APPROVED');
        if (approvedCase) {
          carrier.casesApproved += 1;
          carrier.policyCount += 1;
        }
      });

      // Calculate metrics and convert to array
      const totalPremium = Array.from(carrierMap.values()).reduce(
        (sum, c) => sum + c.totalPremium,
        0
      );

      const carrierMetrics = Array.from(carrierMap.values()).map((carrier) => {
        const approvalRate =
          carrier.quotesSubmitted > 0
            ? (carrier.casesApproved / carrier.quotesSubmitted) * 100
            : 0;

        const averagePremium =
          carrier.policyCount > 0 ? carrier.totalPremium / carrier.policyCount : 0;

        const marketShare = totalPremium > 0 ? (carrier.totalPremium / totalPremium) * 100 : 0;

        // Convert product types to percentages
        const totalProducts = Object.values(carrier.productTypes).reduce(
          (sum: number, count: any) => sum + count,
          0
        );
        const productTypesPercent: any = {};
        Object.entries(carrier.productTypes).forEach(([type, count]) => {
          productTypesPercent[type] = totalProducts > 0 ? (Number(count) / totalProducts) * 100 : 0;
        });

        return {
          carrierId: carrier.carrierName.toLowerCase().replace(/\s+/g, '-'),
          carrierName: carrier.carrierName,
          totalPremium: carrier.totalPremium,
          policyCount: carrier.policyCount,
          averagePremium,
          commissionRate: 0, // TODO: Get from contracts table if needed
          totalCommissions: carrier.totalCommissions,
          marketShare,
          growth: 0, // TODO: Compare with previous period
          approvalRate,
          averageUnderwritingTime: 0, // TODO: Calculate from case dates
          productTypes: productTypesPercent,
          topProducts: [], // TODO: Break down by specific products if needed
        };
      });

      // Sort by total premium
      carrierMetrics.sort((a, b) => b.totalPremium - a.totalPremium);

      // Calculate summary
      const totalCarriers = carrierMetrics.length;
      const totalPolicies = carrierMetrics.reduce((sum, c) => sum + c.policyCount, 0);
      const averageApprovalRate =
        carrierMetrics.reduce((sum, c) => sum + c.approvalRate, 0) / (totalCarriers || 1);

      return {
        summary: {
          totalCarriers,
          totalPolicies,
          totalPremium: Math.round(totalPremium),
          averageApprovalRate: Math.round(averageApprovalRate),
        },
        carriers: carrierMetrics,
        period,
      };
    });

    return NextResponse.json(data);
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
