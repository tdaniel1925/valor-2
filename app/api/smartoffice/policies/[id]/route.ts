import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/policies/[id]
 *
 * Fetch a single policy by ID with related data
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

    const { id } = await params;

    const data = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Fetch the policy
      const policy = await db.smartOfficePolicy.findFirst({
        where: {
          id,
          tenantId: tenantContext.tenantId,
        },
        include: {
          notes: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!policy) {
        return null;
      }

      // Find related policies (same primaryInsured)
      const relatedPolicies = await db.smartOfficePolicy.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          primaryInsured: policy.primaryInsured,
          id: {
            not: policy.id, // Exclude current policy
          },
        },
        orderBy: {
          statusDate: 'desc',
        },
        take: 10,
      });

      return {
        policy,
        relatedPolicies,
      };
    });

    if (!data) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Policy detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch policy details' },
      { status: 500 }
    );
  }
}
