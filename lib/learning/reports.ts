/**
 * Learning Center reporting — data assembly for the admin dashboard,
 * per-course completion lists, per-agent transcripts, and CSV export.
 *
 * Audience semantics: a course's audience is every ACTIVE user in the tenant
 * matched by its grants (ALL / ROLE / USER), plus anyone who already has an
 * enrollment (so completions by since-deactivated users still count).
 *
 * `courses` has tenant RLS — course queries go through withTenantContext.
 * users / enrollments / lesson_progress have no RLS and are filtered manually.
 */

import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import type { GrantLike } from '@/lib/learning/access';

export type ReportEnrollmentStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';

interface ReportUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ReportCourse {
  id: string;
  title: string;
  category: string;
  status: string;
  sortOrder: number;
  grants: GrantLike[];
  lessonCount: number;
}

interface ReportEnrollment {
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
}

interface ReportData {
  courses: ReportCourse[];
  activeUsers: ReportUser[];
  usersById: Map<string, ReportUser>;
  enrollments: ReportEnrollment[];
  /** courseId → set of userIds in the audience (grants ∪ enrollees). */
  audience: Map<string, Set<string>>;
  /** `${userId}:${courseId}` → enrollment */
  enrollmentByUserCourse: Map<string, ReportEnrollment>;
}

function matchesGrants(grants: GrantLike[], user: ReportUser): boolean {
  return grants.some(
    (g) =>
      g.granteeType === 'ALL' ||
      (g.granteeType === 'ROLE' && g.role === user.role) ||
      (g.granteeType === 'USER' && g.userId === user.id)
  );
}

async function loadReportData(tenantId: string): Promise<ReportData> {
  const [courses, activeUsers] = await Promise.all([
    withTenantContext(tenantId, (tx) =>
      tx.course.findMany({
        where: { tenantId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          sortOrder: true,
          grants: { select: { granteeType: true, role: true, userId: true } },
          _count: { select: { lessons: true } },
        },
      })
    ),
    prisma.user.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    }),
  ]);

  const courseIds = courses.map((c) => c.id);
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds }, user: { tenantId } },
    select: {
      userId: true,
      courseId: true,
      status: true,
      progress: true,
      startedAt: true,
      completedAt: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
    },
  });

  const usersById = new Map<string, ReportUser>(activeUsers.map((u) => [u.id, u]));
  for (const e of enrollments) {
    if (!usersById.has(e.user.id)) usersById.set(e.user.id, e.user);
  }

  const reportCourses: ReportCourse[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    status: c.status,
    sortOrder: c.sortOrder,
    grants: c.grants,
    lessonCount: c._count.lessons,
  }));

  const audience = new Map<string, Set<string>>();
  for (const course of reportCourses) {
    const members = new Set<string>();
    for (const user of activeUsers) {
      if (matchesGrants(course.grants, user)) members.add(user.id);
    }
    audience.set(course.id, members);
  }

  const enrollmentByUserCourse = new Map<string, ReportEnrollment>();
  for (const e of enrollments) {
    audience.get(e.courseId)?.add(e.userId);
    enrollmentByUserCourse.set(`${e.userId}:${e.courseId}`, e);
  }

  return { courses: reportCourses, activeUsers, usersById, enrollments, audience, enrollmentByUserCourse };
}

function rowStatus(enrollment: ReportEnrollment | undefined): ReportEnrollmentStatus {
  if (!enrollment) return 'NOT_STARTED';
  if (enrollment.status === 'COMPLETED' || enrollment.completedAt) return 'COMPLETED';
  return 'IN_PROGRESS';
}

// ---------------------------------------------------------------------------
// Dashboard

export interface DashboardCourseRow {
  id: string;
  title: string;
  category: string;
  status: string;
  lessonCount: number;
  audienceCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completionPct: number;
}

export interface DashboardAgentRow {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
}

export interface Dashboard {
  totals: {
    courses: number;
    publishedCourses: number;
    agents: number;
    completions: number;
    avgCompletionPct: number;
  };
  courses: DashboardCourseRow[];
  agents: DashboardAgentRow[];
}

