'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Skeleton } from '@/components/ui';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/components/layout/AppLayout';
import { GraduationCap, Plus, Users, BookOpen, Settings2, BarChart3 } from 'lucide-react';

interface AdminCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sortOrder: number;
  grants: { id: string; granteeType: string; role: string | null; userId: string | null }[];
  _count: { lessons: number; enrollments: number };
}

function grantsSummary(grants: AdminCourse['grants']): string {
  if (grants.some((g) => g.granteeType === 'ALL')) return 'Everyone';
  const roles = grants.filter((g) => g.granteeType === 'ROLE').map((g) => g.role);
  const userCount = grants.filter((g) => g.granteeType === 'USER').length;
  const parts: string[] = [];
  if (roles.length) parts.push(roles.join(', '));
  if (userCount) parts.push(`${userCount} user${userCount === 1 ? '' : 's'}`);
  return parts.length ? parts.join(' + ') : 'No one (locked for all)';
}

export default function AdminLearningPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: '' });
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const coursesQuery = useQuery({
    queryKey: ['admin-learning-courses'],
    queryFn: async () => {
      const res = await fetch('/api/learning/courses');
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load courses');
      return (await res.json()).courses as AdminCourse[];
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['admin-learning-settings'],
    queryFn: async () => {
      const res = await fetch('/api/learning/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return (await res.json()).settings as { defaultUnlockMessage: string };
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/learning/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create course');
      return (await res.json()).course as { id: string };
    },
    onSuccess: () => {
      setShowCreate(false);
      setNewCourse({ title: '', description: '', category: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-learning-courses'] });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/learning/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultUnlockMessage: message }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save settings');
    },
    onSuccess: () => {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
      queryClient.invalidateQueries({ queryKey: ['admin-learning-settings'] });
    },
  });

  const statusBadge = (status: AdminCourse['status']) => {
    if (status === 'PUBLISHED') return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Published</Badge>;
    if (status === 'ARCHIVED') return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Archived</Badge>;
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Draft</Badge>;
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course Builder</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create courses, manage lessons and control who can take them</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/learning/reports">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" /> Reports
              </Button>
            </Link>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Course
            </Button>
          </div>
        </div>

        {showCreate && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg">New Course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Course title *"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              />
              <Textarea
                placeholder="Short description"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              />
              <Input
                placeholder="Category (e.g. Onboarding, Product Training, Compliance)"
                value={newCourse.category}
                onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
              />
              {createMutation.isError && (
                <p className="text-sm text-red-600">{(createMutation.error as Error).message}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={() => createMutation.mutate()} disabled={!newCourse.title.trim() || createMutation.isPending}>
                  {createMutation.isPending ? 'Creating…' : 'Create Course'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {coursesQuery.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        {coursesQuery.isError && (
          <Card><CardContent className="p-6 text-red-600">{(coursesQuery.error as Error).message}</CardContent></Card>
        )}
        {coursesQuery.data && coursesQuery.data.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-gray-500 dark:text-gray-400">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No courses yet. Click <strong>New Course</strong> to build your first one.
            </CardContent>
          </Card>
        )}

        <div className="space-y-3 mb-8">
          {coursesQuery.data?.map((course) => (
            <Link key={course.id} href={`/admin/learning/${course.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{course.title}</h3>
                      {statusBadge(course.status)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{course.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 shrink-0">
                    <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{course._count.lessons} lessons</span>
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{grantsSummary(course.grants)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5" /> Default Unlock Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Shown on locked courses that don&apos;t have their own custom message.
            </p>
            {settingsQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <Textarea
                value={unlockMessage ?? settingsQuery.data?.defaultUnlockMessage ?? ''}
                onChange={(e) => setUnlockMessage(e.target.value)}
                maxLength={500}
              />
            )}
            {settingsMutation.isError && (
              <p className="text-sm text-red-600">{(settingsMutation.error as Error).message}</p>
            )}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => settingsMutation.mutate(unlockMessage ?? settingsQuery.data?.defaultUnlockMessage ?? '')}
                disabled={settingsMutation.isPending || unlockMessage === null}
              >
                {settingsMutation.isPending ? 'Saving…' : 'Save Message'}
              </Button>
              {settingsSaved && <span className="text-sm text-green-600">Saved ✓</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
