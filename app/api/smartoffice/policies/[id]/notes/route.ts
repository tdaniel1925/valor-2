import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/policies/[id]/notes
 *
 * Fetch all notes for a policy
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
    const user = await requireAuth(request);
    const { id: policyId } = await params;

    const notes = await withTenantContext(tenantContext.tenantId, async (db) => {
      return db.policyNote.findMany({
        where: {
          policyId,
          tenantId: tenantContext.tenantId,
        },
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
      });
    });

    return NextResponse.json({
      success: true,
      data: notes,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Fetch notes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/smartoffice/policies/[id]/notes
 *
 * Create a new note for a policy
 */
export async function POST(
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
    const user = await requireAuth(request);
    const { id: policyId } = await params;
    const body = await request.json();

    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    const note = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Verify policy exists and belongs to tenant
      const policy = await db.smartOfficePolicy.findFirst({
        where: {
          id: policyId,
          tenantId: tenantContext.tenantId,
        },
      });

      if (!policy) {
        throw new Error('Policy not found');
      }

      // Create note
      return db.policyNote.create({
        data: {
          content: content.trim(),
          tenantId: tenantContext.tenantId,
          policyId,
          userId: user.id,
        },
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
      });
    });

    return NextResponse.json({
      success: true,
      data: note,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Policy not found') {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }
    console.error('[SmartOffice] Create note error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}
