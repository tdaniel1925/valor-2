import { NextRequest, NextResponse } from 'next/server';
import { withVerifiedTenant } from '@/lib/auth/require-tenant-access';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { getPolicies, getPolicyStats } from '@/lib/smartoffice/data-service';
import { z } from 'zod';

// Query parameter validation schema
const policiesQuerySchema = z.object({
  agent: z.string().max(100, 'Agent name is too long').optional(),
  agency: z.string().max(100, 'Agency name is too long').optional(),
  carrier: z.string().max(100, 'Carrier name is too long').optional(),
  status: z.string().max(50, 'Status is too long').optional(),
  search: z.string().max(200, 'Search query is too long').optional(),
  sortBy: z
    .enum(['statusDate', 'premium', 'status', 'carrier', 'agent'])
    .default('statusDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

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
  // DEVELOPMENT MODE: Bypass authentication for testing
  if (process.env.NODE_ENV === 'development') {
    try {
      const tenantContext = getTenantFromRequest(request);
      if (!tenantContext) {
        return NextResponse.json(
          { error: 'Tenant context not found' },
          { status: 400 }
        );
      }

      const { searchParams } = new URL(request.url);
      const queryParams = policiesQuerySchema.parse({
        agent: searchParams.get('agent') || undefined,
        agency: searchParams.get('agency') || undefined,
        carrier: searchParams.get('carrier') || undefined,
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || 'statusDate',
        sortOrder: searchParams.get('sortOrder') || 'desc',
      });

      const { agent, agency, carrier, status, search, sortBy, sortOrder } = queryParams;

      // Use unified data service - single source of truth from SmartOfficePolicy
      const result = await getPolicies(tenantContext.tenantId, {
        agent,
        carrier,
        status,
        search,
        sortBy,
        sortOrder,
      });

      return NextResponse.json({
        success: true,
        policies: result.policies,
        filters: result.filters,
        total: result.total,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.issues },
          { status: 400 }
        );
      }
      console.error('[Cases/Policies] Fetch error (dev mode):', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch policies' },
        { status: 500 }
      );
    }
  }

  // PRODUCTION MODE: Require authentication
  return await withVerifiedTenant(request, async ({ tenantId }, prisma) => {
    try {
      // Get and validate query parameters
      const { searchParams } = new URL(request.url);
      const queryParams = policiesQuerySchema.parse({
        agent: searchParams.get('agent') || undefined,
        agency: searchParams.get('agency') || undefined,
        carrier: searchParams.get('carrier') || undefined,
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || 'statusDate',
        sortOrder: searchParams.get('sortOrder') || 'desc',
      });

      const { agent, agency, carrier, status, search, sortBy, sortOrder } = queryParams;

      // Use unified data service - single source of truth from SmartOfficePolicy
      const result = await getPolicies(tenantId, {
        agent,
        carrier,
        status,
        search,
        sortBy,
        sortOrder,
      });

      return NextResponse.json({
        success: true,
        policies: result.policies,
        filters: result.filters,
        total: result.total,
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.issues },
          { status: 400 }
        );
      }
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.error('[Cases/Policies] Fetch error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch policies' },
        { status: 500 }
      );
    }
  });
}
