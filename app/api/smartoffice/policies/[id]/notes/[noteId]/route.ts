import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * PUT /api/smartoffice/policies/[id]/notes/[noteId]
 *
 * Update a note (only by the author)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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
    const { noteId } = await params;
    const body = await request.json();

    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    const note = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Verify note exists, belongs to tenant, and user is the author
      const existingNote = await db.policyNote.findFirst({
        where: {
          id: noteId,
          tenantId: tenantContext.tenantId,
          userId: user.id, // Only author can edit
        },
      });

      if (!existingNote) {
        throw new Error('Note not found or you do not have permission to edit it');
      }

      // Update note
      return db.policyNote.update({
        where: {
          id: noteId,
        },
        data: {
          content: content.trim(),
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
    if (error instanceof Error && error.message.includes('Note not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[SmartOffice] Update note error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update note' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/smartoffice/policies/[id]/notes/[noteId]
 *
 * Delete a note (only by the author)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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
    const { noteId } = await params;

    await withTenantContext(tenantContext.tenantId, async (db) => {
      // Verify note exists, belongs to tenant, and user is the author
      const existingNote = await db.policyNote.findFirst({
        where: {
          id: noteId,
          tenantId: tenantContext.tenantId,
          userId: user.id, // Only author can delete
        },
      });

      if (!existingNote) {
        throw new Error('Note not found or you do not have permission to delete it');
      }

      // Delete note
      await db.policyNote.delete({
        where: {
          id: noteId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Note not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[SmartOffice] Delete note error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete note' },
      { status: 500 }
    );
  }
}
