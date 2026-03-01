import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-context';
import { getTenantContext } from '@/lib/tenant-context';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

// GET - Fetch widget data based on type
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const config = searchParams.get('config') ? JSON.parse(searchParams.get('config')!) : {};

    if (!type) {
      return NextResponse.json({ error: 'Widget type required' }, { status: 400 });
    }

    let data;

    switch (type) {
      case 'stats':
        data = await getStatsData(tenantContext.tenantId, config);
        break;

      case 'mini-chart':
        data = await getMiniChartData(tenantContext.tenantId, config);
        break;

      case 'recent-activity':
        data = await getRecentActivityData(tenantContext.tenantId);
        break;

      case 'pending-list':
        data = await getPendingListData(tenantContext.tenantId, config);
        break;

      case 'commission':
        data = await getCommissionData(tenantContext.tenantId, config);
        break;

      case 'top-agents':
        data = await getTopAgentsData(tenantContext.tenantId, config);
        break;

      case 'carrier-status':
        data = await getCarrierStatusData(tenantContext.tenantId);
        break;

      case 'quick-filters':
        data = await getQuickFiltersData(tenantContext.tenantId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid widget type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching widget data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch widget data' },
      { status: 500 }
    );
  }
}

// Helper functions for each widget type
async function getStatsData(tenantId: string, config: any) {
  const { metric = 'total-policies' } = config;

  const policies = await db.smartOfficePolicy.findMany({
    where: { tenantId },
    select: {
      annualPremium: true,
      status: true,
    },
  });

  switch (metric) {
    case 'total-policies':
      return { value: policies.length, label: 'Total Policies' };

    case 'total-premium':
      const totalPremium = policies.reduce((sum, p) => sum + (p.annualPremium || 0), 0);
      return { value: totalPremium, label: 'Total Premium', format: 'currency' };

    case 'pending-count':
      const pendingCount = policies.filter(p => p.status === 'PENDING').length;
      return { value: pendingCount, label: 'Pending Policies' };

    case 'inforce-count':
      const inforceCount = policies.filter(p => p.status === 'INFORCE').length;
      return { value: inforceCount, label: 'Inforce Policies' };

    default:
      return { value: policies.length, label: 'Total Policies' };
  }
}

