import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { authErrorStatus } from '@/lib/learning/access';

const EDITABLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

/** GET /api/learning/courses/[courseId] — admin detail with lessons + grants */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { courseId } = await params;

    const course = await withTenantContext(admin.tenantId, (tx) =>
      tx.course.findFirst({
        where: { id: courseId, tenantId: admin.tenantId },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              videoUrl: true,
              youtubeVideoId: true,
              durationSeconds: true,
            },
          },
          grants: {
            select: {
              id: true,
              granteeType: true,
              role: true,
              userId: true,
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          _count: { select: { enrollments: true } },
        },
      })
    );

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error: unknown) {
    console.error('[LEARNING] get course error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load course';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}

/** PATCH /api/learning/courses/[courseId] — admin update */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { courseId } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (typeof body.description === 'string') data.description = body.description.trim();
    if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim();
    if (typeof body.thumbnail === 'string') data.thumbnail = body.thumbnail.trim() || null;
    if ('unlockMessage' in body) {
      data.unlockMessage =
        typeof body.unlockMessage === 'string' && body.unlockMessage.trim() ? body.unlockMessage.trim() : null;
    }
    if (Number.isInteger(body.sortOrder)) data.sortOrder = body.sortOrder;
    if (typeof body.status === 'string') {
      if (!EDITABLE_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      data.status = body.status;
      if (body.status === 'PUBLISHED') data.publishedAt = new Date();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const result = await withTenantContext(admin.tenantId, async (tx) => {
      const existing = await tx.course.findFirst({
        where: { id: courseId, tenantId: admin.tenantId },
        select: { id: true },
      });
      if (!existing) return null;
      return tx.course.update({ where: { id: courseId }, data });
    });

    if (!result) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course: result });
  } catch (error: unknown) {
    console.error('[LEARNING] update course error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update course';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}

/** DELETE /api/learning/courses/[courseId] — admin delete (cascades lessons/grants/enrollments) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { courseId } = await params;

    const deleted = await withTenantContext(admin.tenantId, async (tx) => {
      const existing = await tx.course.findFirst({
        where: { id: courseId, tenantId: admin.tenantId },
        select: { id: true },
      });
      if (!existing) return false;
      await tx.course.delete({ where: { id: courseId } });
      return true;
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[LEARNING] delete course error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete course';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
