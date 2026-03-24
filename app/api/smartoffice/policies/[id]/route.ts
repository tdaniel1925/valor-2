import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/policies/[id]
 * Get a single policy by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    await requireAuth(request);

    const policy = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.smartOfficePolicy.findUnique({
        where: {
          id,
          tenantId: tenantContext.tenantId,
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
      data: policy,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Fetch policy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch policy' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/smartoffice/policies/[id]
 * Update a policy
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const user = await requireAuth(request);

    // Only ADMIN and MANAGER can update policies
    if (user.role !== 'ADMINISTRATOR' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updatedPolicy = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.smartOfficePolicy.update({
        where: {
          id,
          tenantId: tenantContext.tenantId,
        },
        data: {
          ...body,
          updatedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: updatedPolicy,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Update policy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update policy' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/smartoffice/policies/[id]
 * Delete a policy
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const user = await requireAuth(request);

    // Only ADMIN can delete policies
    if (user.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: 'Only administrators can delete policies' },
        { status: 403 }
      );
    }

    await withTenantContext(tenantContext.tenantId, async (db) => {
      await db.smartOfficePolicy.delete({
        where: {
          id,
          tenantId: tenantContext.tenantId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Policy deleted successfully',
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Delete policy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete policy' },
      { status: 500 }
    );
  }
}
