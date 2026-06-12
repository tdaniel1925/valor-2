'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Badge, Skeleton } from '@/components/ui';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Lock, PlayCircle, CheckCircle2, Clock } from 'lucide-react';

interface ViewLesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  youtubeVideoId: string | null;
  durationSeconds: number | null;
  locked: boolean;
  completed: boolean;
  maxWatchedSeconds: number;
}

interface CourseView {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  progressPct: number;
  lessons: ViewLesson[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);

  const courseQuery = useQuery({
    queryKey: ['learning-course', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/learning/courses/${courseId}/view`);
      const json = await res.json();
      if (res.status === 403 && json.error === 'locked') {
        throw new Error(json.unlockMessage || 'This course is locked.');
      }
      if (!res.ok) throw new Error(json.error || 'Failed to load course');
      return json.course as CourseView;
    },
    retry: false,
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-3xl">
        <Link href="/learning" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 mb-5">
          <ArrowLeft className="h-4 w-4" /> Learning Center
        </Link>

        {courseQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {courseQuery.isError && (
          <Card>
            <CardContent className="p-8 text-center">
              <Lock className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300">{(courseQuery.error as Error).message}</p>
            </CardContent>
          </Card>
        )}

        {courseQuery.data && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{courseQuery.data.category}</Badge>
                {courseQuery.data.completed && (
                  <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Completed
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{courseQuery.data.title}</h1>
              <p className="text-gray-500 dark:text-gray-400">{courseQuery.data.description}</p>
              {courseQuery.data.progressPct > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${courseQuery.data.progressPct}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{courseQuery.data.progressPct}%</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {courseQuery.data.lessons.length === 0 && (
                <Card><CardContent className="p-6 text-center text-gray-500">No lessons in this course yet.</CardContent></Card>
              )}
              {courseQuery.data.lessons.map((lesson, index) => {
                const inner = (
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="shrink-0">
                      {lesson.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : lesson.locked ? (
                        <Lock className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                      ) : (
                        <PlayCircle className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium text-sm truncate ${lesson.locked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {index + 1}. {lesson.title}
                      </p>
                      {lesson.description && !lesson.locked && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lesson.description}</p>
                      )}
                      {lesson.locked && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Complete the previous lesson to unlock</p>
                      )}
                    </div>
                    {lesson.durationSeconds ? (
                      <span className={`text-xs flex items-center gap-1 shrink-0 ${lesson.locked ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Clock className="h-3.5 w-3.5" /> {formatDuration(lesson.durationSeconds)}
                      </span>
                    ) : null}
                  </CardContent>
                );

                return lesson.locked ? (
                  <Card key={lesson.id} className="opacity-70 select-none">{inner}</Card>
                ) : (
                  <Link key={lesson.id} href={`/learning/${courseId}/${lesson.id}`} className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">{inner}</Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
