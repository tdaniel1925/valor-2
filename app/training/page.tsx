'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import {
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  Video,
  FileText,
  Users,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    title: 'Course Catalog',
    description: 'Browse comprehensive training courses for agents',
    icon: BookOpen,
    href: '/training/courses',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    features: [
      'Product training',
      'Sales techniques',
      'Compliance courses',
      'Industry best practices',
    ],
  },
  {
    title: 'My Learning',
    description: 'Track your enrolled courses and progress',
    icon: GraduationCap,
    href: '/training/my-learning',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    features: [
      'In-progress courses',
      'Completion tracking',
      'Quiz scores',
      'Learning path',
    ],
  },
  {
    title: 'Certifications',
    description: 'View and manage your earned certifications',
    icon: Award,
    href: '/training/certifications',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    features: [
      'Certificate downloads',
      'Verification codes',
      'Renewal tracking',
      'Achievement badges',
    ],
  },
  {
    title: 'Training Calendar',
    description: 'Upcoming live training sessions and webinars',
    icon: Calendar,
    href: '/training/calendar',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    features: [
      'Live sessions',
      'Webinar registration',
      'Event reminders',
      'Recording access',
    ],
  },
];

const quickStats = [
  {
    label: 'Available Courses',
    value: '45',
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Enrolled Courses',
    value: '3',
    icon: GraduationCap,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    label: 'Certifications',
    value: '2',
    icon: Award,
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    label: 'Completion Rate',
    value: '87%',
    icon: Target,
    color: 'text-orange-600 dark:text-orange-400',
  },
];

const courseCategories = [
  { name: 'Product Training', count: 12, icon: FileText },
  { name: 'Sales Skills', count: 8, icon: TrendingUp },
  { name: 'Compliance', count: 6, icon: CheckCircle2 },
  { name: 'Technology', count: 5, icon: Video },
  { name: 'Leadership', count: 7, icon: Users },
  { name: 'Industry Trends', count: 7, icon: Clock },
];

export default function TrainingPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Training & Resources</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Comprehensive learning management system for agent development
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.color.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-').replace('-600', '-50').replace('-400', '-900/30')}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Learning Center</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-gray-900 dark:text-gray-100">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {feature.features.map((item, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className={`${feature.color} mt-1`}>•</span>
                          <span className="text-gray-700 dark:text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={feature.href}>
                      <Button className="w-full">
                        Explore
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Course Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Course Categories</CardTitle>
            <CardDescription>
              Browse courses by category to find the perfect training for your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {courseCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.name}
                    href={`/training/courses?category=${encodeURIComponent(category.name)}`}
                    className="block"
                  >
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{category.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {category.count} courses
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8 bg-gray-50 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Getting Started</CardTitle>
            <CardDescription>Learn how to make the most of your training experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Our learning management system provides comprehensive training to help you succeed. Enroll in
              courses, track your progress, and earn certifications to advance your career.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Browse Courses
              </Button>
              <Button variant="outline" size="sm">
                View My Progress
              </Button>
              <Button variant="outline" size="sm">
                Get Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
