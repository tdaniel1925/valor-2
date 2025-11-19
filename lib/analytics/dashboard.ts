import { prisma } from "@/lib/db/prisma";

/**
 * Dashboard Analytics
 * Real-time metrics and KPIs for agent performance
 */

export interface DashboardMetrics {
  // Revenue Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;

  // Commission Metrics
  pendingCommissions: number;
  paidCommissions: number;
  totalCommissions: number;

  // Case Metrics
  activeCases: number;
  pendingCases: number;
  issuedCases: number;
  totalCases: number;
  conversionRate: number;

  // Performance Metrics
  averagePremium: number;
  averageCommission: number;
  casesThisMonth: number;
  casesLastMonth: number;
  caseGrowth: number;

  // Goals
  goalsOnTrack: number;
  goalsCompleted: number;
  totalGoals: number;

  // Recent Activity
  recentCases: any[];
  recentCommissions: any[];
}

export interface TeamMetrics {
  totalMembers: number;
  activeMembers: number;
  totalProduction: number;
  totalCommissions: number;
  topProducers: Array<{
    userId: string;
    name: string;
    production: number;
    cases: number;
  }>;
}

/**
 * Calculate comprehensive dashboard metrics for a user
 */
export async function calculateDashboardMetrics(
  userId: string
): Promise<DashboardMetrics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Get all cases for the user
  const [
    allCases,
    thisMonthCases,
    lastMonthCases,
    allCommissions,
    activeGoals,
  ] = await Promise.all([
    prisma.case.findMany({
      where: { userId },
      include: { user: true },
    }),
    prisma.case.findMany({
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
    }),
    prisma.case.findMany({
      where: {
        userId,
        createdAt: { gte: lastMonthStart, lt: monthStart },
      },
    }),
    prisma.commission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.goal.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
    }),
  ]);

  // Calculate revenue metrics
  const issuedCases = allCases.filter((c) => c.status === "ISSUED");
  const totalRevenue = issuedCases.reduce((sum, c) => sum + (c.premium || 0), 0);

  const monthlyIssuedCases = thisMonthCases.filter((c) => c.status === "ISSUED");
  const monthlyRevenue = monthlyIssuedCases.reduce(
    (sum, c) => sum + (c.premium || 0),
    0
  );

  const lastMonthIssuedCases = lastMonthCases.filter(
    (c) => c.status === "ISSUED"
  );
  const lastMonthRevenue = lastMonthIssuedCases.reduce(
    (sum, c) => sum + (c.premium || 0),
    0
  );

  const revenueGrowth =
    lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

  // Calculate commission metrics
  const pendingCommissions = allCommissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + (c.splitAmount || 0), 0);

  const paidCommissions = allCommissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + (c.splitAmount || 0), 0);

  const totalCommissions = pendingCommissions + paidCommissions;

  // Calculate case metrics
  const activeCases = allCases.filter(
    (c) => c.status === "PENDING" || c.status === "SUBMITTED"
  ).length;

  const pendingCases = allCases.filter((c) => c.status === "PENDING").length;

  const totalCases = allCases.length;

  const conversionRate =
    totalCases > 0 ? (issuedCases.length / totalCases) * 100 : 0;

  // Calculate performance metrics
  const averagePremium =
    issuedCases.length > 0
      ? totalRevenue / issuedCases.length
      : 0;

  const averageCommission =
    allCommissions.length > 0
      ? totalCommissions / allCommissions.length
      : 0;

  const casesThisMonth = thisMonthCases.length;
  const casesLastMonth = lastMonthCases.length;

  const caseGrowth =
    casesLastMonth > 0
      ? ((casesThisMonth - casesLastMonth) / casesLastMonth) * 100
      : 0;

  // Calculate goal metrics
  const completedGoals = activeGoals.filter((g) => g.status === "COMPLETED");
  const onTrackGoals = activeGoals.filter((g) => {
    if (g.status === "COMPLETED") return true;
    const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
    return progress >= 50; // Consider on track if >50% complete
  });

  // Get recent activity
  const recentCases = allCases
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const recentCommissions = allCommissions.slice(0, 5);

  return {
    totalRevenue,
    monthlyRevenue,
    revenueGrowth,
    pendingCommissions,
    paidCommissions,
    totalCommissions,
    activeCases,
    pendingCases,
    issuedCases: issuedCases.length,
    totalCases,
    conversionRate,
    averagePremium,
    averageCommission,
    casesThisMonth,
    casesLastMonth,
    caseGrowth,
    goalsOnTrack: onTrackGoals.length,
    goalsCompleted: completedGoals.length,
    totalGoals: activeGoals.length,
    recentCases,
    recentCommissions,
  };
}

