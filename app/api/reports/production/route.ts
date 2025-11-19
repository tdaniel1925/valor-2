import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';
    const agentId = searchParams.get('agentId');
    const teamView = searchParams.get('teamView') === 'true';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Build where clause
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: now,
      },
    };

    if (agentId && !teamView) {
      where.userId = agentId;
    }

    // Fetch cases
    const cases = await prisma.case.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        commissions: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary statistics
    const totalCases = cases.length;
    const totalPremium = cases.reduce((sum, c) => sum + (c.premium || 0), 0);
    const totalCommission = cases.reduce(
      (sum, c) => sum + c.commissions.reduce((cs, comm) => cs + (comm.amount || 0), 0),
      0
    );

    // Count by status
    const byStatus = cases.reduce((acc: any, c) => {
      const status = c.status;
      if (!acc[status]) {
        acc[status] = { count: 0, premium: 0 };
      }
      acc[status].count++;
      acc[status].premium += c.premium || 0;
      return acc;
    }, {});

    // Calculate conversion rates
    const submittedCases = cases.filter((c) =>
      ['SUBMITTED', 'ISSUED', 'INFORCE'].includes(c.status)
    ).length;
    const issuedCases = cases.filter((c) =>
      ['ISSUED', 'INFORCE'].includes(c.status)
    ).length;
    const conversionRate = totalCases > 0 ? (submittedCases / totalCases) * 100 : 0;
    const issueRate = submittedCases > 0 ? (issuedCases / submittedCases) * 100 : 0;

    // Group by product type
    const byProductType = cases.reduce((acc: any, c) => {
      const type = c.productType || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, premium: 0, commission: 0 };
      }
      acc[type].count++;
      acc[type].premium += c.premium || 0;
      acc[type].commission += c.commissions.reduce((sum, comm) => sum + (comm.amount || 0), 0);
      return acc;
    }, {});

    // Group by carrier
    const byCarrier = cases.reduce((acc: any, c) => {
      const carrier = c.carrier || 'Unknown';
      if (!acc[carrier]) {
        acc[carrier] = { count: 0, premium: 0, commission: 0 };
      }
      acc[carrier].count++;
      acc[carrier].premium += c.premium || 0;
      acc[carrier].commission += c.commissions.reduce((sum, comm) => sum + (comm.amount || 0), 0);
      return acc;
    }, {});

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthCases = cases.filter(
        (c) => new Date(c.createdAt) >= monthStart && new Date(c.createdAt) <= monthEnd
      );

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        cases: monthCases.length,
        premium: monthCases.reduce((sum, c) => sum + (c.premium || 0), 0),
        commission: monthCases.reduce(
          (sum, c) => sum + c.commissions.reduce((cs, comm) => cs + (comm.amount || 0), 0),
          0
        ),
        submitted: monthCases.filter((c) =>
          ['SUBMITTED', 'ISSUED', 'INFORCE'].includes(c.status)
        ).length,
        issued: monthCases.filter((c) =>
          ['ISSUED', 'INFORCE'].includes(c.status)
        ).length,
      });
    }

    // Team rankings (if team view)
    let agentRankings: any[] = [];
    if (teamView) {
      const agentStats = cases.reduce((acc: any, c) => {
        if (!c.user) return acc;

        const agentId = c.user.id;
        if (!acc[agentId]) {
          acc[agentId] = {
            agent: c.user,
            cases: 0,
            premium: 0,
            commission: 0,
            submitted: 0,
            issued: 0,
          };
        }

        acc[agentId].cases++;
        acc[agentId].premium += c.premium || 0;
        acc[agentId].commission += c.commissions.reduce((sum, comm) => sum + (comm.amount || 0), 0);

        if (['SUBMITTED', 'ISSUED', 'INFORCE'].includes(c.status)) {
          acc[agentId].submitted++;
        }
        if (['ISSUED', 'INFORCE'].includes(c.status)) {
          acc[agentId].issued++;
        }

        return acc;
      }, {});

      agentRankings = Object.values(agentStats)
        .sort((a: any, b: any) => b.premium - a.premium)
        .slice(0, 10);
    }

    // Top performing products
    const topProducts = Object.entries(byProductType)
      .map(([type, stats]: [string, any]) => ({
        type,
        ...stats,
      }))
      .sort((a, b) => b.premium - a.premium)
      .slice(0, 5);

    // Top performing carriers
    const topCarriers = Object.entries(byCarrier)
      .map(([carrier, stats]: [string, any]) => ({
        carrier,
        ...stats,
      }))
      .sort((a, b) => b.premium - a.premium)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      period,
      teamView,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
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
      recentCases: cases.slice(0, 10),
    });
  } catch (error) {
    console.error('[PRODUCTION_REPORT_API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch production data',
      },
      { status: 500 }
    );
  }
}
