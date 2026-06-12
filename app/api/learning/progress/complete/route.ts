import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireDbUser, authErrorStatus } from '@/lib/learning/access';
import { resolveLessonContext, canCompleteLesson, completeLesson } from '@/lib/learning/progress';

/**
 * POST /api/learning/progress/complete — "Mark Done".
 * Only succeeds when the server-tracked maxWatchedSeconds covers the full video.
 * Body: { lessonId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireDbUser(request);
    const body = await request.json();

    const lessonId = typeof body.lessonId === 'string' ? body.lessonId : '';
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
    }

    const ctx = await resolveLessonContext(user, lessonId);
    if (ctx === 'not_found') return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    if (ctx === 'no_access') return NextResponse.json({ error: 'You do not have access to this course' }, { status: 403 });
    if (ctx === 'lesson_locked') {
      return NextResponse.json({ error: 'Complete the previous lesson first' }, { status: 403 });
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: ctx.enrollmentId, lessonId: ctx.lesson.id } },
      select: { maxWatchedSeconds: true, completed: true },
    });

    if (progress?.completed) {
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }

    if (!progress || !canCompleteLesson(progress.maxWatchedSeconds, ctx.lesson.durationSeconds)) {
      return NextResponse.json(
        { error: 'Watch the full video to mark this lesson done' },
        { status: 400 }
      );
    }

    const result = await completeLesson(ctx, user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error('[LEARNING] complete lesson error:', error);
    const message = error instanceof Error ? error.message : 'Failed to complete lesson';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
