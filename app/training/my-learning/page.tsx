'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  CheckCircle2,
  PlayCircle,
  Target,
} from 'lucide-react';

interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  progress: number;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  enrolledAt: string;
  completedAt?: string;
  score?: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessedAt?: string;
}

export default function MyLearningPage() {
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const res = await fetch('/api/training/my-learning');
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      return res.json();
    },
  });

  const stats = {
    enrolled: enrollments?.length || 0,
    inProgress: enrollments?.filter(e => e.status === 'IN_PROGRESS').length || 0,
    completed: enrollments?.filter(e => e.status === 'COMPLETED').length || 0,
    avgProgress: enrollments && enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'IN_PROGRESS':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your learning...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Learning</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track your progress and continue your professional development
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enrolled</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stats.enrolled}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stats.inProgress}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <PlayCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stats.completed}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Progress</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stats.avgProgress}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        <div className="space-y-4">
          {enrollments?.map((enrollment) => (
            <Card key={enrollment.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{enrollment.courseCategory}</Badge>
                      <Badge className={getStatusColor(enrollment.status)}>
                        {enrollment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                      {enrollment.courseTitle}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Link href={`/training/courses/${enrollment.courseId}`}>
                    <Button>
                      {enrollment.status === 'COMPLETED' ? 'Review' : 'Continue'}
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {enrollment.progress}%
                      </span>
                    </div>
                    <Progress value={enrollment.progress} className="h-2" />
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Lessons</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {enrollment.completedLessons} / {enrollment.totalLessons}
                      </p>
                    </div>
                    {enrollment.score !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {enrollment.score}%
                        </p>
                      </div>
                    )}
                    {enrollment.lastAccessedAt && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Last Accessed</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Date(enrollment.lastAccessedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {enrollments?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No courses enrolled yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start your learning journey by enrolling in a course from our catalog.
              </p>
              <Link href="/training/courses">
                <Button>
                  Browse Courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
