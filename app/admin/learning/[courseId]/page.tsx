'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Skeleton } from '@/components/ui';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/layout/AppLayout';
import { useYouTubeDuration } from '@/components/learning/useYouTubeDuration';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Video, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const ROLES = ['AGENT', 'MANAGER', 'ADMINISTRATOR', 'EXECUTIVE'] as const;

interface AdminLesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoUrl: string | null;
  youtubeVideoId: string | null;
  durationSeconds: number | null;
}

interface Grant {
  id?: string;
  granteeType: 'ALL' | 'ROLE' | 'USER';
  role?: string | null;
  userId?: string | null;
  user?: { firstName: string; lastName: string; email: string } | null;
}

interface AdminCourseDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  unlockMessage: string | null;
  sortOrder: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  lessons: AdminLesson[];
  grants: Grant[];
}

interface TenantUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return 'unknown length';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AdminCourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { probeDuration } = useYouTubeDuration();

  const [fields, setFields] = useState<Partial<AdminCourseDetail> | null>(null);
  const [newLesson, setNewLesson] = useState({ title: '', videoUrl: '' });
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [grantsDraft, setGrantsDraft] = useState<Grant[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const courseQuery = useQuery({
    queryKey: ['admin-learning-course', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/learning/courses/${courseId}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load course');
      return (await res.json()).course as AdminCourseDetail;
    },
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users-for-grants'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?limit=200');
      if (!res.ok) throw new Error('Failed to load users');
      const json = await res.json();
      const data = json.data ?? json;
      return (data.users ?? data) as TenantUser[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-learning-course', courseId] });
    queryClient.invalidateQueries({ queryKey: ['admin-learning-courses'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/learning/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
    },
    onSuccess: () => {
      setFields(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/learning/courses/${courseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete');
    },
    onSuccess: () => router.push('/admin/learning'),
  });

  const grantsMutation = useMutation({
    mutationFn: async (grants: Grant[]) => {
      const res = await fetch(`/api/learning/courses/${courseId}/grants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grants }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save access');
    },
    onSuccess: () => {
      setGrantsDraft(null);
      invalidate();
    },
  });

  const handleAddLesson = async () => {
    setLessonError(null);
    setAddingLesson(true);
    try {
      // Probe duration client-side so the no-skip gate knows the video length
      const idMatch = newLesson.videoUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
      const videoId = idMatch?.[1] ?? (/^[A-Za-z0-9_-]{11}$/.test(newLesson.videoUrl.trim()) ? newLesson.videoUrl.trim() : null);
      const durationSeconds = videoId ? await probeDuration(videoId) : null;

      const res = await fetch(`/api/learning/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLesson, durationSeconds }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to add lesson');
      setNewLesson({ title: '', videoUrl: '' });
      invalidate();
    } catch (e) {
      setLessonError(e instanceof Error ? e.message : 'Failed to add lesson');
    } finally {
      setAddingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    await fetch(`/api/learning/lessons/${lessonId}`, { method: 'DELETE' });
    invalidate();
  };

  const handleMoveLesson = async (index: number, direction: -1 | 1) => {
    const lessons = courseQuery.data?.lessons ?? [];
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;
    const order = lessons.map((l, i) => ({
      id: l.id,
      order: i === index ? lessons[target].order : i === target ? lessons[index].order : l.order,
    }));
    await fetch(`/api/learning/courses/${courseId}/lessons`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
    invalidate();
  };

  if (courseQuery.isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-4xl space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <Card><CardContent className="p-6 text-red-600">{(courseQuery.error as Error)?.message || 'Course not found'}</CardContent></Card>
        </div>
      </AppLayout>
    );
  }

  const course = courseQuery.data;
  const current = { ...course, ...(fields ?? {}) };
  const grants = grantsDraft ?? course.grants;
  const isEveryone = grants.some((g) => g.granteeType === 'ALL');

  const setGrants = (next: Grant[]) => setGrantsDraft(next);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/learning" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" /> All courses
          </Link>
          <div className="flex items-center gap-2">
            <Badge className={course.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
              {course.status}
            </Badge>
            <Button
              variant={course.status === 'PUBLISHED' ? 'outline' : 'default'}
              onClick={() => saveMutation.mutate({ status: course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
              disabled={saveMutation.isPending}
            >
              {course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>

        {/* Course fields */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Course Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={current.title} onChange={(e) => setFields({ ...(fields ?? {}), title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={current.description} onChange={(e) => setFields({ ...(fields ?? {}), description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input value={current.category} onChange={(e) => setFields({ ...(fields ?? {}), category: e.target.value })} />
              </div>
              <div>
                <Label>Thumbnail URL (optional)</Label>
                <Input value={current.thumbnail ?? ''} onChange={(e) => setFields({ ...(fields ?? {}), thumbnail: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Custom unlock message (shown when this course is locked; leave blank to use the default)</Label>
              <Textarea
                value={current.unlockMessage ?? ''}
                onChange={(e) => setFields({ ...(fields ?? {}), unlockMessage: e.target.value })}
                placeholder="e.g. Finish New Agent Onboarding to unlock this course."
              />
            </div>
            {saveMutation.isError && <p className="text-sm text-red-600">{(saveMutation.error as Error).message}</p>}
            <Button
              onClick={() => fields && saveMutation.mutate(fields)}
              disabled={!fields || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Details'}
            </Button>
          </CardContent>
        </Card>

        {/* Lessons */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Lessons (watched in order, no skipping)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {course.lessons.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No lessons yet — add your first bite-size video below.</p>
            )}
            {course.lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <Video className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {index + 1}. {lesson.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDuration(lesson.durationSeconds)}
                    {!lesson.durationSeconds && (
                      <span className="text-amber-600 ml-2 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> duration unknown — completion gate weakened
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleMoveLesson(index, -1)} disabled={index === 0} aria-label="Move up">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleMoveLesson(index, 1)} disabled={index === course.lessons.length - 1} aria-label="Move down">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id)} aria-label="Delete lesson">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <Input
                placeholder="Lesson title *"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
              />
              <Input
                placeholder="YouTube URL (unlisted video) *"
                value={newLesson.videoUrl}
                onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
              />
              {lessonError && <p className="text-sm text-red-600">{lessonError}</p>}
              <Button onClick={handleAddLesson} disabled={!newLesson.title.trim() || !newLesson.videoUrl.trim() || addingLesson}>
                <Plus className="h-4 w-4 mr-2" /> {addingLesson ? 'Adding…' : 'Add Lesson'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Access */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Who can take this course</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="grant-all"
                checked={isEveryone}
                onChange={(e) =>
                  setGrants(e.target.checked ? [{ granteeType: 'ALL' }] : grants.filter((g) => g.granteeType !== 'ALL'))
                }
              />
              <Label htmlFor="grant-all">Everyone in the agency</Label>
            </div>

            {!isEveryone && (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">By role</p>
                  <div className="flex flex-wrap gap-4">
                    {ROLES.map((role) => {
                      const checked = grants.some((g) => g.granteeType === 'ROLE' && g.role === role);
                      return (
                        <div key={role} className="flex items-center gap-2">
                          <Checkbox
                            id={`role-${role}`}
                            checked={checked}
                            onChange={(e) =>
                              setGrants(
                                e.target.checked
                                  ? [...grants, { granteeType: 'ROLE', role }]
                                  : grants.filter((g) => !(g.granteeType === 'ROLE' && g.role === role))
                              )
                            }
                          />
                          <Label htmlFor={`role-${role}`} className="capitalize">{role.toLowerCase()}</Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Specific people</p>
                  {usersQuery.isLoading && <Skeleton className="h-16 w-full" />}
                  {usersQuery.isError && <p className="text-sm text-red-600">Could not load users</p>}
                  {usersQuery.data && (
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      {usersQuery.data.map((u) => {
                        const checked = grants.some((g) => g.granteeType === 'USER' && g.userId === u.id);
                        return (
                          <div key={u.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`user-${u.id}`}
                              checked={checked}
                              onChange={(e) =>
                                setGrants(
                                  e.target.checked
                                    ? [...grants, { granteeType: 'USER', userId: u.id }]
                                    : grants.filter((g) => !(g.granteeType === 'USER' && g.userId === u.id))
                                )
                              }
                            />
                            <Label htmlFor={`user-${u.id}`} className="text-sm">
                              {u.firstName} {u.lastName} <span className="text-gray-400">({u.email})</span>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {grantsMutation.isError && <p className="text-sm text-red-600">{(grantsMutation.error as Error).message}</p>}
            <Button onClick={() => grantsDraft && grantsMutation.mutate(grantsDraft)} disabled={!grantsDraft || grantsMutation.isPending}>
              {grantsMutation.isPending ? 'Saving…' : 'Save Access'}
            </Button>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-5 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Deleting removes the course, its lessons and all progress.</p>
            {confirmDelete ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete course'}
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="text-red-600 border-red-300" onClick={() => setConfirmDelete(true)}>
                Delete Course
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
