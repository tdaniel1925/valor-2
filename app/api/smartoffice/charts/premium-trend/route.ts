import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/charts/premium-trend
 *
 * Get premium trend data by month (last 6 months)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Require authentication
    await requireAuth(request);

    const data = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Get policies from last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const policies = await db.smartOfficePolicy.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          statusDate: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          statusDate: true,
          status: true,
          commAnnualizedPrem: true,
        },
        orderBy: {
          statusDate: 'asc',
        },
      });

      // Group by month and status
      const monthlyData: Record<string, Record<string, number>> = {};

      policies.forEach((policy) => {
        if (!policy.statusDate) return;

        const date = new Date(policy.statusDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            INFORCE: 0,
            PENDING: 0,
            SUBMITTED: 0,
            OTHER: 0,
          };
        }

        const premium = policy.commAnnualizedPrem || 0;
        const status = policy.status;

        if (['INFORCE', 'PENDING', 'SUBMITTED'].includes(status)) {
          monthlyData[monthKey][status] += premium;
        } else {
          monthlyData[monthKey].OTHER += premium;
        }
      });

      // Convert to array format for chart
      const chartData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, values]) => ({
          month,
          monthLabel: new Date(month + '-01').toLocaleDateString('en-US', {
            month: 'short',
            year: '2-digit',
          }),
          inforce: values.INFORCE,
          pending: values.PENDING,
          submitted: values.SUBMITTED,
          other: values.OTHER,
          total: values.INFORCE + values.PENDING + values.SUBMITTED + values.OTHER,
        }));

      return chartData;
    });

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Premium trend chart error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch premium trend data' },
      { status: 500 }
    );
  }
}
