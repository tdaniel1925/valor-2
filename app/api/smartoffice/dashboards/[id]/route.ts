import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-context';
import { getTenantContext } from '@/lib/tenant-context';

// PUT - Update dashboard layout
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
    const { name, description, layout, isDefault, isShared } = await request.json();

    // Check ownership
    const existingLayout = await db.dashboardLayout.findFirst({
      where: {
        id,
        tenantId: tenantContext.tenantId,
        userId: user.id,
      },
    });

    if (!existingLayout) {
      return NextResponse.json(
        { success: false, error: 'Layout not found or access denied' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingLayout.isDefault) {
      await db.dashboardLayout.updateMany({
        where: {
          tenantId: tenantContext.tenantId,
          userId: user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const updatedLayout = await db.dashboardLayout.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(layout && { layout }),
        ...(typeof isDefault === 'boolean' && { isDefault }),
        ...(typeof isShared === 'boolean' && { isShared }),
      },
    });

    return NextResponse.json({ success: true, data: updatedLayout });
  } catch (error: any) {
    console.error('Error updating dashboard layout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update dashboard layout' },
      { status: 500 }
    );
  }
}

// DELETE - Delete dashboard layout
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
    const existingLayout = await db.dashboardLayout.findFirst({
      where: {
        id,
        tenantId: tenantContext.tenantId,
        userId: user.id,
      },
    });

    if (!existingLayout) {
      return NextResponse.json(
        { success: false, error: 'Layout not found or access denied' },
        { status: 404 }
      );
    }

    await db.dashboardLayout.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting dashboard layout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete dashboard layout' },
      { status: 500 }
    );
  }
}
