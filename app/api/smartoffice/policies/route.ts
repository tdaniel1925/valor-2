import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/policies
 *
 * Fetch policies with pagination, search, and filters
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

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Search
    const search = searchParams.get('search') || '';

    // Filters (single value - for quick actions)
    const carrier = searchParams.get('carrier');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const advisor = searchParams.get('advisor');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Advanced filters (multi-value)
    const statusList = searchParams.get('statusList');
    const carrierList = searchParams.get('carrierList');
    const typeList = searchParams.get('typeList');
    const premiumMin = searchParams.get('premiumMin');
    const premiumMax = searchParams.get('premiumMax');

    const result = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Build where clause
      const where: any = {
        tenantId: tenantContext.tenantId,
      };

      // Search across multiple fields
      if (search) {
        where.OR = [
          { policyNumber: { contains: search, mode: 'insensitive' } },
          { primaryAdvisor: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { carrierName: { contains: search, mode: 'insensitive' } },
          { primaryInsured: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Apply single-value filters (from quick actions)
      if (carrier) where.carrierName = { contains: carrier, mode: 'insensitive' };
      if (type) where.type = type;
      if (status) where.status = status;
      if (advisor) where.primaryAdvisor = { contains: advisor, mode: 'insensitive' };

      // Apply multi-value filters (from advanced filter panel)
      if (statusList) {
        const statuses = statusList.split(',');
        where.status = { in: statuses as any };
      }
      if (carrierList) {
        const carriers = carrierList.split(',');
        where.carrierName = { in: carriers };
      }
      if (typeList) {
        const types = typeList.split(',');
        where.type = { in: types as any };
      }

      // Date filters
      if (dateFrom || dateTo) {
        where.statusDate = {};
        if (dateFrom) where.statusDate.gte = new Date(dateFrom);
        if (dateTo) where.statusDate.lte = new Date(dateTo);
      }

      // Premium range filters
      if (premiumMin || premiumMax) {
        where.commAnnualizedPrem = {};
        if (premiumMin) where.commAnnualizedPrem.gte = parseFloat(premiumMin);
        if (premiumMax) where.commAnnualizedPrem.lte = parseFloat(premiumMax);
      }

      // Fetch data
      const [policies, total] = await Promise.all([
        db.smartOfficePolicy.findMany({
          where,
          orderBy: { lastSyncDate: 'desc' },
          skip,
          take: limit,
        }),
        db.smartOfficePolicy.count({ where }),
      ]);

      return { policies, total };
    });

    return NextResponse.json({
      success: true,
      data: result.policies,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Fetch policies error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}