export async function buildDashboard(tenantId: string): Promise<Dashboard> {
  const data = await loadReportData(tenantId);

  const courseRows: DashboardCourseRow[] = data.courses.map((course) => {
    const members = data.audience.get(course.id) ?? new Set<string>();
    let completed = 0;
    let inProgress = 0;
    for (const userId of members) {
      const status = rowStatus(data.enrollmentByUserCourse.get(`${userId}:${course.id}`));
      if (status === 'COMPLETED') completed += 1;
      else if (status === 'IN_PROGRESS') inProgress += 1;
    }
    const audienceCount = members.size;
    return {
      id: course.id,
      title: course.title,
      category: course.category,
      status: course.status,
      lessonCount: course.lessonCount,
      audienceCount,
      completedCount: completed,
      inProgressCount: inProgress,
      notStartedCount: audienceCount - completed - inProgress,
      completionPct: audienceCount > 0 ? Math.round((completed / audienceCount) * 100) : 0,
    };
  });

  // Agents: anyone in the audience of at least one published course, or with any enrollment.
  const published = data.courses.filter((c) => c.status === 'PUBLISHED');
  const agentIds = new Set<string>();
  for (const course of published) {
    for (const userId of data.audience.get(course.id) ?? []) agentIds.add(userId);
  }
  for (const e of data.enrollments) agentIds.add(e.userId);

  const agentRows: DashboardAgentRow[] = [...agentIds]
    .map((userId) => data.usersById.get(userId))
    .filter((u): u is ReportUser => Boolean(u))
    .map((user) => {
      let assigned = 0;
      let completed = 0;
      let inProgress = 0;
      for (const course of data.courses) {
        if (!data.audience.get(course.id)?.has(user.id)) continue;
        if (course.status !== 'PUBLISHED') continue;
        assigned += 1;
        const status = rowStatus(data.enrollmentByUserCourse.get(`${user.id}:${course.id}`));
        if (status === 'COMPLETED') completed += 1;
        else if (status === 'IN_PROGRESS') inProgress += 1;
      }
      return {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        assignedCount: assigned,
        completedCount: completed,
        inProgressCount: inProgress,
      };
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

  const publishedRows = courseRows.filter((c) => c.status === 'PUBLISHED');
  const completions = data.enrollments.filter((e) => rowStatus(e) === 'COMPLETED').length;
  const avgCompletionPct =
    publishedRows.length > 0
      ? Math.round(publishedRows.reduce((sum, c) => sum + c.completionPct, 0) / publishedRows.length)
      : 0;

  return {
    totals: {
      courses: data.courses.length,
      publishedCourses: published.length,
      agents: agentRows.length,
      completions,
      avgCompletionPct,
    },
    courses: courseRows,
    agents: agentRows,
  };
}

// ---------------------------------------------------------------------------
// Per-course completion list

export interface CourseReportRow {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: ReportEnrollmentStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CourseReport {
  course: { id: string; title: string };
  rows: CourseReportRow[];
}

export async function buildCourseReport(tenantId: string, courseId: string): Promise<CourseReport | null> {
  const data = await loadReportData(tenantId);
  const course = data.courses.find((c) => c.id === courseId);
  if (!course) return null;

  const rows: CourseReportRow[] = [...(data.audience.get(course.id) ?? [])]
    .map((userId) => data.usersById.get(userId))
    .filter((u): u is ReportUser => Boolean(u))
    .map((user) => {
      const enrollment = data.enrollmentByUserCourse.get(`${user.id}:${course.id}`);
      return {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: rowStatus(enrollment),
        progress: enrollment?.progress ?? 0,
        startedAt: enrollment?.startedAt?.toISOString() ?? null,
        completedAt: enrollment?.completedAt?.toISOString() ?? null,
      };
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

  return { course: { id: course.id, title: course.title }, rows };
}

// ---------------------------------------------------------------------------
// Per-agent transcript

export interface TranscriptLesson {
  title: string;
  order: number;
  completed: boolean;
  completedAt: string | null;
  maxWatchedSeconds: number;
  durationSeconds: number | null;
  timeSpent: number;
}

export interface TranscriptCourse {
  courseId: string;
  title: string;
  category: string;
  status: ReportEnrollmentStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  lessons: TranscriptLesson[];
}

export interface AgentTranscript {
  user: ReportUser;
  courses: TranscriptCourse[];
}

export async function buildAgentTranscript(tenantId: string, userId: string): Promise<AgentTranscript | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });
  if (!user) return null;

  const data = await loadReportData(tenantId);

  // Courses where the user is in the audience (published) or has an enrollment.
  const relevant = data.courses.filter(
    (c) =>
      data.enrollmentByUserCourse.has(`${user.id}:${c.id}`) ||
      (c.status === 'PUBLISHED' && data.audience.get(c.id)?.has(user.id))
  );

  const enrollmentsWithLessons = await prisma.enrollment.findMany({
    where: { userId: user.id, courseId: { in: relevant.map((c) => c.id) } },
    select: {
      courseId: true,
      lessonProgress: {
        select: {
          completed: true,
          completedAt: true,
          maxWatchedSeconds: true,
          timeSpent: true,
          lesson: { select: { id: true, title: true, order: true, durationSeconds: true } },
        },
      },
    },
  });
  const lessonProgressByCourse = new Map(enrollmentsWithLessons.map((e) => [e.courseId, e.lessonProgress]));

  const allLessons = await prisma.lesson.findMany({
    where: { courseId: { in: relevant.map((c) => c.id) } },
    orderBy: { order: 'asc' },
    select: { id: true, courseId: true, title: true, order: true, durationSeconds: true },
  });

  const courses: TranscriptCourse[] = relevant.map((course) => {
    const enrollment = data.enrollmentByUserCourse.get(`${user.id}:${course.id}`);
    const progressByLessonId = new Map(
      (lessonProgressByCourse.get(course.id) ?? []).map((p) => [p.lesson.id, p])
    );
    const lessons: TranscriptLesson[] = allLessons
      .filter((l) => l.courseId === course.id)
      .map((lesson) => {
        const p = progressByLessonId.get(lesson.id);
        return {
          title: lesson.title,
          order: lesson.order,
          completed: p?.completed ?? false,
          completedAt: p?.completedAt?.toISOString() ?? null,
          maxWatchedSeconds: p?.maxWatchedSeconds ?? 0,
          durationSeconds: lesson.durationSeconds,
          timeSpent: p?.timeSpent ?? 0,
        };
      });
    return {
      courseId: course.id,
      title: course.title,
      category: course.category,
      status: rowStatus(enrollment),
      progress: enrollment?.progress ?? 0,
      startedAt: enrollment?.startedAt?.toISOString() ?? null,
      completedAt: enrollment?.completedAt?.toISOString() ?? null,
      lessons,
    };
  });

  return { user, courses };
}

// ---------------------------------------------------------------------------
// CSV export

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function csvDate(date: Date | null | undefined): string {
  if (!date) return '';
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

const STATUS_LABELS: Record<ReportEnrollmentStatus, string> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  NOT_STARTED: 'Not Started',
};

/** Build the export CSV (UTF-8 BOM + CRLF + fully quoted, Excel-friendly). */
export async function buildCsv(tenantId: string, courseId?: string): Promise<{ filename: string; csv: string } | null> {
  const data = await loadReportData(tenantId);

  let courses = data.courses.filter((c) => c.status === 'PUBLISHED');
  let filenameBase = 'learning-report-all-courses';
  if (courseId) {
    const course = data.courses.find((c) => c.id === courseId);
    if (!course) return null;
    courses = [course];
    filenameBase = `learning-report-${course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'course'}`;
  }

  const header = [
    'First Name',
    'Last Name',
    'Email',
    'Role',
    'Course',
    'Category',
    'Status',
    'Progress %',
    'Started At',
    'Completed At',
  ];

  const lines = [header.map(csvField).join(',')];
  for (const course of courses) {
    const members = [...(data.audience.get(course.id) ?? [])]
      .map((userId) => data.usersById.get(userId))
      .filter((u): u is ReportUser => Boolean(u))
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
    for (const user of members) {
      const enrollment = data.enrollmentByUserCourse.get(`${user.id}:${course.id}`);
      lines.push(
        [
          user.firstName,
          user.lastName,
          user.email,
          user.role,
          course.title,
          course.category,
          STATUS_LABELS[rowStatus(enrollment)],
          String(enrollment?.progress ?? 0),
          csvDate(enrollment?.startedAt),
          csvDate(enrollment?.completedAt),
        ]
          .map(csvField)
          .join(',')
      );
    }
  }

  return { filename: `${filenameBase}.csv`, csv: '\uFEFF' + lines.join('\r\n') + '\r\n' };
}
