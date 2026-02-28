import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-context';
import { getTenantContext } from '@/lib/tenant-context';

// PUT - Update saved filter
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const { id } = await context.params;
    const { name, filters, isDefault } = await request.json();

    // Check ownership
    const existingFilter = await db.savedFilter.findFirst({
      where: {
        id,
        tenantId: tenantContext.tenantId,
        userId: user.id,
      },
    });

    if (!existingFilter) {
      return NextResponse.json(
        { success: false, error: 'Filter not found or access denied' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingFilter.isDefault) {
      await db.savedFilter.updateMany({
        where: {
          tenantId: tenantContext.tenantId,
          userId: user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const updatedFilter = await db.savedFilter.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(filters && { filters }),
        ...(typeof isDefault === 'boolean' && { isDefault }),
      },
    });

    return NextResponse.json({ success: true, data: updatedFilter });
  } catch (error: any) {
    console.error('Error updating saved filter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update saved filter' },
      { status: 500 }
    );
  }
}

// DELETE - Delete saved filter
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const { id } = await context.params;

    // Check ownership
    const existingFilter = await db.savedFilter.findFirst({
      where: {
        id,
        tenantId: tenantContext.tenantId,
        userId: user.id,
      },
    });

    if (!existingFilter) {
      return NextResponse.json(
        { success: false, error: 'Filter not found or access denied' },
        { status: 404 }
      );
    }

    await db.savedFilter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting saved filter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete saved filter' },
      { status: 500 }
    );
  }
}
