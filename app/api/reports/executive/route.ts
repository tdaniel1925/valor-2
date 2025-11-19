import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Calculate date ranges
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const ytdStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

    // Fetch all cases for YTD
    const ytdCases = await prisma.case.findMany({
      where: {
        createdAt: {
          gte: ytdStart,
        },
      },
      include: {
        commissions: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Fetch last year cases for comparison
    const lastYearCases = await prisma.case.findMany({
      where: {
        createdAt: {
          gte: lastYearStart,
          lte: lastYearEnd,
        },
      },
      include: {
        commissions: true,
      },
    });

    // This month vs last month
    const thisMonthCases = ytdCases.filter((c) => new Date(c.createdAt) >= thisMonthStart);
    const lastMonthCases = ytdCases.filter(
      (c) =>
        new Date(c.createdAt) >= lastMonthStart && new Date(c.createdAt) <= lastMonthEnd
    );

    // Calculate KPIs
    const calculateMetrics = (cases: any[]) => {
      const totalCases = cases.length;
      const totalPremium = cases.reduce((sum, c) => sum + (c.premium || 0), 0);
      const totalCommission = cases.reduce(
        (sum, c) => sum + c.commissions.reduce((cs: number, comm: any) => cs + (comm.amount || 0), 0),
        0
      );
      const submittedCases = cases.filter((c) =>
        ['SUBMITTED', 'ISSUED', 'INFORCE'].includes(c.status)
      ).length;
      const issuedCases = cases.filter((c) =>
        ['ISSUED', 'INFORCE'].includes(c.status)
      ).length;

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

    // Calculate growth percentages
    const growthVsLastYear = {
      cases:
        lastYearMetrics.totalCases > 0
          ? ((ytdMetrics.totalCases - lastYearMetrics.totalCases) / lastYearMetrics.totalCases) * 100
          : 0,
      premium:
        lastYearMetrics.totalPremium > 0
          ? ((ytdMetrics.totalPremium - lastYearMetrics.totalPremium) / lastYearMetrics.totalPremium) *
            100
          : 0,
      commission:
        lastYearMetrics.totalCommission > 0
          ? ((ytdMetrics.totalCommission - lastYearMetrics.totalCommission) /
              lastYearMetrics.totalCommission) *
            100
          : 0,
    };

    const growthVsLastMonth = {
      cases:
        lastMonthMetrics.totalCases > 0
          ? ((thisMonthMetrics.totalCases - lastMonthMetrics.totalCases) /
              lastMonthMetrics.totalCases) *
            100
          : 0,
      premium:
        lastMonthMetrics.totalPremium > 0
          ? ((thisMonthMetrics.totalPremium - lastMonthMetrics.totalPremium) /
              lastMonthMetrics.totalPremium) *
            100
          : 0,
    };

    // Monthly trend for the year
    const monthlyTrend = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), i, 1);
      const monthEnd = new Date(now.getFullYear(), i + 1, 0);

      const monthCases = ytdCases.filter(
        (c) =>
          new Date(c.createdAt) >= monthStart && new Date(c.createdAt) <= monthEnd
      );

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        cases: monthCases.length,
        premium: monthCases.reduce((sum, c) => sum + (c.premium || 0), 0),
        commission: monthCases.reduce(
          (sum, c) => sum + c.commissions.reduce((cs: number, comm: any) => cs + (comm.amount || 0), 0),
          0
        ),
        submitted: monthCases.filter((c) =>
          ['SUBMITTED', 'ISSUED', 'INFORCE'].includes(c.status)
        ).length,
        issued: monthCases.filter((c) => ['ISSUED', 'INFORCE'].includes(c.status))
          .length,
      });
    }

    // Product mix
    const productMix = ytdCases.reduce((acc: any, c) => {
      const type = c.productType || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, premium: 0, percentage: 0 };
      }
      acc[type].count++;
      acc[type].premium += c.premium || 0;
      return acc;
    }, {});

    // Calculate percentages
    Object.keys(productMix).forEach((key) => {
      productMix[key].percentage =
        ytdMetrics.totalPremium > 0
          ? (productMix[key].premium / ytdMetrics.totalPremium) * 100
          : 0;
    });

    // Agent activity
    const agentCount = await prisma.user.count({
      where: {
        role: 'AGENT',
      },
    });

    const activeAgents = new Set(ytdCases.map((c) => c.userId)).size;

    // Pipeline analysis
    const pipelineByStatus = ytdCases.reduce((acc: any, c) => {
      const status = c.status;
      if (!acc[status]) {
        acc[status] = { count: 0, premium: 0 };
      }
      acc[status].count++;
      acc[status].premium += c.premium || 0;
      return acc;
    }, {});

    // Top performers
    const agentPerformance = ytdCases.reduce((acc: any, c) => {
      if (!c.user) return acc;

      const agentId = c.user.id;
      if (!acc[agentId]) {
        acc[agentId] = {
          agent: c.user,
          cases: 0,
          premium: 0,
          commission: 0,
        };
      }

      acc[agentId].cases++;
      acc[agentId].premium += c.premium || 0;
      acc[agentId].commission += c.commissions.reduce(
        (sum: number, comm: any) => sum + (comm.amount || 0),
        0
      );

      return acc;
    }, {});

    const topAgents = Object.values(agentPerformance)
      .sort((a: any, b: any) => b.premium - a.premium)
      .slice(0, 5);

    // Carrier distribution
    const carrierDistribution = ytdCases.reduce((acc: any, c) => {
      const carrier = c.carrier || 'Unknown';
      if (!acc[carrier]) {
        acc[carrier] = { count: 0, premium: 0 };
      }
      acc[carrier].count++;
      acc[carrier].premium += c.premium || 0;
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
