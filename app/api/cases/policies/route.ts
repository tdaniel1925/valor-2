import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/cases/policies
 *
 * Get all SmartOffice policies with optional filters
 * Query params:
 *   - agent: Filter by primary advisor name
 *   - agency: Filter by agency name (from additionalData)
 *   - carrier: Filter by carrier name
 *   - status: Filter by policy status
 *   - search: Search across multiple fields
 *   - sortBy: Field to sort by (default: statusDate)
 *   - sortOrder: asc or desc (default: desc)
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get('agent');
    const agency = searchParams.get('agency');
    const carrier = searchParams.get('carrier');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'statusDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const policies = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Build where clause
      const where: any = {
        tenantId: tenantContext.tenantId,
      };

      if (agent) {
        where.primaryAdvisor = { contains: agent, mode: 'insensitive' };
      }

      if (carrier) {
        where.carrierName = { contains: carrier, mode: 'insensitive' };
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { policyNumber: { contains: search, mode: 'insensitive' } },
          { primaryInsured: { contains: search, mode: 'insensitive' } },
          { primaryAdvisor: { contains: search, mode: 'insensitive' } },
          { carrierName: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { searchText: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build orderBy
      const orderBy: any = {};
      if (sortBy === 'premium') {
        orderBy.commAnnualizedPrem = sortOrder;
      } else if (sortBy === 'status') {
        orderBy.status = sortOrder;
      } else if (sortBy === 'carrier') {
        orderBy.carrierName = sortOrder;
      } else if (sortBy === 'agent') {
        orderBy.primaryAdvisor = sortOrder;
      } else {
        orderBy.statusDate = sortOrder;
      }

      return await db.smartOfficePolicy.findMany({
        where,
        orderBy,
        include: {
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
    });

    // Get unique values for filters
    const allPolicies = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.smartOfficePolicy.findMany({
        where: { tenantId: tenantContext.tenantId },
        select: {
          primaryAdvisor: true,
          carrierName: true,
          status: true,
          additionalData: true,
        },
      });
    });

    // Extract unique values
    const agents = Array.from(new Set(allPolicies.map(p => p.primaryAdvisor))).sort();
    const carriers = Array.from(new Set(allPolicies.map(p => p.carrierName))).sort();
    const statuses = Array.from(new Set(allPolicies.map(p => p.status))).sort();

    // Extract agencies from additionalData if available
    const agencies = Array.from(
      new Set(
        allPolicies
          .map(p => p.additionalData && typeof p.additionalData === 'object' && 'agency' in p.additionalData ? (p.additionalData as any).agency : null)
          .filter(Boolean)
      )
    ).sort();

    return NextResponse.json({
      success: true,
      policies,
      filters: {
        agents,
        agencies,
        carriers,
        statuses,
      },
      total: policies.length,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Cases/Policies] Fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}
