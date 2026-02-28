import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-context';
import { getTenantContext } from '@/lib/tenant-context';

// GET - List all saved filters for user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const savedFilters = await db.savedFilter.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        userId: user.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: savedFilters });
  } catch (error: any) {
    console.error('Error fetching saved filters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved filters' },
      { status: 500 }
    );
  }
}

// POST - Create new saved filter
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const { name, filters, isDefault } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Filter name is required' },
        { status: 400 }
      );
    }

    if (!filters || typeof filters !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Filter configuration is required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.savedFilter.updateMany({
        where: {
          tenantId: tenantContext.tenantId,
          userId: user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const savedFilter = await db.savedFilter.create({
      data: {
        name: name.trim(),
        filters,
        isDefault: isDefault || false,
        tenantId: tenantContext.tenantId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, data: savedFilter });
  } catch (error: any) {
    console.error('Error creating saved filter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create saved filter' },
      { status: 500 }
    );
  }
}
