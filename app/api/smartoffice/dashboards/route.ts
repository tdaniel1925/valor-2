import { NextResponse, NextRequest } from 'next/server';
import { prisma as db } from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';

// GET - List all dashboard layouts for user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = getTenantFromRequest(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const layouts = await db.dashboardLayout.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        userId: user.id,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: layouts });
  } catch (error: any) {
    console.error('Error fetching dashboard layouts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard layouts' },
      { status: 500 }
    );
  }
}

// POST - Create new dashboard layout
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = getTenantFromRequest(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const { name, description, layout, isDefault, isShared } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Layout name is required' },
        { status: 400 }
      );
    }

    if (!layout || !Array.isArray(layout)) {
      return NextResponse.json(
        { success: false, error: 'Layout configuration is required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.dashboardLayout.updateMany({
        where: {
          tenantId: tenantContext.tenantId,
          userId: user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const dashboardLayout = await db.dashboardLayout.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        layout,
        isDefault: isDefault || false,
        isShared: isShared || false,
        tenantId: tenantContext.tenantId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, data: dashboardLayout });
  } catch (error: any) {
    console.error('Error creating dashboard layout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create dashboard layout' },
      { status: 500 }
    );
  }
}
