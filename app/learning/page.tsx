'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Badge, Skeleton } from '@/components/ui';
import AppLayout from '@/components/layout/AppLayout';
import { GraduationCap, Lock, PlayCircle, CheckCircle2, BookOpen, Clock } from 'lucide-react';

interface CatalogCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  category: string;
  lessonCount: number;
  totalDurationSeconds: number;
  locked: boolean;
  unlockMessage: string | null;
  completedLessons: number;
  progressPct: number;
  completed: boolean;
}

function formatTotal(seconds: number): string {
  if (!seconds) return '';
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function LearningCenterPage() {
  const catalogQuery = useQuery({
    queryKey: ['learning-catalog'],
    queryFn: async () => {
      const res = await fetch('/api/learning/catalog');
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load courses');
      return (await res.json()).courses as CatalogCourse[];
    },
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Learning Center</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Training courses for onboarding, products and compliance</p>
          </div>
        </div>

        {catalogQuery.isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        )}
        {catalogQuery.isError && (
          <Card><CardContent className="p-6 text-red-600">{(catalogQuery.error as Error).message}</CardContent></Card>
        )}
        {catalogQuery.data && catalogQuery.data.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-gray-500 dark:text-gray-400">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No courses are available yet. Check back soon.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalogQuery.data?.map((course) =>
            course.locked ? (
              <Card key={course.id} className="opacity-60 grayscale select-none" aria-disabled="true">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-gray-400 shrink-0" />
                    <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">{course.category}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{course.description}</p>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">{course.unlockMessage}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Link key={course.id} href={`/learning/${course.id}`} className="block group">
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{course.category}</Badge>
                      {course.completed && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Completed
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600">{course.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{course.description}</p>
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{course.lessonCount} lessons</span>
                        {course.totalDurationSeconds > 0 && (
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTotal(course.totalDurationSeconds)}</span>
                        )}
                      </div>
                      {course.progressPct > 0 && !course.completed && (
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${course.progressPct}%` }} />
                        </div>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600">
                        <PlayCircle className="h-4 w-4" />
                        {course.completed ? 'Review course' : course.progressPct > 0 ? 'Continue' : 'Start course'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          )}
        </div>
      </div>
    </AppLayout>
  );
}
