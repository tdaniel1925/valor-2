import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const categories = await prisma.videoCategory.findMany({
      where: {
        tenantId: dbUser.tenantId,
      },
      include: {
        _count: {
          select: { videos: true },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can create categories
    if (dbUser.role !== 'ADMINISTRATOR' && dbUser.role !== 'EXECUTIVE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, slug, icon, order } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug required' },
        { status: 400 }
      );
    }

    const category = await prisma.videoCategory.create({
      data: {
        name,
        description,
        slug,
        icon,
        order: order || 0,
        tenantId: dbUser.tenantId,
      },
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
