import { prisma } from "@/lib/db/prisma";

/**
 * Commission Calculator
 * Handles hierarchical commission splits across organization structures
 */

export interface CommissionInput {
  userId: string;
  caseId: string;
  carrier: string;
  policyNumber: string;
  grossPremium: number;
  commissionRate: number; // Percentage as decimal (e.g., 0.90 for 90%)
  type: "FIRST_YEAR" | "RENEWAL" | "OVERRIDE" | "BONUS" | "TRAIL";
  periodStart: Date;
  periodEnd: Date;
}

export interface CommissionSplit {
  userId: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  role: string;
  splitPercentage: number;
  amount: number;
  level: number; // 0 = agent, 1 = agency, 2 = MGA, 3 = IMO
}

/**
 * Calculate commission with hierarchical splits
 */
export async function calculateCommission(input: CommissionInput): Promise<{
  totalAmount: number;
  splits: CommissionSplit[];
}> {
  const { userId, grossPremium, commissionRate } = input;

  // Calculate total commission amount
  const totalAmount = grossPremium * commissionRate;

  // Get user's organization memberships with hierarchy
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizations: {
        include: {
          organization: {
            include: {
              parent: {
                include: {
                  parent: {
                    include: {
                      parent: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.organizations.length === 0) {
    throw new Error("User has no organization memberships");
  }

  // Build hierarchy chain from agent up to IMO
  const splits: CommissionSplit[] = [];
  let remainingAmount = totalAmount;

  // Start with the agent's organization
  const agentMembership = user.organizations[0];
  const agentSplit = agentMembership.commissionSplit || 0.85; // Default 85% to agent

  splits.push({
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    organizationId: agentMembership.organizationId,
    organizationName: agentMembership.organization.name,
    role: agentMembership.role,
    splitPercentage: agentSplit,
    amount: totalAmount * agentSplit,
    level: 0,
  });

  remainingAmount -= totalAmount * agentSplit;

  // Walk up the organization hierarchy
  let currentOrg = agentMembership.organization;
  let level = 1;

  while (currentOrg.parent && remainingAmount > 0) {
    const parentOrg = currentOrg.parent;

    // Find the owner/manager of the parent organization
    const parentMembers = await prisma.organizationMember.findMany({
      where: {
        organizationId: parentOrg.id,
        role: { in: ["MANAGER", "EXECUTIVE", "ADMINISTRATOR"] },
        isActive: true,
      },
      include: {
        user: true,
      },
      orderBy: {
        joinedAt: "asc",
      },
      take: 1,
    });

    if (parentMembers.length > 0) {
      const parentMember = parentMembers[0];
      const parentSplit = parentMember.commissionSplit || getDefaultSplit(level);
      const parentAmount = Math.min(totalAmount * parentSplit, remainingAmount);

      splits.push({
        userId: parentMember.userId,
        userName: `${parentMember.user.firstName} ${parentMember.user.lastName}`,
        organizationId: parentOrg.id,
        organizationName: parentOrg.name,
        role: parentMember.role,
        splitPercentage: parentSplit,
        amount: parentAmount,
        level,
      });

      remainingAmount -= parentAmount;
    }

    currentOrg = parentOrg;
    level++;

    // Safety check to prevent infinite loops
    if (level > 5) break;
  }

  return {
    totalAmount,
    splits,
  };
}

/**
 * Create commission records in database
 */
export async function createCommissionRecords(
  input: CommissionInput
): Promise<void> {
  const { splits, totalAmount } = await calculateCommission(input);

  // Create commission records for each split
  for (const split of splits) {
    await prisma.commission.create({
      data: {
        userId: split.userId,
        caseId: input.caseId,
        type: input.type,
        status: "PENDING",
        carrier: input.carrier,
        policyNumber: input.policyNumber,
        amount: totalAmount,
        percentage: split.splitPercentage,
        splitAmount: split.amount,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      },
    });
  }
}

/**
 * Mark commissions as paid
 */
export async function markCommissionsPaid(
  commissionIds: string[]
): Promise<void> {
  await prisma.commission.updateMany({
    where: {
      id: { in: commissionIds },
    },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });
}

/**
 * Calculate total commissions for a user within a date range
 */
export async function calculateUserCommissions(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  byType: Record<string, number>;
}> {
  const commissions = await prisma.commission.findMany({
    where: {
      userId,
      periodStart: { gte: startDate },
      periodEnd: { lte: endDate },
    },
  });

  const totalEarned = commissions.reduce((sum, c) => sum + (c.splitAmount || 0), 0);
  const totalPaid = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + (c.splitAmount || 0), 0);
  const totalPending = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + (c.splitAmount || 0), 0);

  const byType = commissions.reduce(
    (acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + (c.splitAmount || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalEarned,
    totalPaid,
    totalPending,
    byType,
  };
}

/**
 * Get default commission split based on hierarchy level
 */
function getDefaultSplit(level: number): number {
  switch (level) {
    case 0:
      return 0.85; // Agent: 85%
    case 1:
      return 0.1; // Agency: 10%
    case 2:
      return 0.03; // MGA: 3%
    case 3:
      return 0.02; // IMO: 2%
    default:
      return 0;
  }
}

/**
 * Calculate renewal commission based on first year commission
 */
export function calculateRenewalCommission(
  firstYearCommission: number,
  renewalRate: number = 0.05 // Default 5% renewal
): number {
  return firstYearCommission * renewalRate;
}

/**
 * Calculate trail commission for annuities
 */
export function calculateTrailCommission(
  annuityValue: number,
  trailRate: number = 0.003 // Default 0.3% trail
): number {
  return annuityValue * trailRate;
}
