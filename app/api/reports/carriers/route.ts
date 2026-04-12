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
      // Get previous period for growth calculation
      const periodLength = endDate.getTime() - startDate.getTime();
      const prevStartDate = new Date(startDate.getTime() - periodLength);
      const prevEndDate = new Date(startDate.getTime());

      // Get all quotes with carrier information for current period
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
              submittedAt: true,
            },
          },
        },
      });

      // Get previous period quotes for growth comparison
      const prevQuotes = await db.quote.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          carrier: { not: null },
        },
        select: {
          carrier: true,
          premium: true,
        },
      });

      // Get commissions by carrier for current period
      const commissions = await db.commission.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          createdAt: { gte: startDate, lte: endDate },
          carrier: { not: null },
        },
        select: {
          carrier: true,
          amount: true,
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
            underwritingTimes: [] as number[],
          });
        }

        const carrier = carrierMap.get(carrierName);
        carrier.totalPremium += quote.premium || 0;
        carrier.quotesSubmitted += 1;

        // Count product types
        const productType = quote.type || 'OTHER';
        carrier.productTypes[productType] = (carrier.productTypes[productType] || 0) + 1;

        // Count approved cases and calculate underwriting time
        const approvedCase = quote.cases.find((c: any) => c.status === 'APPROVED');
        if (approvedCase) {
          carrier.casesApproved += 1;
          carrier.policyCount += 1;

          // Calculate underwriting time if we have submission date
          if (approvedCase.submittedAt && approvedCase.createdAt) {
            const underwritingDays = Math.ceil(
              (new Date(approvedCase.createdAt).getTime() - new Date(approvedCase.submittedAt).getTime()) /
              (1000 * 60 * 60 * 24)
            );
            if (underwritingDays > 0) {
              carrier.underwritingTimes.push(underwritingDays);
            }
          }
        }
      });

      // Add commissions to carriers
      commissions.forEach((commission) => {
        const carrierName = commission.carrier || 'Unknown';
        if (carrierMap.has(carrierName)) {
          const carrier = carrierMap.get(carrierName);
          carrier.totalCommissions += commission.amount || 0;
        }
      });

      // Calculate previous period premiums for growth
      const prevCarrierPremiums = new Map<string, number>();
      prevQuotes.forEach((quote) => {
        const carrierName = quote.carrier || 'Unknown';
        prevCarrierPremiums.set(
          carrierName,
          (prevCarrierPremiums.get(carrierName) || 0) + (quote.premium || 0)
        );
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

        // Calculate commission rate (commissions / premium)
        const commissionRate =
          carrier.totalPremium > 0
            ? (carrier.totalCommissions / carrier.totalPremium) * 100
            : 0;

        // Calculate growth vs previous period
        const prevPremium = prevCarrierPremiums.get(carrier.carrierName) || 0;
        const growth =
          prevPremium > 0
            ? ((carrier.totalPremium - prevPremium) / prevPremium) * 100
            : carrier.totalPremium > 0
            ? 100
            : 0;

        // Calculate average underwriting time
        const averageUnderwritingTime =
          carrier.underwritingTimes.length > 0
            ? carrier.underwritingTimes.reduce((sum: number, time: number) => sum + time, 0) /
              carrier.underwritingTimes.length
            : 0;

        // Convert product types to percentages and get top products
        const totalProducts = Object.values(carrier.productTypes).reduce<number>(
          (sum, count) => sum + Number(count),
          0
        );
        const productTypesPercent: any = {};
        Object.entries(carrier.productTypes).forEach(([type, count]) => {
          productTypesPercent[type] = totalProducts > 0 ? ((count as number) / totalProducts) * 100 : 0;
        });

        // Get top 3 products
        const topProducts = Object.entries(carrier.productTypes)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([type, count]) => ({
            type,
            count: count as number,
            percentage: totalProducts > 0 ? ((count as number) / totalProducts) * 100 : 0,
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
          averageUnderwritingTime: Math.round(averageUnderwritingTime),
          productTypes: productTypesPercent,
          topProducts,
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
