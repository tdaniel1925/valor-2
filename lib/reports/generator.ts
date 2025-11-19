import { prisma } from "@/lib/db/prisma";

/**
 * Report Generation System
 * Generate commission and production reports with various formats
 */

export interface CommissionReport {
  reportType: "COMMISSION";
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  summary: {
    totalCommissions: number;
    paidCommissions: number;
    pendingCommissions: number;
    count: number;
  };
  byType: Array<{
    type: string;
    amount: number;
    count: number;
  }>;
  byCarrier: Array<{
    carrier: string;
    amount: number;
    count: number;
  }>;
  byAgent?: Array<{
    agentId: string;
    agentName: string;
    amount: number;
    count: number;
  }>;
  details: Array<{
    id: string;
    date: Date;
    type: string;
    carrier: string;
    policyNumber: string;
    clientName: string;
    amount: number;
    splitAmount: number;
    status: string;
    agentName?: string;
  }>;
}

export interface ProductionReport {
  reportType: "PRODUCTION";
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  summary: {
    totalPremium: number;
    totalCases: number;
    issuedCases: number;
    averagePremium: number;
    conversionRate: number;
  };
  byProductType: Array<{
    productType: string;
    premium: number;
    cases: number;
    percentage: number;
  }>;
  byCarrier: Array<{
    carrier: string;
    premium: number;
    cases: number;
  }>;
  byAgent?: Array<{
    agentId: string;
    agentName: string;
    premium: number;
    cases: number;
  }>;
  details: Array<{
    id: string;
    date: Date;
    clientName: string;
    productType: string;
    carrier: string;
    policyNumber: string;
    premium: number;
    status: string;
    agentName?: string;
  }>;
}

/**
 * Generate commission report
 */
export async function generateCommissionReport(
  userId?: string,
  startDate?: Date,
  endDate?: Date,
  includeTeam: boolean = false
): Promise<CommissionReport> {
  // Default to current month if no dates provided
  const now = new Date();
  const periodStart =
    startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = endDate || new Date();

  const periodLabel = `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`;

  // Build where clause
  const where: any = {
    createdAt: {
      gte: periodStart,
      lte: periodEnd,
    },
  };

  if (userId && !includeTeam) {
    where.userId = userId;
  }

  // If includeTeam, get all users in the same organization
  let userIds: string[] = [];
  if (includeTeam && userId) {
    const orgMembers = await prisma.organizationMember.findMany({
      where: {
        organization: {
          members: {
            some: {
              userId,
            },
          },
        },
        isActive: true,
      },
      select: {
        userId: true,
      },
    });
    userIds = orgMembers.map((m) => m.userId);
    where.userId = { in: userIds };
  }

  // Get commissions
  const commissions = await prisma.commission.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      case: {
        select: {
          clientName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate summary
  const totalCommissions = commissions.reduce(
    (sum, c) => sum + (c.amount || 0),
    0
  );
  const paidCommissions = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + (c.splitAmount || 0), 0);
  const pendingCommissions = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + (c.splitAmount || 0), 0);

  // Group by type
  const byTypeMap = new Map<string, { amount: number; count: number }>();
  commissions.forEach((c) => {
    const existing = byTypeMap.get(c.type) || { amount: 0, count: 0 };
    byTypeMap.set(c.type, {
      amount: existing.amount + (c.splitAmount || 0),
      count: existing.count + 1,
    });
  });

  const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
    type,
    amount: data.amount,
    count: data.count,
  }));

  // Group by carrier
  const byCarrierMap = new Map<string, { amount: number; count: number }>();
  commissions.forEach((c) => {
    const carrier = c.carrier || "Unknown";
    const existing = byCarrierMap.get(carrier) || { amount: 0, count: 0 };
    byCarrierMap.set(carrier, {
      amount: existing.amount + (c.splitAmount || 0),
      count: existing.count + 1,
    });
  });

  const byCarrier = Array.from(byCarrierMap.entries()).map(
    ([carrier, data]) => ({
      carrier,
      amount: data.amount,
      count: data.count,
    })
  );

  // Group by agent (if team report)
  let byAgent: Array<{
    agentId: string;
    agentName: string;
    amount: number;
    count: number;
  }> = [];

  if (includeTeam) {
    const byAgentMap = new Map<
      string,
      { name: string; amount: number; count: number }
    >();

    commissions.forEach((c) => {
      const agentId = c.userId;
      const agentName = `${c.user.firstName} ${c.user.lastName}`;
      const existing = byAgentMap.get(agentId) || {
        name: agentName,
        amount: 0,
        count: 0,
      };
      byAgentMap.set(agentId, {
        name: agentName,
        amount: existing.amount + (c.splitAmount || 0),
        count: existing.count + 1,
      });
    });

    byAgent = Array.from(byAgentMap.entries()).map(([agentId, data]) => ({
      agentId,
      agentName: data.name,
      amount: data.amount,
      count: data.count,
    }));
  }

  // Format details
  const details = commissions.map((c) => ({
    id: c.id,
    date: c.createdAt,
    type: c.type,
    carrier: c.carrier || "N/A",
    policyNumber: c.policyNumber || "N/A",
    clientName: c.case?.clientName || "N/A",
    amount: c.amount || 0,
    splitAmount: c.splitAmount || 0,
    status: c.status,
    agentName: includeTeam
      ? `${c.user.firstName} ${c.user.lastName}`
      : undefined,
  }));

  return {
    reportType: "COMMISSION",
    period: {
      start: periodStart,
      end: periodEnd,
      label: periodLabel,
    },
    summary: {
      totalCommissions,
      paidCommissions,
      pendingCommissions,
      count: commissions.length,
    },
    byType,
    byCarrier,
    byAgent: includeTeam ? byAgent : undefined,
    details,
  };
}

