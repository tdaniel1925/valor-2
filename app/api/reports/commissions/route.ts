import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // month, quarter, year
    const agentId = searchParams.get('agentId'); // optional filter

    // Calculate date range based on period
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

    if (agentId) {
      where.agentId = agentId;
    }

    // Fetch commission data
    const commissions = await prisma.commission.findMany({
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
        case: {
          select: {
            id: true,
            clientName: true,
            status: true,
            premium: true,
            carrier: true,
            productType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary statistics
    const totalCommission = commissions.reduce((sum, comm) => sum + (comm.amount || 0), 0);
    const pendingCommission = commissions
      .filter((c) => c.status === 'PENDING')
      .reduce((sum, comm) => sum + (comm.amount || 0), 0);
    const paidCommission = commissions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, comm) => sum + (comm.amount || 0), 0);

    // Group by status
    const byStatus = commissions.reduce((acc: any, comm) => {
      const status = comm.status || 'PENDING';
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0 };
      }
      acc[status].count++;
      acc[status].amount += comm.amount || 0;
      return acc;
    }, {});

    // Group by carrier
    const byCarrier = commissions.reduce((acc: any, comm) => {
      const carrier = comm.case?.carrier || 'Unknown';
      if (!acc[carrier]) {
        acc[carrier] = { count: 0, amount: 0 };
      }
      acc[carrier].count++;
      acc[carrier].amount += comm.amount || 0;
      return acc;
    }, {});

    // Group by product type
    const byProductType = commissions.reduce((acc: any, comm) => {
      const productType = comm.case?.productType || 'Unknown';
      if (!acc[productType]) {
        acc[productType] = { count: 0, amount: 0 };
      }
      acc[productType].count++;
      acc[productType].amount += comm.amount || 0;
      return acc;
    }, {});

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthCommissions = commissions.filter(
        (c) =>
          new Date(c.createdAt) >= monthStart &&
          new Date(c.createdAt) <= monthEnd
      );

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: monthCommissions.reduce((sum, c) => sum + (c.amount || 0), 0),
        paid: monthCommissions
          .filter((c) => c.status === 'PAID')
          .reduce((sum, c) => sum + (c.amount || 0), 0),
        pending: monthCommissions
          .filter((c) => c.status === 'PENDING')
          .reduce((sum, c) => sum + (c.amount || 0), 0),
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
