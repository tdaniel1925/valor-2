'use client';

import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  ArrowRight,
  User,
  FileText,
  DollarSign,
  BarChart3,
  GraduationCap,
  PlayCircle,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

const quickStartSteps = [
  {
    number: 1,
    title: 'Complete Your Profile',
    description: 'Set up your agent profile with contact information and licensing details',
    icon: User,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    tasks: [
      'Add your profile photo',
      'Enter your licensing information',
      'Set your contact preferences',
      'Configure notification settings',
    ],
    link: '/profile',
    estimatedTime: '5 minutes',
  },
  {
    number: 2,
    title: 'Create Your First Quote',
    description: 'Learn how to generate insurance quotes for your clients',
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    tasks: [
      'Navigate to the Quotes section',
      'Choose product type (Life, Term, or Annuity)',
      'Enter client information',
      'Review and send quote to client',
    ],
    link: '/quotes',
    estimatedTime: '10 minutes',
  },
  {
    number: 3,
    title: 'Submit an Application',
    description: 'Convert quotes into applications and submit for underwriting',
    icon: FileText,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    tasks: [
      'Select a quote to convert',
      'Complete application form',
      'Upload required documents',
      'Submit for carrier review',
    ],
    link: '/applications/life/new',
    estimatedTime: '15 minutes',
  },
  {
    number: 4,
    title: 'Track Commissions',
    description: 'Monitor your earnings and payment schedule',
    icon: DollarSign,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    tasks: [
      'View pending commissions',
      'Check payment history',
      'Download commission statements',
      'Set up direct deposit',
    ],
    link: '/commissions',
    estimatedTime: '5 minutes',
  },
  {
    number: 5,
    title: 'Explore Reports',
    description: 'Access analytics and performance reports',
    icon: BarChart3,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
    tasks: [
      'Review your production reports',
      'Check commission forecasts',
      'Analyze performance metrics',
      'Export reports for records',
    ],
    link: '/reports',
    estimatedTime: '10 minutes',
  },
  {
    number: 6,
    title: 'Complete Training',
    description: 'Enroll in courses and earn certifications',
    icon: GraduationCap,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/30',
    tasks: [
      'Browse available courses',
      'Enroll in required training',
      'Complete compliance courses',
      'Download your certifications',
    ],
    link: '/training',
    estimatedTime: '30+ minutes',
  },
];

const proTips = [
  {
    title: 'Use Quick Actions',
    description: 'Access frequently used features from the top navigation bar',
    icon: PlayCircle,
  },
  {
    title: 'Customize Your Dashboard',
    description: 'Pin your most-used widgets for quick access',
    icon: BarChart3,
  },
  {
    title: 'Enable Notifications',
    description: 'Stay updated on application status changes and commission payments',
    icon: AlertCircle,
  },
  {
    title: 'Explore the Knowledge Base',
    description: 'Find detailed guides and tutorials for advanced features',
    icon: BookOpen,
  },
];

export default function QuickStartPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/help"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Help Center
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Quick Start Guide</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Get up and running with Valor in just 45 minutes
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Complete these 6 steps to get started
            </CardTitle>
            <CardDescription>
              Follow this guide to familiarize yourself with the platform's core features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              Track your progress as you complete each step
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Steps */}
        <div className="space-y-6">
          {quickStartSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${step.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white">
                          {step.number}
                        </span>
                        <CardTitle className="text-gray-900 dark:text-white">
                          {step.title}
                        </CardTitle>
                        <span className="ml-auto text-sm text-muted-foreground">
                          {step.estimatedTime}
                        </span>
                      </div>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {step.tasks.map((task, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{task}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={step.link}>
                    <Button className="w-full sm:w-auto">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pro Tips */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Pro Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="text-blue-600 dark:text-blue-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {tip.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Next Steps */}
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">What's Next?</CardTitle>
            <CardDescription>
              After completing the quick start guide, explore these resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/knowledge-base"
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Knowledge Base</p>
                    <p className="text-sm text-muted-foreground">
                      In-depth articles and guides
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/help/videos"
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Video Tutorials</p>
                    <p className="text-sm text-muted-foreground">
                      Watch step-by-step walkthroughs
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/training"
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Advanced Training
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Enroll in certification courses
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Need Help */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Need assistance?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Our support team is here to help you get started
                </p>
              </div>
              <Link href="/help/contact">
                <Button>Contact Support</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
