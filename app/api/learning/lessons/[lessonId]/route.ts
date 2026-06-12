import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { extractYouTubeVideoId } from '@/lib/learning/youtube';
import { authErrorStatus } from '@/lib/learning/access';

/**
 * Lesson lookup that enforces tenant ownership via the parent course.
 * The course check must run inside withTenantContext (courses has RLS);
 * a plain `course:` relation filter would silently match nothing.
 */
async function findTenantLesson(tenantId: string, lessonId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId },
    select: { id: true, courseId: true },
  });
  if (!lesson) return null;
  const course = await withTenantContext(tenantId, (tx) =>
    tx.course.findFirst({ where: { id: lesson.courseId, tenantId }, select: { id: true } })
  );
  return course ? lesson : null;
}

/** PATCH /api/learning/lessons/[lessonId] — admin update */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { lessonId } = await params;
    const body = await request.json();

    const lesson = await findTenantLesson(admin.tenantId, lessonId);
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if ('description' in body) {
      data.description =
        typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null;
    }
    if (typeof body.videoUrl === 'string' && body.videoUrl.trim()) {
      const youtubeVideoId = extractYouTubeVideoId(body.videoUrl.trim());
      if (!youtubeVideoId) {
        return NextResponse.json({ error: 'Could not extract a YouTube video ID from that URL' }, { status: 400 });
      }
      data.videoUrl = body.videoUrl.trim();
      data.youtubeVideoId = youtubeVideoId;
    }
    if (Number.isInteger(body.durationSeconds) && body.durationSeconds > 0) {
      data.durationSeconds = body.durationSeconds;
      data.duration = Math.ceil(body.durationSeconds / 60);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.lesson.update({ where: { id: lessonId }, data });
    return NextResponse.json({ lesson: updated });
  } catch (error: unknown) {
    console.error('[LEARNING] update lesson error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update lesson';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}

/** DELETE /api/learning/lessons/[lessonId] — admin delete */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { lessonId } = await params;

    const lesson = await findTenantLesson(admin.tenantId, lessonId);
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    await prisma.lesson.delete({ where: { id: lessonId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[LEARNING] delete lesson error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete lesson';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