/**
 * Generate production report
 */
export async function generateProductionReport(
  userId?: string,
  startDate?: Date,
  endDate?: Date,
  includeTeam: boolean = false
): Promise<ProductionReport> {
  const now = new Date();
  const periodStart =
    startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = endDate || new Date();

  const periodLabel = `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`;

  // Build where clause
  const where: any = {
    createdAt: {
      gte: periodStart,
      lte: periodEnd,
    },
  };

  if (userId && !includeTeam) {
    where.userId = userId;
  }

  // If includeTeam, get all users in the same organization
  if (includeTeam && userId) {
    const orgMembers = await prisma.organizationMember.findMany({
      where: {
        organization: {
          members: {
            some: {
              userId,
            },
          },
        },
        isActive: true,
      },
      select: {
        userId: true,
      },
    });
    const userIds = orgMembers.map((m) => m.userId);
    where.userId = { in: userIds };
  }

  // Get cases
  const cases = await prisma.case.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate summary
  const issuedCases = cases.filter((c) => c.status === "ISSUED");
  const totalPremium = issuedCases.reduce((sum, c) => sum + (c.premium || 0), 0);
  const averagePremium =
    issuedCases.length > 0 ? totalPremium / issuedCases.length : 0;
  const conversionRate =
    cases.length > 0 ? (issuedCases.length / cases.length) * 100 : 0;

  // Group by product type
  const byProductTypeMap = new Map<
    string,
    { premium: number; cases: number }
  >();

  issuedCases.forEach((c) => {
    const productType = c.productType || "Unknown";
    const existing = byProductTypeMap.get(productType) || {
      premium: 0,
      cases: 0,
    };
    byProductTypeMap.set(productType, {
      premium: existing.premium + (c.premium || 0),
      cases: existing.cases + 1,
    });
  });

  const byProductType = Array.from(byProductTypeMap.entries()).map(
    ([productType, data]) => ({
      productType,
      premium: data.premium,
      cases: data.cases,
      percentage: totalPremium > 0 ? (data.premium / totalPremium) * 100 : 0,
    })
  );

  // Group by carrier
  const byCarrierMap = new Map<string, { premium: number; cases: number }>();

  issuedCases.forEach((c) => {
    const carrier = c.carrier || "Unknown";
    const existing = byCarrierMap.get(carrier) || { premium: 0, cases: 0 };
    byCarrierMap.set(carrier, {
      premium: existing.premium + (c.premium || 0),
      cases: existing.cases + 1,
    });
  });

  const byCarrier = Array.from(byCarrierMap.entries()).map(
    ([carrier, data]) => ({
      carrier,
      premium: data.premium,
      cases: data.cases,
    })
  );

  // Group by agent (if team report)
  let byAgent: Array<{
    agentId: string;
    agentName: string;
    premium: number;
    cases: number;
  }> = [];

  if (includeTeam) {
    const byAgentMap = new Map<
      string,
      { name: string; premium: number; cases: number }
    >();

    issuedCases.forEach((c) => {
      const agentId = c.userId;
      const agentName = `${c.user.firstName} ${c.user.lastName}`;
      const existing = byAgentMap.get(agentId) || {
        name: agentName,
        premium: 0,
        cases: 0,
      };
      byAgentMap.set(agentId, {
        name: agentName,
        premium: existing.premium + (c.premium || 0),
        cases: existing.cases + 1,
      });
    });

    byAgent = Array.from(byAgentMap.entries()).map(([agentId, data]) => ({
      agentId,
      agentName: data.name,
      premium: data.premium,
      cases: data.cases,
    }));
  }

  // Format details
  const details = cases.map((c) => ({
    id: c.id,
    date: c.createdAt,
    clientName: c.clientName,
    productType: c.productType || "N/A",
    carrier: c.carrier || "N/A",
    policyNumber: c.policyNumber || "N/A",
    premium: c.premium || 0,
    status: c.status,
    agentName: includeTeam
      ? `${c.user.firstName} ${c.user.lastName}`
      : undefined,
  }));

  return {
    reportType: "PRODUCTION",
    period: {
      start: periodStart,
      end: periodEnd,
      label: periodLabel,
    },
    summary: {
      totalPremium,
      totalCases: cases.length,
      issuedCases: issuedCases.length,
      averagePremium,
      conversionRate,
    },
    byProductType,
    byCarrier,
    byAgent: includeTeam ? byAgent : undefined,
    details,
  };
}

