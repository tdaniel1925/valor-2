import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

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

    const data = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Get all active goals
      const goals = await db.goal.findMany({
        where: {
          tenantId: tenantContext.tenantId,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          endDate: 'asc',
        },
      });

      const now = new Date();

      // Calculate current progress for each goal based on actual data
      const goalProgress = await Promise.all(
        goals.map(async (goal) => {
          const target = goal.target;
          let current = 0;

          // Calculate current value based on goal type
          switch (goal.type) {
            case 'COMMISSION':
              // Sum commissions for this user in the goal period
              const commissionResult = await db.commission.aggregate({
                where: {
                  userId: goal.userId,
                  createdAt: {
                    gte: new Date(goal.startDate),
                    lte: new Date(goal.endDate),
                  },
                  status: {
                    in: ['PAID', 'PENDING'],
                  },
                },
                _sum: {
                  amount: true,
                },
              });
              current = commissionResult._sum.amount || 0;
              break;

            case 'CASES':
              // Count cases created by this user in the goal period
              current = await db.case.count({
                where: {
                  userId: goal.userId,
                  createdAt: {
                    gte: new Date(goal.startDate),
                    lte: new Date(goal.endDate),
                  },
                },
              });
              break;

            case 'PRODUCTION':
              // Sum premium/target amounts from policies/cases
              const productionResult = await db.smartOfficePolicy.aggregate({
                where: {
                  primaryAdvisor: {
                    contains: goal.user.lastName, // Match by advisor name
                  },
                  statusDate: {
                    gte: new Date(goal.startDate),
                    lte: new Date(goal.endDate),
                  },
                },
                _sum: {
                  targetAmount: true,
                },
              });
              current = productionResult._sum.targetAmount || 0;
              break;

            default:
              current = 0;
          }

          return { goal, current };
        })
      );

      const goalTracking = goalProgress.map(({ goal, current }) => {
        const target = goal.target;
        const percentage = target > 0 ? (current / target) * 100 : 0;

        const endDate = new Date(goal.endDate);
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        // Determine status
        let status: 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED';
        if (percentage >= 100) {
          status = 'ACHIEVED';
        } else if (daysRemaining <= 0) {
          status = 'MISSED';
        } else if (percentage >= 75) {
          status = 'ON_TRACK';
        } else {
          status = 'AT_RISK';
        }

        // Calculate projections
        const startDate = new Date(goal.startDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysPassed = totalDays - daysRemaining;
        const projectedCompletion = daysPassed > 0 ? (current / daysPassed) * totalDays : current;

        const remaining = target - current;
        const requiredDailyRate = daysRemaining > 0 ? remaining / daysRemaining : 0;
        const currentDailyRate = daysPassed > 0 ? current / daysPassed : 0;

        return {
          goalId: goal.id,
          goalName: goal.title,
          agentName: `${goal.user.firstName} ${goal.user.lastName}`,
          organization: '', // TODO: Add if needed
          goalType: goal.type,
          target,
          current,
          percentage: Math.round(percentage * 100) / 100,
          daysRemaining,
          status,
          projectedCompletion: Math.round(projectedCompletion),
          remaining: Math.round(remaining),
          requiredDailyRate: Math.round(requiredDailyRate),
          currentDailyRate: Math.round(currentDailyRate),
        };
      });

      // Calculate summary
      const totalGoals = goalTracking.length;
      const onTrack = goalTracking.filter((g) => g.status === 'ON_TRACK').length;
      const atRisk = goalTracking.filter((g) => g.status === 'AT_RISK').length;
      const achieved = goalTracking.filter((g) => g.status === 'ACHIEVED').length;
      const missed = goalTracking.filter((g) => g.status === 'MISSED').length;
      const averageCompletion =
        goalTracking.reduce((sum, g) => sum + g.percentage, 0) / (totalGoals || 1);

      return {
        summary: {
          totalGoals,
          onTrack,
          atRisk,
          achieved,
          missed,
          averageCompletion: Math.round(averageCompletion),
        },
        goals: goalTracking,
        period,
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Goal tracking API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal tracking data' },
      { status: 500 }
    );
  }
}
