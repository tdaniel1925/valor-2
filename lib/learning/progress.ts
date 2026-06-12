/**
 * Shared progress logic for the no-skip Learning Center player.
 *
 * Server-side enforcement: the client reports playback position via heartbeats,
 * but maxWatchedSeconds may only grow at roughly real-time speed. A lesson can
 * be completed only when maxWatchedSeconds reaches its duration.
 */

import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { hasCourseAccess, type LearningUser } from '@/lib/learning/access';

/** Seconds of slack on top of elapsed wall-clock time between heartbeats (network jitter, 1x speed only). */
const HEARTBEAT_SLACK_SECONDS = 15;
/** Allowed playback speed multiplier (YouTube offers up to 2x; we honor real-time + slack only). */
const MAX_PLAYBACK_RATE = 1.5;
/** A lesson counts as fully watched within this many seconds of its end. */
export const COMPLETION_TOLERANCE_SECONDS = 3;

export interface LessonContext {
  lesson: {
    id: string;
    courseId: string;
    order: number;
    durationSeconds: number | null;
  };
  enrollmentId: string;
}

export type LessonContextError = 'not_found' | 'no_access' | 'lesson_locked';

/**
 * Validate that `user` may interact with `lessonId` (tenant, grant, sequential lock),
 * creating the Enrollment on first touch. Returns a context or a typed error.
 */
export async function resolveLessonContext(
  user: LearningUser,
  lessonId: string
): Promise<LessonContext | LessonContextError> {
  // NB: never filter lessons through a `course:` relation with plain prisma —
  // the join hits the courses RLS policy without tenant context and matches nothing.
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId },
    select: { id: true, courseId: true, order: true, durationSeconds: true },
  });
  if (!lesson) return 'not_found';

  const course = await withTenantContext(user.tenantId, (tx) =>
    tx.course.findFirst({
      where: { id: lesson.courseId, tenantId: user.tenantId, status: 'PUBLISHED' },
      select: { grants: { select: { granteeType: true, role: true, userId: true } } },
    })
  );
  if (!course) return 'not_found';
  if (!hasCourseAccess(course.grants, user)) return 'no_access';

  // Sequential rule: every earlier lesson must be completed
  const earlierLessons = await prisma.lesson.findMany({
    where: { courseId: lesson.courseId, order: { lt: lesson.order } },
    select: { id: true },
  });
  let enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
    select: { id: true, lessonProgress: { where: { completed: true }, select: { lessonId: true } } },
  });

  if (earlierLessons.length > 0) {
    const completedIds = new Set(enrollment?.lessonProgress.map((p) => p.lessonId) ?? []);
    if (!earlierLessons.every((l) => completedIds.has(l.id))) return 'lesson_locked';
  }

  if (!enrollment) {
    const created = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
      update: {},
      create: {
        userId: user.id,
        courseId: lesson.courseId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      select: { id: true },
    });
    enrollment = { id: created.id, lessonProgress: [] };
  }

  return { lesson, enrollmentId: enrollment.id };
}

/**
 * Apply a heartbeat: clamp reported position to a plausible growth rate.
 * Returns the persisted maxWatchedSeconds.
 */
export async function applyHeartbeat(
  ctx: LessonContext,
  reportedPositionSeconds: number
): Promise<{ maxWatchedSeconds: number; canMarkDone: boolean }> {
  const existing = await prisma.lessonProgress.findUnique({
    where: { enrollmentId_lessonId: { enrollmentId: ctx.enrollmentId, lessonId: ctx.lesson.id } },
    select: { maxWatchedSeconds: true, updatedAt: true, startedAt: true, timeSpent: true },
  });

  const now = Date.now();
  const reported = Math.max(0, Math.floor(reportedPositionSeconds));
  const duration = ctx.lesson.durationSeconds;

  let newMax: number;
  if (!existing) {
    // First heartbeat: nothing has been watched yet — allow only a small head start
    newMax = Math.min(reported, HEARTBEAT_SLACK_SECONDS);
  } else {
    const elapsedSeconds = Math.max(0, (now - existing.updatedAt.getTime()) / 1000);
    const allowedGrowth = elapsedSeconds * MAX_PLAYBACK_RATE + HEARTBEAT_SLACK_SECONDS;
    newMax = Math.min(reported, existing.maxWatchedSeconds + Math.floor(allowedGrowth));
    newMax = Math.max(newMax, existing.maxWatchedSeconds); // never regress
  }
  if (duration) newMax = Math.min(newMax, duration);

  const heartbeatGap = existing ? Math.min(60, Math.round((now - existing.updatedAt.getTime()) / 1000)) : 0;

  const saved = await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: ctx.enrollmentId, lessonId: ctx.lesson.id } },
    update: { maxWatchedSeconds: newMax, timeSpent: (existing?.timeSpent ?? 0) + heartbeatGap },
    create: {
      enrollmentId: ctx.enrollmentId,
      lessonId: ctx.lesson.id,
      maxWatchedSeconds: newMax,
      attempts: 1,
      timeSpent: 0,
    },
    select: { maxWatchedSeconds: true },
  });

  return {
    maxWatchedSeconds: saved.maxWatchedSeconds,
    canMarkDone: canCompleteLesson(saved.maxWatchedSeconds, duration),
  };
}

export function canCompleteLesson(maxWatchedSeconds: number, durationSeconds: number | null): boolean {
  if (!durationSeconds) return maxWatchedSeconds > 0; // no duration on record — require at least one heartbeat
  return maxWatchedSeconds >= durationSeconds - COMPLETION_TOLERANCE_SECONDS;
}

/** Mark a lesson complete (caller must have verified canCompleteLesson) and roll up course progress. */
export async function completeLesson(ctx: LessonContext, userId: string): Promise<{ courseCompleted: boolean; progressPct: number }> {
  await prisma.lessonProgress.update({
    where: { enrollmentId_lessonId: { enrollmentId: ctx.enrollmentId, lessonId: ctx.lesson.id } },
    data: { completed: true, completedAt: new Date() },
  });

  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { courseId: ctx.lesson.courseId } }),
    prisma.lessonProgress.count({ where: { enrollmentId: ctx.enrollmentId, completed: true } }),
  ]);

  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const courseCompleted = totalLessons > 0 && completedLessons >= totalLessons;

  await prisma.enrollment.update({
    where: { id: ctx.enrollmentId },
    data: {
      progress: progressPct,
      status: courseCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      ...(courseCompleted ? { completedAt: new Date() } : {}),
    },
  });

  return { courseCompleted, progressPct };
}