/**
 * Calculate team metrics for an organization
 */
export async function calculateTeamMetrics(
  organizationId: string
): Promise<TeamMetrics> {
  // Get all active members
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      user: true,
    },
  });

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Calculate metrics for each member
  const memberMetrics = await Promise.all(
    members.map(async (member) => {
      const cases = await prisma.case.findMany({
        where: {
          userId: member.userId,
          status: "ISSUED",
          issueDate: { gte: yearStart },
        },
      });

      const production = cases.reduce((sum, c) => sum + (c.premium || 0), 0);

      return {
        userId: member.userId,
        name: `${member.user.firstName} ${member.user.lastName}`,
        production,
        cases: cases.length,
      };
    })
  );

  // Get total commissions for the team
  const userIds = members.map((m) => m.userId);
  const commissions = await prisma.commission.findMany({
    where: {
      userId: { in: userIds },
      createdAt: { gte: yearStart },
    },
  });

  const totalProduction = memberMetrics.reduce(
    (sum, m) => sum + m.production,
    0
  );
  const totalCommissions = commissions.reduce(
    (sum, c) => sum + (c.splitAmount || 0),
    0
  );

  // Get top 5 producers
  const topProducers = memberMetrics
    .sort((a, b) => b.production - a.production)
    .slice(0, 5);

  return {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.isActive).length,
    totalProduction,
    totalCommissions,
    topProducers,
  };
}

/**
 * Calculate time-series data for charts
 */
export async function calculateTimeSeriesData(
  userId: string,
  metric: "PREMIUM" | "COMMISSIONS" | "CASES",
  months: number = 12
): Promise<
  Array<{
    month: string;
    value: number;
  }>
> {
  const now = new Date();
  const data: Array<{ month: string; value: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthStr = monthDate.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    let value = 0;

    if (metric === "PREMIUM") {
      const cases = await prisma.case.findMany({
        where: {
          userId,
          status: "ISSUED",
          issueDate: {
            gte: monthDate,
            lt: nextMonthDate,
          },
        },
      });
      value = cases.reduce((sum, c) => sum + (c.premium || 0), 0);
    } else if (metric === "COMMISSIONS") {
      const commissions = await prisma.commission.findMany({
        where: {
          userId,
          status: { in: ["PENDING", "PAID"] },
          createdAt: {
            gte: monthDate,
            lt: nextMonthDate,
          },
        },
      });
      value = commissions.reduce((sum, c) => sum + (c.splitAmount || 0), 0);
    } else if (metric === "CASES") {
      value = await prisma.case.count({
        where: {
          userId,
          status: "ISSUED",
          issueDate: {
            gte: monthDate,
            lt: nextMonthDate,
          },
        },
      });
    }

    data.push({ month: monthStr, value });
  }

  return data;
}

/**
 * Calculate product mix breakdown
 */
export async function calculateProductMix(
  userId: string
): Promise<
  Array<{
    productType: string;
    count: number;
    premium: number;
    percentage: number;
  }>
> {
  const cases = await prisma.case.findMany({
    where: {
      userId,
      status: "ISSUED",
    },
  });

  const productMap = new Map<string, { count: number; premium: number }>();

  cases.forEach((c) => {
    const type = c.productType || "Unknown";
    const existing = productMap.get(type) || { count: 0, premium: 0 };
    productMap.set(type, {
      count: existing.count + 1,
      premium: existing.premium + (c.premium || 0),
    });
  });

  const totalCases = cases.length;

  return Array.from(productMap.entries()).map(([productType, data]) => ({
    productType,
    count: data.count,
    premium: data.premium,
    percentage: totalCases > 0 ? (data.count / totalCases) * 100 : 0,
  }));
}
