import { NextRequest, NextResponse } from 'next/server';

// Mock data generator for agent analytics
function generateAgentAnalytics(period: string) {
  const agents = [
    { id: 'AGT-001', name: 'Sarah Johnson', email: 'sarah.j@valor.com', org: 'Elite Producers' },
    { id: 'AGT-002', name: 'Michael Chen', email: 'michael.c@valor.com', org: 'Premier Group' },
    { id: 'AGT-003', name: 'Emily Rodriguez', email: 'emily.r@valor.com', org: 'Elite Producers' },
    { id: 'AGT-004', name: 'David Thompson', email: 'david.t@valor.com', org: 'Regional Partners' },
    { id: 'AGT-005', name: 'Jennifer Martinez', email: 'jennifer.m@valor.com', org: 'Premier Group' },
    { id: 'AGT-006', name: 'Robert Williams', email: 'robert.w@valor.com', org: 'Elite Producers' },
    { id: 'AGT-007', name: 'Lisa Anderson', email: 'lisa.a@valor.com', org: 'Regional Partners' },
    { id: 'AGT-008', name: 'James Brown', email: 'james.b@valor.com', org: 'Premier Group' },
    { id: 'AGT-009', name: 'Patricia Taylor', email: 'patricia.t@valor.com', org: 'Elite Producers' },
    { id: 'AGT-010', name: 'Christopher Lee', email: 'chris.l@valor.com', org: 'Regional Partners' },
  ];

  const agentMetrics = agents.map((agent, index) => {
    const basePremium = 500000 - (index * 45000);
    const policyCount = 25 - index;

    return {
      agentId: agent.id,
      agentName: agent.name,
      email: agent.email,
      organization: agent.org,
      totalPremium: basePremium + Math.random() * 50000,
      policyCount,
      averageCase: (basePremium / policyCount) * 1.2,
      conversionRate: 65 + Math.random() * 25,
      quoteToAppRatio: 70 + Math.random() * 20,
      averageTimeToClose: 14 + Math.floor(Math.random() * 21),
      persistency: 85 + Math.random() * 12,
      rank: index + 1,
      growth: -15 + Math.random() * 50,
      productMix: {
        life: 40 + Math.random() * 20,
        annuity: 30 + Math.random() * 20,
        term: 20 + Math.random() * 20,
      },
      monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(2024, 10 - i, 1).toLocaleDateString('en-US', { month: 'short' }),
        premium: basePremium * (0.15 + Math.random() * 0.1),
        cases: Math.floor(policyCount * (0.15 + Math.random() * 0.1)),
      })).reverse(),
    };
  });

  // Sort by total premium
  agentMetrics.sort((a, b) => b.totalPremium - a.totalPremium);

  // Update ranks
  agentMetrics.forEach((agent, index) => {
    agent.rank = index + 1;
  });

  const totalAgents = agentMetrics.length;
  const activeAgents = agentMetrics.filter(a => a.policyCount > 0).length;
  const averagePremium = agentMetrics.reduce((sum, a) => sum + a.totalPremium, 0) / totalAgents;
  const topPerformerGrowth = Math.max(...agentMetrics.map(a => a.growth));

  return {
    summary: {
      totalAgents,
      activeAgents,
      averagePremium: Math.round(averagePremium),
      topPerformerGrowth: Math.round(topPerformerGrowth),
    },
    agents: agentMetrics,
    period,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'ytd';

    const data = generateAgentAnalytics(period);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Agent analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent analytics' },
      { status: 500 }
    );
  }
}
