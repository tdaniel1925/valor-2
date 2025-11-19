'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  Award,
  Search,
  Filter,
  Star,
  Users,
  Video,
  FileText,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category: string;
  duration: number;
  instructorName: string;
  enrollmentCount: number;
  rating: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses', searchQuery, selectedCategory, selectedLevel],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLevel) params.append('level', selectedLevel);

      const res = await fetch(`/api/training/courses?${params}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
  });

  const categories = [
    'All Categories',
    'Product Training',
    'Sales Skills',
    'Compliance',
    'Technology',
    'Leadership',
    'Industry Trends',
  ];

  const levels = ['All Levels', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'INTERMEDIATE':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'ADVANCED':
        return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
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
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Course Catalog</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Browse and enroll in professional development courses
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value === 'All Levels' ? '' : e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {courses?.length || 0} courses
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-all">
              <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white opacity-50" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge className={getLevelColor(course.level)}>
                    {course.level}
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="mb-2">
                    {course.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {course.rating}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                  {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.enrollmentCount}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Instructor: {course.instructorName}</p>
                </div>

                <Link href={`/training/courses/${course.id}`}>
                  <Button className="w-full">
                    View Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {courses?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No courses found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedLevel('');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
