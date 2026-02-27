import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/agents
 *
 * Fetch agents with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

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

    // Filters
    const supervisor = searchParams.get('supervisor');
    const subSource = searchParams.get('subSource');

    const result = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Build where clause
      const where: any = {
        tenantId: tenantContext.tenantId,
      };

      // Search across multiple fields
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { npn: { contains: search, mode: 'insensitive' } },
          { supervisor: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Apply filters
      if (supervisor) where.supervisor = { contains: supervisor, mode: 'insensitive' };
      if (subSource) where.subSource = { contains: subSource, mode: 'insensitive' };

      // Fetch data
      const [agents, total] = await Promise.all([
        db.smartOfficeAgent.findMany({
          where,
          orderBy: { fullName: 'asc' },
          skip,
          take: limit,
        }),
        db.smartOfficeAgent.count({ where }),
      ]);

      return { agents, total };
    });

    return NextResponse.json({
      success: true,
      data: result.agents,
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
    console.error('[SmartOffice] Fetch agents error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
