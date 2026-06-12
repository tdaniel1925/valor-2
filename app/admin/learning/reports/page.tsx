'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent, Badge, Skeleton } from '@/components/ui';
import AppLayout from '@/components/layout/AppLayout';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  GraduationCap,
  Users,
  X,
} from 'lucide-react';

type ReportStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';

interface DashboardCourseRow {
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

interface DashboardAgentRow {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
}

interface Dashboard {
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

interface CourseReportRow {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: ReportStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface CourseReport {
  course: { id: string; title: string };
  rows: CourseReportRow[];
}

interface TranscriptLesson {
  title: string;
  order: number;
  completed: boolean;
  completedAt: string | null;
  maxWatchedSeconds: number;
  durationSeconds: number | null;
  timeSpent: number;
}

interface TranscriptCourse {
  courseId: string;
  title: string;
  category: string;
  status: ReportStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  lessons: TranscriptLesson[];
}

interface AgentTranscript {
  user: { id: string; firstName: string; lastName: string; email: string; role: string };
  courses: TranscriptCourse[];
}

const STATUS_BADGES: Record<ReportStatus, { label: string; className: string }> = {
  COMPLETED: { label: 'Completed', className: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  NOT_STARTED: { label: 'Not Started', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatMinutes(seconds: number): string {
  if (seconds <= 0) return '—';
  const m = Math.round(seconds / 60);
  return m < 1 ? '<1 min' : `${m} min`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json as T;
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const badge = STATUS_BADGES[status];
  return <Badge className={badge.className}>{badge.label}</Badge>;
}

function CourseDrilldown({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const query = useQuery({
    queryKey: ['learning-report-course', courseId],
    queryFn: () => fetchJson<CourseReport>(`/api/learning/reports?courseId=${courseId}`),
  });

  return (
    <Card className="mt-4 border-blue-200 dark:border-blue-900">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {query.data ? `Completion: ${query.data.course.title}` : 'Completion list'}
          </h3>
          <div className="flex items-center gap-2">
            <a href={`/api/learning/reports/export?courseId=${courseId}`}>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </a>
            <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close completion list">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {query.isLoading && <Skeleton className="h-32 w-full" />}
        {query.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">{(query.error as Error).message}</p>
        )}
        {query.data && query.data.rows.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No one is in this course&apos;s audience yet — add a grant first.</p>
        )}
        {query.data && query.data.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="py-2 pr-4 font-medium">Agent</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Progress</th>
                  <th className="py-2 pr-4 font-medium">Started</th>
                  <th className="py-2 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {query.data.rows.map((row) => (
                  <tr key={row.userId} className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="py-2 pr-4">
                      <p className="text-gray-900 dark:text-gray-100">{row.firstName} {row.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
                    </td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{row.role}</td>
                    <td className="py-2 pr-4"><StatusBadge status={row.status} /></td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{row.progress}%</td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{formatDate(row.startedAt)}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-300">{formatDate(row.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgentDrilldown({ userId, onClose }: { userId: string; onClose: () => void }) {
  const query = useQuery({
    queryKey: ['learning-report-agent', userId],
    queryFn: () => fetchJson<AgentTranscript>(`/api/learning/reports?userId=${userId}`),
  });

  return (
    <Card className="mt-4 border-blue-200 dark:border-blue-900">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {query.data
              ? `Transcript: ${query.data.user.firstName} ${query.data.user.lastName}`
              : 'Agent transcript'}
          </h3>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close transcript">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {query.isLoading && <Skeleton className="h-32 w-full" />}
        {query.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">{(query.error as Error).message}</p>
        )}
        {query.data && query.data.courses.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No courses assigned to this agent yet.</p>
        )}
        {query.data &&
          query.data.courses.map((course) => (
            <div key={course.courseId} className="mb-4 last:mb-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{course.title}</p>
                <StatusBadge status={course.status} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {course.progress}% · started {formatDate(course.startedAt)}
                  {course.completedAt ? ` · completed ${formatDate(course.completedAt)}` : ''}
                </span>
              </div>
              {course.lessons.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 ml-1">No lessons in this course.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                        <th className="py-1.5 pr-4 font-medium">Lesson</th>
                        <th className="py-1.5 pr-4 font-medium">Done</th>
                        <th className="py-1.5 pr-4 font-medium">Completed</th>
                        <th className="py-1.5 font-medium">Watch time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.lessons.map((lesson) => (
                        <tr key={`${course.courseId}-${lesson.order}`} className="border-b border-gray-50 dark:border-gray-800/50">
                          <td className="py-1.5 pr-4 text-gray-900 dark:text-gray-100">
                            {lesson.order}. {lesson.title}
                          </td>
                          <td className="py-1.5 pr-4">
                            {lesson.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-300">{formatDate(lesson.completedAt)}</td>
                          <td className="py-1.5 text-gray-600 dark:text-gray-300">{formatMinutes(lesson.timeSpent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

export default function LearningReportsPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ['learning-report-dashboard'],
    queryFn: () => fetchJson<Dashboard>('/api/learning/reports'),
  });

  const totals = dashboardQuery.data?.totals;
  const statCards = [
    { label: 'Published Courses', value: totals?.publishedCourses, icon: BookOpen },
    { label: 'Agents', value: totals?.agents, icon: Users },
    { label: 'Completions', value: totals?.completions, icon: GraduationCap },
    { label: 'Avg Completion', value: totals != null ? `${totals.avgCompletionPct}%` : undefined, icon: BarChart3 },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        <Link
          href="/admin/learning"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Course Builder
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Training Reports</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Completion tracking across all Learning Center courses</p>
          </div>
          <a href="/api/learning/reports/export">
            <Button>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </a>
        </div>

        {dashboardQuery.isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <Skeleton key={s.label} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {dashboardQuery.isError && (
          <Card>
            <CardContent className="p-8 text-center text-red-600 dark:text-red-400">
              {(dashboardQuery.error as Error).message}
            </CardContent>
          </Card>
        )}

        {dashboardQuery.data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map(({ label, value, icon: Icon }) => (
                <Card key={label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/40 p-2">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Courses</h2>
            {dashboardQuery.data.courses.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No courses yet — create one in the Course Builder.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                        <th className="py-2 pr-4 font-medium">Course</th>
                        <th className="py-2 pr-4 font-medium">Lessons</th>
                        <th className="py-2 pr-4 font-medium">Audience</th>
                        <th className="py-2 pr-4 font-medium">Done</th>
                        <th className="py-2 pr-4 font-medium">In Progress</th>
                        <th className="py-2 pr-4 font-medium">Not Started</th>
                        <th className="py-2 font-medium">Completion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardQuery.data.courses.map((course) => (
                        <tr
                          key={course.id}
                          className="border-b border-gray-50 dark:border-gray-800/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                          onClick={() => {
                            setSelectedUserId(null);
                            setSelectedCourseId((prev) => (prev === course.id ? null : course.id));
                          }}
                        >
                          <td className="py-2 pr-4">
                            <p className="text-gray-900 dark:text-gray-100">{course.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {course.category}{course.status !== 'PUBLISHED' ? ` · ${course.status.toLowerCase()}` : ''}
                            </p>
                          </td>
                          <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{course.lessonCount}</td>
                          <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{course.audienceCount}</td>
                          <td className="py-2 pr-4 text-green-600 dark:text-green-400">{course.completedCount}</td>
                          <td className="py-2 pr-4 text-blue-600 dark:text-blue-400">{course.inProgressCount}</td>
                          <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{course.notStartedCount}</td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${course.completionPct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{course.completionPct}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
            {selectedCourseId && (
              <CourseDrilldown courseId={selectedCourseId} onClose={() => setSelectedCourseId(null)} />
            )}

            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-2">Agents</h2>
            {dashboardQuery.data.agents.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No agents in any course audience yet — add grants to your courses.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                        <th className="py-2 pr-4 font-medium">Agent</th>
                        <th className="py-2 pr-4 font-medium">Role</th>
                        <th className="py-2 pr-4 font-medium">Assigned</th>
                        <th className="py-2 pr-4 font-medium">Completed</th>
                        <th className="py-2 font-medium">In Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardQuery.data.agents.map((agent) => (
                        <tr
                          key={agent.userId}
                          className="border-b border-gray-50 dark:border-gray-800/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                          onClick={() => {
                            setSelectedCourseId(null);
                            setSelectedUserId((prev) => (prev === agent.userId ? null : agent.userId));
                          }}
                        >
                          <td className="py-2 pr-4">
                            <p className="text-gray-900 dark:text-gray-100">{agent.firstName} {agent.lastName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{agent.email}</p>
                          </td>
                          <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{agent.role}</td>
                          <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{agent.assignedCount}</td>
                          <td className="py-2 pr-4 text-green-600 dark:text-green-400">{agent.completedCount}</td>
                          <td className="py-2 text-blue-600 dark:text-blue-400">{agent.inProgressCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
            {selectedUserId && (
              <AgentDrilldown userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
