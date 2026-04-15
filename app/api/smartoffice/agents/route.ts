import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { getAgents } from '@/lib/smartoffice/data-service';

/**
 * GET /api/smartoffice/agents
 *
 * Fetch agents with pagination, search, and filters
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
    const search = searchParams.get('search') || undefined;

    // Filters
    const supervisor = searchParams.get('supervisor') || undefined;
    const subSource = searchParams.get('subSource') || undefined;

    // Use unified data service - single source of truth from SmartOfficeAgent
    const result = await getAgents(tenantContext.tenantId, {
      page,
      limit,
      search,
      supervisor,
      subSource,
    });

    return NextResponse.json({
      success: true,
      data: result.agents,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
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
