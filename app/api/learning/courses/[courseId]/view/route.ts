import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import {
  requireDbUser,
  hasCourseAccess,
  resolveUnlockMessage,
  getTenantDefaultUnlockMessage,
  authErrorStatus,
} from '@/lib/learning/access';

/**
 * GET /api/learning/courses/[courseId]/view — agent view of one course.
 * Lessons are sequential: lesson N is locked until lesson N-1 is completed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await requireDbUser(request);
    const { courseId } = await params;

    const course = await withTenantContext(user.tenantId, (tx) =>
      tx.course.findFirst({
        where: { id: courseId, tenantId: user.tenantId, status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          category: true,
          unlockMessage: true,
          grants: { select: { granteeType: true, role: true, userId: true } },
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              youtubeVideoId: true,
              durationSeconds: true,
            },
          },
        },
      })
    );

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (!hasCourseAccess(course.grants, user)) {
      const tenantDefault = await getTenantDefaultUnlockMessage(user.tenantId);
      return NextResponse.json(
        { error: 'locked', unlockMessage: resolveUnlockMessage(course.unlockMessage, tenantDefault) },
        { status: 403 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: {
        status: true,
        progress: true,
        completedAt: true,
        lessonProgress: { select: { lessonId: true, completed: true, maxWatchedSeconds: true } },
      },
    });
    const progressByLesson = new Map(enrollment?.lessonProgress.map((p) => [p.lessonId, p]) ?? []);

    let previousCompleted = true; // first lesson always unlocked
    const lessons = course.lessons.map((lesson) => {
      const progress = progressByLesson.get(lesson.id);
      const completed = progress?.completed ?? false;
      const locked = !previousCompleted;
      previousCompleted = completed;
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        youtubeVideoId: locked ? null : lesson.youtubeVideoId, // don't leak video IDs for locked lessons
        durationSeconds: lesson.durationSeconds,
        locked,
        completed,
        maxWatchedSeconds: progress?.maxWatchedSeconds ?? 0,
      };
    });

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        completed: enrollment?.status === 'COMPLETED',
        progressPct: enrollment?.progress ?? 0,
        lessons,
      },
    });
  } catch (error: unknown) {
    console.error('[LEARNING] course view error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load course';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
