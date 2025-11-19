import { prisma } from "@/lib/db/prisma";

/**
 * Goal Tracking System
 * Calculates progress toward sales and commission goals
 */

export interface GoalProgress {
  goalId: string;
  goalType: string;
  targetAmount: number;
  currentAmount: number;
  percentComplete: number;
  remaining: number;
  isCompleted: boolean;
  daysRemaining: number;
  requiredDailyRate: number;
  currentDailyRate: number;
  onTrack: boolean;
}

/**
 * Calculate progress for a specific goal
 */
export async function calculateGoalProgress(
  goalId: string
): Promise<GoalProgress> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      user: true,
    },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  const now = new Date();
  const startDate = goal.startDate;
  const endDate = goal.endDate;

  // Calculate current amount based on goal type
  let currentAmount = 0;

  switch (goal.type) {
    case "PRODUCTION":
      currentAmount = await calculatePremiumTotal(
        goal.userId,
        startDate,
        endDate
      );
      break;

    case "COMMISSION":
      currentAmount = await calculateCommissionTotal(
        goal.userId,
        startDate,
        endDate
      );
      break;

    case "CASES":
      currentAmount = await calculateCaseCount(goal.userId, startDate, endDate);
      break;

    default:
      throw new Error(`Unsupported goal type: ${goal.type}`);
  }

  // Calculate progress metrics
  const targetAmount = goal.target;
  const percentComplete = Math.min((currentAmount / targetAmount) * 100, 100);
  const remaining = Math.max(targetAmount - currentAmount, 0);
  const isCompleted = currentAmount >= targetAmount;

  // Calculate time-based metrics
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(totalDays - daysElapsed, 0);

  // Calculate required daily rate to meet goal
  const requiredDailyRate = daysRemaining > 0 ? remaining / daysRemaining : 0;

  // Calculate current daily rate based on progress so far
  const currentDailyRate = daysElapsed > 0 ? currentAmount / daysElapsed : 0;

  // Check if on track (current daily rate >= required daily rate)
  const onTrack =
    isCompleted || (daysRemaining > 0 && currentDailyRate >= requiredDailyRate);

  // Note: The Goal model doesn't have currentValue or status fields
  // Progress is calculated on-the-fly

  return {
    goalId,
    goalType: goal.type,
    targetAmount,
    currentAmount,
    percentComplete,
    remaining,
    isCompleted,
    daysRemaining,
    requiredDailyRate,
    currentDailyRate,
    onTrack,
  };
}

/**
 * Calculate progress for all active goals for a user
 */
export async function calculateUserGoals(
  userId: string
): Promise<GoalProgress[]> {
  const goals = await prisma.goal.findMany({
    where: {
      userId,
    },
    orderBy: {
      endDate: "asc",
    },
  });

  const progressList: GoalProgress[] = [];

  for (const goal of goals) {
    try {
      const progress = await calculateGoalProgress(goal.id);
      progressList.push(progress);
    } catch (error) {
      console.error(`Error calculating goal ${goal.id}:`, error);
    }
  }

  return progressList;
}

/**
 * Calculate total premium for a user in date range
 */
async function calculatePremiumTotal(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const cases = await prisma.case.findMany({
    where: {
      userId,
      status: "ISSUED",
      issuedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return cases.reduce((sum, c) => sum + (c.premium || 0), 0);
}

/**
 * Calculate total commissions for a user in date range
 */
async function calculateCommissionTotal(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const commissions = await prisma.commission.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "PAID"] },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return commissions.reduce((sum, c) => sum + (c.splitAmount || 0), 0);
}

/**
 * Calculate total case count for a user in date range
 */
async function calculateCaseCount(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  return await prisma.case.count({
    where: {
      userId,
      status: "ISSUED",
      issuedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
}

/**
 * Calculate total policy count for a user in date range
 */
async function calculatePolicyCount(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  return await prisma.case.count({
    where: {
      userId,
      status: "ISSUED",
      issuedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
}

/**
 * Calculate new client count for a user in date range
 */
async function calculateNewClientCount(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const cases = await prisma.case.findMany({
    where: {
      userId,
      status: "ISSUED",
      issuedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      clientName: true,
    },
  });

  // Count unique client names
  const uniqueClients = new Set(cases.map((c) => c.clientName));
  return uniqueClients.size;
}

/**
 * Create a new goal
 */
export async function createGoal(data: {
  userId: string;
  title: string;
  type: any;
  target: number;
  startDate: Date;
  endDate: Date;
  description?: string;
}) {
  return await prisma.goal.create({
    data: {
      userId: data.userId,
      title: data.title,
      type: data.type as any,
      target: data.target,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
    },
  });
}

/**
 * Get goal leaderboard for team/organization
 */
export async function getGoalLeaderboard(
  organizationId: string,
  metric: string,
  startDate: Date,
  endDate: Date
): Promise<
  Array<{
    userId: string;
    userName: string;
    amount: number;
    rank: number;
  }>
> {
  // Get all users in organization
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      user: true,
    },
  });

  const leaderboard = [];

  for (const member of members) {
    let amount = 0;

    switch (metric) {
      case "PREMIUM":
        amount = await calculatePremiumTotal(
          member.userId,
          startDate,
          endDate
        );
        break;
      case "COMMISSIONS":
        amount = await calculateCommissionTotal(
          member.userId,
          startDate,
          endDate
        );
        break;
      case "CASES":
        amount = await calculateCaseCount(member.userId, startDate, endDate);
        break;
      case "POLICIES":
        amount = await calculatePolicyCount(member.userId, startDate, endDate);
        break;
      case "NEW_CLIENTS":
        amount = await calculateNewClientCount(
          member.userId,
          startDate,
          endDate
        );
        break;
    }

    leaderboard.push({
      userId: member.userId,
      userName: `${member.user.firstName} ${member.user.lastName}`,
      amount,
      rank: 0, // Will be assigned after sorting
    });
  }

  // Sort by amount descending
  leaderboard.sort((a, b) => b.amount - a.amount);

  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}