async function getMiniChartData(tenantId: string, config: any) {
  const { months = 6 } = config;
  const startDate = subMonths(new Date(), months);

  const policies = await db.smartOfficePolicy.findMany({
    where: {
      tenantId,
      statusDate: { gte: startDate },
    },
    select: {
      statusDate: true,
      annualPremium: true,
    },
  });

  // Group by month
  const monthlyData: Record<string, number> = {};
  policies.forEach(policy => {
    if (!policy.statusDate) return;
    const monthKey = policy.statusDate.toISOString().substring(0, 7);
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (policy.annualPremium || 0);
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

async function getRecentActivityData(tenantId: string) {
  const syncLogs = await db.smartOfficeSyncLog.findMany({
    where: { tenantId },
    orderBy: { startedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      syncType: true,
      status: true,
      recordsCreated: true,
      recordsUpdated: true,
      startedAt: true,
      completedAt: true,
    },
  });

  return syncLogs.map(log => ({
    id: log.id,
    type: log.syncType,
    status: log.status,
    recordsAffected: log.recordsCreated + log.recordsUpdated,
    timestamp: log.startedAt,
    duration: log.completedAt
      ? Math.round((log.completedAt.getTime() - log.startedAt.getTime()) / 1000)
      : null,
  }));
}

async function getPendingListData(tenantId: string, config: any) {
  const { daysThreshold = 7, limit = 10 } = config;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  const policies = await db.smartOfficePolicy.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      statusDate: { lte: thresholdDate },
    },
    orderBy: { statusDate: 'asc' },
    take: limit,
    select: {
      id: true,
      policyNumber: true,
      primaryInsured: true,
      carrierName: true,
      statusDate: true,
      annualPremium: true,
    },
  });

  return policies.map(policy => ({
    id: policy.id,
    policyNumber: policy.policyNumber,
    insured: policy.primaryInsured,
    carrier: policy.carrierName,
    daysP ending: policy.statusDate
      ? Math.floor((new Date().getTime() - policy.statusDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    premium: policy.annualPremium,
  }));
}

async function getCommissionData(tenantId: string, config: any) {
  const { goal = 100000 } = config;
  const currentMonth = startOfMonth(new Date());

  const policies = await db.smartOfficePolicy.findMany({
    where: {
      tenantId,
      statusDate: { gte: currentMonth },
      status: 'INFORCE',
    },
    select: {
      annualPremium: true,
    },
  });

  const totalPremium = policies.reduce((sum, p) => sum + (p.annualPremium || 0), 0);
  const estimatedCommission = totalPremium * 0.05; // Assume 5% commission rate
  const progress = goal > 0 ? (estimatedCommission / goal) * 100 : 0;

  return {
    current: estimatedCommission,
    goal,
    progress: Math.min(progress, 100),
    remaining: Math.max(goal - estimatedCommission, 0),
  };
}

async function getTopAgentsData(tenantId: string, config: any) {
  const { limit = 5, metric = 'premium' } = config;

  const agents = await db.smartOfficeAgent.findMany({
    where: { tenantId },
    include: {
      policies: {
        where: { status: 'INFORCE' },
        select: { annualPremium: true },
      },
    },
  });

  const agentStats = agents.map(agent => ({
    id: agent.id,
    name: `${agent.firstName} ${agent.lastName}`,
    policyCount: agent.policies.length,
    totalPremium: agent.policies.reduce((sum, p) => sum + (p.annualPremium || 0), 0),
  }));

  const sorted = agentStats.sort((a, b) =>
    metric === 'count' ? b.policyCount - a.policyCount : b.totalPremium - a.totalPremium
  );

  return sorted.slice(0, limit);
}

async function getCarrierStatusData(tenantId: string) {
  const policies = await db.smartOfficePolicy.findMany({
    where: { tenantId },
    select: {
      carrierName: true,
      status: true,
      statusDate: true,
    },
  });

  // Group by carrier
  const carrierStats: Record<string, any> = {};
  policies.forEach(policy => {
    if (!carrierStats[policy.carrierName]) {
      carrierStats[policy.carrierName] = {
        name: policy.carrierName,
        total: 0,
        pending: 0,
        inforce: 0,
        avgResponseDays: [] as number[],
      };
    }
    carrierStats[policy.carrierName].total++;
    if (policy.status === 'PENDING') carrierStats[policy.carrierName].pending++;
    if (policy.status === 'INFORCE') carrierStats[policy.carrierName].inforce++;

    // Calculate response time for inforce policies
    if (policy.status === 'INFORCE' && policy.statusDate) {
      const daysSinceStatus = Math.floor(
        (new Date().getTime() - policy.statusDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      carrierStats[policy.carrierName].avgResponseDays.push(daysSinceStatus);
    }
  });

  return Object.values(carrierStats).map((carrier: any) => ({
    name: carrier.name,
    total: carrier.total,
    pending: carrier.pending,
    inforce: carrier.inforce,
    avgResponseTime: carrier.avgResponseDays.length > 0
      ? Math.round(carrier.avgResponseDays.reduce((a: number, b: number) => a + b, 0) / carrier.avgResponseDays.length)
      : null,
  }));
}

async function getQuickFiltersData(tenantId: string) {
  const policies = await db.smartOfficePolicy.findMany({
    where: { tenantId },
    select: { status: true, statusDate: true },
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    pending: policies.filter(p => p.status === 'PENDING').length,
    pendingOver7Days: policies.filter(
      p => p.status === 'PENDING' && p.statusDate && p.statusDate < sevenDaysAgo
    ).length,
    thisMonth: policies.filter(
      p => p.statusDate && p.statusDate >= thirtyDaysAgo
    ).length,
    inforce: policies.filter(p => p.status === 'INFORCE').length,
  };
}
