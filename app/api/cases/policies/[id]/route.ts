import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/cases/policies/[id]
 *
 * Get a single SmartOffice policy by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: policyId } = await params;

    const policy = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.smartOfficePolicy.findFirst({
        where: {
          id: policyId,
          tenantId: tenantContext.tenantId,
        },
        include: {
          notes: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      policy,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Cases/Policy Detail] Fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch policy' },
      { status: 500 }
    );
  }
}
