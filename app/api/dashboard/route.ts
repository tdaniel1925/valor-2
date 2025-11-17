import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/dashboard - Get dashboard data for current user
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, using the demo user ID
    // TODO: Replace with actual auth user ID from Supabase
    const userId = "demo-user-id";

    // Fetch all dashboard data in parallel
    const [
      user,
      casesCount,
      recentCases,
      commissionsTotal,
      recentCommissions,
      contractsCount,
      quotesCount,
      notifications,
    ] = await Promise.all([
      // User info
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),

      // Cases stats
      prisma.case.count({
        where: { userId },
      }),

      // Recent cases
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
          updatedAt: true,
        },
      }),

      // Commissions total
      prisma.commission.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),

      // Recent commissions
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

      // Contracts count
      prisma.contract.count({
        where: { userId },
      }),

      // Quotes count
      prisma.quote.count({
        where: { userId },
      }),

      // Recent notifications
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Calculate case status breakdown
    const casesByStatus = await prisma.case.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    });

    // Calculate commission status breakdown
    const commissionsByStatus = await prisma.commission.groupBy({
      by: ["status"],
      where: { userId },
      _sum: { amount: true },
      _count: true,
    });

    // Calculate date ranges for period summaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1
    );
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // MTD (Month-to-Date) commissions
    const mtdCommissions = await prisma.commission.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    });

    // QTD (Quarter-to-Date) commissions
    const qtdCommissions = await prisma.commission.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfQuarter },
      },
      _sum: { amount: true },
      _count: true,
    });

    // YTD (Year-to-Date) commissions
    const ytdCommissions = await prisma.commission.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfYear },
      },
      _sum: { amount: true },
      _count: true,
    });

    // MTD cases
    const mtdCases = await prisma.case.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });

    // QTD cases
    const qtdCases = await prisma.case.count({
      where: {
        userId,
        createdAt: { gte: startOfQuarter },
      },
    });

    // YTD cases
    const ytdCases = await prisma.case.count({
      where: {
        userId,
        createdAt: { gte: startOfYear },
      },
    });

    return NextResponse.json({
      user,
      stats: {
        casesTotal: casesCount,
        commissionsTotal: commissionsTotal._sum.amount || 0,
        contractsTotal: contractsCount,
        quotesTotal: quotesCount,
        casesByStatus,
        commissionsByStatus,
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
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
