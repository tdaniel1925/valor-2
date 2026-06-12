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
 * GET /api/learning/catalog — every PUBLISHED course for the agent's tenant.
 * Locked courses are included (greyed out client-side) with their unlock message.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireDbUser(request);

    const [courses, tenantDefault] = await Promise.all([
      withTenantContext(user.tenantId, (tx) =>
        tx.course.findMany({
          where: { tenantId: user.tenantId, status: 'PUBLISHED' },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            category: true,
            unlockMessage: true,
            grants: { select: { granteeType: true, role: true, userId: true } },
            lessons: { select: { id: true, durationSeconds: true } },
          },
        })
      ),
      getTenantDefaultUnlockMessage(user.tenantId),
    ]);

    // Per-user completion state (enrollments + lesson progress), one query
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id, courseId: { in: courses.map((c) => c.id) } },
      select: {
        courseId: true,
        status: true,
        progress: true,
        completedAt: true,
        lessonProgress: { where: { completed: true }, select: { lessonId: true } },
      },
    });
    const enrollmentByCourse = new Map(enrollments.map((e) => [e.courseId, e]));

    const catalog = courses.map((course) => {
      const accessible = hasCourseAccess(course.grants, user);
      const enrollment = enrollmentByCourse.get(course.id);
      const lessonCount = course.lessons.length;
      const completedLessons = enrollment?.lessonProgress.length ?? 0;
      const totalDurationSeconds = course.lessons.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0);

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        lessonCount,
        totalDurationSeconds,
        locked: !accessible,
        unlockMessage: accessible ? null : resolveUnlockMessage(course.unlockMessage, tenantDefault),
        completedLessons,
        progressPct: lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0,
        completed: enrollment?.status === 'COMPLETED',
      };
    });

    return NextResponse.json({ courses: catalog });
  } catch (error: unknown) {
    console.error('[LEARNING] catalog error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load catalog';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
