import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/dashboard - Get dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and get user ID from session
    const user = await requireAuth(request);
    const userId = user.id;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Fetch data in parallel
    const [
      userInfo,
      casesCount,
      commissionsSum,
      contractsCount,
      quotesCount,
      casesByStatus,
      commissionsByStatus,
      mtdCommissions,
      mtdCases,
      qtdCommissions,
      qtdCases,
      ytdCommissions,
      ytdCases,
      recentCases,
      recentCommissions,
      notifications,
    ] = await Promise.all([
      // User info
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      }),
      // Stats
      prisma.case.count({ where: { userId } }),
      prisma.commission.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.contract.count({ where: { userId } }),
      prisma.quote.count({ where: { userId } }),
      // Cases by status
      prisma.case.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),
      // Commissions by status
      prisma.commission.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
        _sum: { amount: true },
      }),
      // MTD
      prisma.commission.aggregate({
        where: { userId, createdAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.case.count({
        where: { userId, createdAt: { gte: monthStart } },
      }),
      // QTD
      prisma.commission.aggregate({
        where: { userId, createdAt: { gte: quarterStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.case.count({
        where: { userId, createdAt: { gte: quarterStart } },
      }),
      // YTD
      prisma.commission.aggregate({
        where: { userId, createdAt: { gte: yearStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.case.count({
        where: { userId, createdAt: { gte: yearStart } },
      }),
      // Recent activity
      prisma.case.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          clientName: true,
          carrier: true,
          productType: true,
          status: true,
          premium: true,
          createdAt: true,
        },
      }),
      prisma.commission.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          status: true,
          carrier: true,
          amount: true,
          paidAt: true,
          createdAt: true,
        },
      }),
      // Notifications
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const response = NextResponse.json({
      success: true,
      data: {
        user: userInfo || { email: "", firstName: "Demo", lastName: "User" },
        stats: {
          casesTotal: casesCount,
          commissionsTotal: commissionsSum._sum.amount || 0,
          contractsTotal: contractsCount,
          quotesTotal: quotesCount,
          casesByStatus: casesByStatus.map((s) => ({
            status: s.status,
            _count: s._count,
          })),
          commissionsByStatus: commissionsByStatus.map((s) => ({
            status: s.status,
            _count: s._count,
            _sum: { amount: s._sum.amount || 0 },
          })),
        },
        periodSummaries: {
          mtd: {
            commissions: mtdCommissions._sum.amount || 0,
            commissionsCount: mtdCommissions._count,
            cases: mtdCases,
          },
          qtd: {
            commissions: qtdCommissions._sum.amount || 0,
            commissionsCount: qtdCommissions._count,
            cases: qtdCases,
          },
          ytd: {
            commissions: ytdCommissions._sum.amount || 0,
            commissionsCount: ytdCommissions._count,
            cases: ytdCases,
          },
        },
        recentActivity: {
          cases: recentCases,
          commissions: recentCommissions,
        },
        notifications: notifications.map((n) => ({
          ...n,
          isNew: !n.isRead,
        })),
      },
    });

    // Add caching headers (cache for 30 seconds)
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
