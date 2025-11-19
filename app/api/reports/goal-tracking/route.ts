import { NextRequest, NextResponse } from 'next/server';

// Mock data generator for goal tracking
function generateGoalTracking(period: string) {
  const agents = [
    { id: 'AGT-001', name: 'Sarah Johnson', org: 'Elite Producers' },
    { id: 'AGT-002', name: 'Michael Chen', org: 'Premier Group' },
    { id: 'AGT-003', name: 'Emily Rodriguez', org: 'Elite Producers' },
    { id: 'AGT-004', name: 'David Thompson', org: 'Regional Partners' },
    { id: 'AGT-005', name: 'Jennifer Martinez', org: 'Premier Group' },
  ];

  const goalTypes: Array<'PREMIUM' | 'CASES' | 'REVENUE' | 'ANNUALIZED'> = ['PREMIUM', 'CASES', 'REVENUE', 'ANNUALIZED'];
  const statuses: Array<'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED'> = ['ON_TRACK', 'AT_RISK', 'ACHIEVED', 'MISSED'];

  const goals = agents.map((agent, index) => {
    const target = 100000 + (index * 20000);
    const percentage = 30 + Math.random() * 70;
    const current = Math.floor((target * percentage) / 100);
    const daysRemaining = 30 + Math.floor(Math.random() * 60);

    // Determine status based on percentage and days remaining
    let status: 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED';
    if (percentage >= 100) {
      status = 'ACHIEVED';
    } else if (percentage >= 75) {
      status = 'ON_TRACK';
    } else if (percentage >= 50) {
      status = 'AT_RISK';
    } else {
      status = 'AT_RISK';
    }

    const projectedCompletion = percentage + ((percentage / (90 - daysRemaining)) * daysRemaining);
    const remaining = target - current;
    const requiredDailyRate = daysRemaining > 0 ? Math.floor(remaining / daysRemaining) : 0;
    const currentDailyRate = Math.floor(current / (90 - daysRemaining));

    return {
      goalId: `GOAL-${String(index + 1).padStart(3, '0')}`,
      goalName: `Q4 ${goalTypes[index % goalTypes.length]} Goal`,
      agentName: agent.name,
      organization: agent.org,
      goalType: goalTypes[index % goalTypes.length],
      target,
      current,
      percentage,
      daysRemaining,
      status,
      projectedCompletion,
      requiredDailyRate,
      currentDailyRate,
      startDate: '2024-10-01',
      endDate: '2024-12-31',
    };
  });

  // Calculate summary stats
  const totalGoals = goals.length;
  const achieved = goals.filter(g => g.status === 'ACHIEVED').length;
  const onTrack = goals.filter(g => g.status === 'ON_TRACK').length;
  const atRisk = goals.filter(g => g.status === 'AT_RISK').length;
  const averageCompletion = goals.reduce((sum, g) => sum + g.percentage, 0) / totalGoals;

  return {
    summary: {
      totalGoals,
      achieved,
      onTrack,
      atRisk,
      averageCompletion,
    },
    goals,
    period,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'ytd';

    const data = generateGoalTracking(period);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Goal tracking API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal tracking' },
      { status: 500 }
    );
  }
}