/**
 * Export report to CSV format
 */
export function exportToCSV(
  report: CommissionReport | ProductionReport
): string {
  if (report.reportType === "COMMISSION") {
    return exportCommissionReportToCSV(report);
  } else {
    return exportProductionReportToCSV(report);
  }
}

function exportCommissionReportToCSV(report: CommissionReport): string {
  const lines: string[] = [];

  lines.push(`Commission Report - ${report.period.label}`);
  lines.push("");
  lines.push(`Total Commissions,$${report.summary.totalCommissions.toFixed(2)}`);
  lines.push(`Paid Commissions,$${report.summary.paidCommissions.toFixed(2)}`);
  lines.push(`Pending Commissions,$${report.summary.pendingCommissions.toFixed(2)}`);
  lines.push(`Total Count,${report.summary.count}`);
  lines.push("");
  lines.push("Date,Type,Carrier,Policy Number,Client,Amount,Split Amount,Status");

  report.details.forEach((d) => {
    lines.push(
      `${d.date.toLocaleDateString()},${d.type},${d.carrier},${d.policyNumber},${d.clientName},$${d.amount.toFixed(2)},$${d.splitAmount.toFixed(2)},${d.status}`
    );
  });

  return lines.join("\n");
}

function exportProductionReportToCSV(report: ProductionReport): string {
  const lines: string[] = [];

  lines.push(`Production Report - ${report.period.label}`);
  lines.push("");
  lines.push(`Total Premium,$${report.summary.totalPremium.toFixed(2)}`);
  lines.push(`Total Cases,${report.summary.totalCases}`);
  lines.push(`Issued Cases,${report.summary.issuedCases}`);
  lines.push(`Average Premium,$${report.summary.averagePremium.toFixed(2)}`);
  lines.push(`Conversion Rate,${report.summary.conversionRate.toFixed(2)}%`);
  lines.push("");
  lines.push("Date,Client,Product Type,Carrier,Policy Number,Premium,Status");

  report.details.forEach((d) => {
    lines.push(
      `${d.date.toLocaleDateString()},${d.clientName},${d.productType},${d.carrier},${d.policyNumber},$${d.premium.toFixed(2)},${d.status}`
    );
  });

  return lines.join("\n");
}
