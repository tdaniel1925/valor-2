import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/agents/[id]
 * Get a single agent by ID
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

    const agent = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.smartOfficeAgent.findUnique({
        where: {
          id,
          tenantId: tenantContext.tenantId,
        },
      });
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agent,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Fetch agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/smartoffice/agents/[id]
 * Update an agent
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

    // Only ADMIN and MANAGER can update agents
    if (user.role !== 'ADMINISTRATOR' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updatedAgent = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.smartOfficeAgent.update({
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
      data: updatedAgent,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Update agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update agent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/smartoffice/agents/[id]
 * Delete an agent
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

    // Only ADMIN can delete agents
    if (user.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: 'Only administrators can delete agents' },
        { status: 403 }
      );
    }

    await withTenantContext(tenantContext.tenantId, async (db) => {
      await db.smartOfficeAgent.delete({
        where: {
          id,
          tenantId: tenantContext.tenantId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully',
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Delete agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
