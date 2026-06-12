import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { extractYouTubeVideoId } from '@/lib/learning/youtube';
import { authErrorStatus } from '@/lib/learning/access';

async function assertCourseInTenant(tenantId: string, courseId: string): Promise<boolean> {
  const course = await withTenantContext(tenantId, (tx) =>
    tx.course.findFirst({ where: { id: courseId, tenantId }, select: { id: true } })
  );
  return Boolean(course);
}

/** POST /api/learning/courses/[courseId]/lessons — admin add a video lesson */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { courseId } = await params;
    const body = await request.json();

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const videoUrl = typeof body.videoUrl === 'string' ? body.videoUrl.trim() : '';
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!videoUrl) return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });

    const youtubeVideoId = extractYouTubeVideoId(videoUrl);
    if (!youtubeVideoId) {
      return NextResponse.json({ error: 'Could not extract a YouTube video ID from that URL' }, { status: 400 });
    }

    const durationSeconds =
      Number.isInteger(body.durationSeconds) && body.durationSeconds > 0 ? body.durationSeconds : null;

    if (!(await assertCourseInTenant(admin.tenantId, courseId))) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // lessons table has no RLS — plain client is fine once course ownership is verified
    const maxOrder = await prisma.lesson.aggregate({
      where: { courseId },
      _max: { order: true },
    });

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        description: typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null,
        type: 'VIDEO',
        order: (maxOrder._max.order ?? 0) + 1,
        videoUrl,
        youtubeVideoId,
        durationSeconds,
        duration: durationSeconds ? Math.ceil(durationSeconds / 60) : null,
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error: unknown) {
    console.error('[LEARNING] create lesson error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create lesson';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}

/** PATCH /api/learning/courses/[courseId]/lessons — admin reorder: { order: [{ id, order }] } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { courseId } = await params;
    const body = await request.json();

    if (!Array.isArray(body.order) || body.order.length === 0) {
      return NextResponse.json({ error: 'order array is required' }, { status: 400 });
    }
    for (const item of body.order) {
      if (typeof item?.id !== 'string' || !Number.isInteger(item?.order)) {
        return NextResponse.json({ error: 'Each order item needs { id, order }' }, { status: 400 });
      }
    }

    if (!(await assertCourseInTenant(admin.tenantId, courseId))) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    await prisma.$transaction(
      body.order.map((item: { id: string; order: number }) =>
        prisma.lesson.updateMany({
          where: { id: item.id, courseId },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[LEARNING] reorder lessons error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reorder lessons';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
