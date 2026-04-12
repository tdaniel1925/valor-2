import { NextRequest, NextResponse } from 'next/server';
import { withVerifiedTenant } from '@/lib/auth/require-tenant-access';
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

      // Build where clause
      const where: any = {
        tenantId: tenantId,
      };

      if (agent) {
        where.primaryAdvisor = { contains: agent, mode: 'insensitive' };
      }

      if (carrier) {
        where.carrier = { contains: carrier, mode: 'insensitive' };
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { policyNumber: { contains: search, mode: 'insensitive' } },
          { primaryInsured: { contains: search, mode: 'insensitive' } },
          { primaryAdvisor: { contains: search, mode: 'insensitive' } },
          { carrier: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build orderBy
      const orderBy: any = {};
      if (sortBy === 'premium') {
        orderBy.commAnnualizedPrem = sortOrder;
      } else if (sortBy === 'status') {
        orderBy.status = sortOrder;
      } else if (sortBy === 'carrier') {
        orderBy.carrier = sortOrder;
      } else if (sortBy === 'agent') {
        orderBy.primaryAdvisor = sortOrder;
      } else {
        orderBy.statusDate = sortOrder;
      }

      const policies = await prisma.case.findMany({
        where,
        orderBy,
        include: {
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      // Get unique values for filters
      const allPolicies = await prisma.case.findMany({
        where: { tenantId: tenantId },
        select: {
          primaryAdvisor: true,
          carrier: true,
          status: true,
        },
      });

      // Extract unique values and filter out null/undefined
      const agents = Array.from(new Set(allPolicies.map(p => p.primaryAdvisor).filter(Boolean))).sort();
      const carriers = Array.from(new Set(allPolicies.map(p => p.carrier).filter(Boolean))).sort();
      const statuses = Array.from(new Set(allPolicies.map(p => p.status).filter(Boolean))).sort();

      // For now, agencies are not in the new structure
      const agencies: string[] = [];

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
