import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { authErrorStatus } from '@/lib/learning/access';

/** GET /api/learning/courses — admin list with stats */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const courses = await withTenantContext(admin.tenantId, (tx) =>
      tx.course.findMany({
        where: { tenantId: admin.tenantId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          category: true,
          status: true,
          unlockMessage: true,
          sortOrder: true,
          createdAt: true,
          publishedAt: true,
          grants: { select: { id: true, granteeType: true, role: true, userId: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
      })
    );

    return NextResponse.json({ courses });
  } catch (error: unknown) {
    console.error('[LEARNING] list courses error:', error);
    const message = error instanceof Error ? error.message : 'Failed to list courses';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}

/** POST /api/learning/courses — admin create (starts as DRAFT) */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const course = await withTenantContext(admin.tenantId, (tx) =>
      tx.course.create({
        data: {
          tenantId: admin.tenantId,
          title,
          description: typeof body.description === 'string' ? body.description.trim() : '',
          category: typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'General',
          thumbnail: typeof body.thumbnail === 'string' && body.thumbnail.trim() ? body.thumbnail.trim() : null,
          unlockMessage:
            typeof body.unlockMessage === 'string' && body.unlockMessage.trim() ? body.unlockMessage.trim() : null,
          sortOrder: Number.isInteger(body.sortOrder) ? body.sortOrder : 0,
          instructorId: admin.id,
          status: 'DRAFT',
        },
      })
    );

    return NextResponse.json({ course }, { status: 201 });
  } catch (error: unknown) {
    console.error('[LEARNING] create course error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create course';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
