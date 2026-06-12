'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Skeleton } from '@/components/ui';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, VideoOff } from 'lucide-react';
import NoSkipPlayer, { type HeartbeatResult } from '@/components/learning/NoSkipPlayer';

/** Mirrors COMPLETION_TOLERANCE_SECONDS in lib/learning/progress.ts (server-only module — imports prisma). */
const COMPLETION_TOLERANCE_SECONDS = 3;

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

function initialCanMarkDone(lesson: ViewLesson): boolean {
  if (lesson.completed) return true;
  if (!lesson.durationSeconds) return lesson.maxWatchedSeconds > 0;
  return lesson.maxWatchedSeconds >= lesson.durationSeconds - COMPLETION_TOLERANCE_SECONDS;
}

function LessonContent({ courseId, lesson, nextLesson }: { courseId: string; lesson: ViewLesson; nextLesson: ViewLesson | null }) {
  const queryClient = useQueryClient();
  const [canMarkDone, setCanMarkDone] = useState(() => initialCanMarkDone(lesson));
  const [justCompleted, setJustCompleted] = useState(false);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/learning/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to mark lesson done');
      return json as { success: boolean; courseCompleted?: boolean };
    },
    onSuccess: () => {
      setJustCompleted(true);
      void queryClient.invalidateQueries({ queryKey: ['learning-course', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['learning-catalog'] });
    },
  });

  const isCompleted = lesson.completed || justCompleted;

  const onHeartbeat = (result: HeartbeatResult) => {
    if (result.canMarkDone) setCanMarkDone(true);
  };

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{lesson.title}</h1>
        {lesson.description && <p className="text-gray-500 dark:text-gray-400">{lesson.description}</p>}
      </div>

      {isCompleted && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Lesson completed
        </div>
      )}

      {lesson.youtubeVideoId ? (
        <NoSkipPlayer
          videoId={lesson.youtubeVideoId}
          lessonId={lesson.id}
          initialMaxWatchedSeconds={lesson.maxWatchedSeconds}
          durationSeconds={lesson.durationSeconds}
          completed={isCompleted}
          onHeartbeat={onHeartbeat}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <VideoOff className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">This lesson has no video yet. Check back later.</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {!isCompleted && (
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={!canMarkDone || completeMutation.isPending}
            className="sm:min-w-44"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {completeMutation.isPending ? 'Saving…' : 'Mark Done'}
          </Button>
        )}
        {isCompleted && nextLesson && (
          <Link href={`/learning/${courseId}/${nextLesson.id}`}>
            <Button className="w-full sm:w-auto sm:min-w-44">
              Next lesson: {nextLesson.title} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
        {isCompleted && !nextLesson && (
          <Link href={`/learning/${courseId}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              Back to course <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
        {!isCompleted && !canMarkDone && (
          <p className="text-sm text-gray-500 dark:text-gray-400 self-center">
            Watch the full video to unlock Mark Done.
          </p>
        )}
      </div>

      {completeMutation.isError && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{(completeMutation.error as Error).message}</p>
      )}
    </>
  );
}

export default function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = use(params);

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

  const lesson = courseQuery.data?.lessons.find((l) => l.id === lessonId) ?? null;
  const nextLesson = lesson
    ? courseQuery.data?.lessons
        .filter((l) => l.order > lesson.order)
        .sort((a, b) => a.order - b.order)[0] ?? null
    : null;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-3xl">
        <Link
          href={`/learning/${courseId}`}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> {courseQuery.data?.title ?? 'Back to course'}
        </Link>

        {courseQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-10 w-44" />
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

        {courseQuery.data && !lesson && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
              Lesson not found in this course.
            </CardContent>
          </Card>
        )}

        {courseQuery.data && lesson?.locked && (
          <Card>
            <CardContent className="p-8 text-center">
              <Lock className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300">Complete the previous lesson to unlock this one.</p>
            </CardContent>
          </Card>
        )}

        {courseQuery.data && lesson && !lesson.locked && (
          <LessonContent key={lesson.id} courseId={courseId} lesson={lesson} nextLesson={nextLesson} />
        )}
      </div>
    </AppLayout>
  );
}
