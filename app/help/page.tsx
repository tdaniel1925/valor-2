'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  BookOpen,
  PlayCircle,
  FileText,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  Video,
  Lightbulb,
} from 'lucide-react';

const helpCategories = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics and set up your account',
    icon: Lightbulb,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    articleCount: 12,
  },
  {
    id: 'quotes',
    name: 'Quotes & Applications',
    description: 'Create quotes and submit applications',
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    articleCount: 18,
  },
  {
    id: 'commissions',
    name: 'Commissions & Payments',
    description: 'Track earnings and payment schedules',
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    articleCount: 10,
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Generate and understand reports',
    icon: BookOpen,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    articleCount: 15,
  },
  {
    id: 'training',
    name: 'Training & Certifications',
    description: 'Access courses and earn certifications',
    icon: Video,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
    articleCount: 8,
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Fix common issues and errors',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    articleCount: 14,
  },
];

const popularArticles = [
  {
    id: '1',
    title: 'How to create your first life insurance quote',
    category: 'Quotes & Applications',
    views: 2456,
    helpful: 234,
    icon: FileText,
  },
  {
    id: '2',
    title: 'Understanding commission structures and splits',
    category: 'Commissions & Payments',
    views: 1892,
    helpful: 187,
    icon: TrendingUp,
  },
  {
    id: '3',
    title: 'Setting up your agent profile',
    category: 'Getting Started',
    views: 1654,
    helpful: 165,
    icon: Lightbulb,
  },
  {
    id: '4',
    title: 'How to generate custom reports',
    category: 'Reports & Analytics',
    views: 1432,
    helpful: 142,
    icon: BookOpen,
  },
  {
    id: '5',
    title: 'Enrolling in training courses',
    category: 'Training & Certifications',
    views: 1298,
    helpful: 128,
    icon: Video,
  },
];

const quickLinks = [
  {
    title: 'Quick Start Guide',
    description: 'Get up and running in 5 minutes',
    href: '/help/quick-start',
    icon: PlayCircle,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides',
    href: '/help/videos',
    icon: Video,
    color: 'text-red-600 dark:text-red-400',
  },
  {
    title: 'Contact Support',
    description: 'Get help from our support team',
    href: '/help/contact',
    icon: MessageSquare,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Community Forum',
    description: 'Connect with other agents',
    href: '/community',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400',
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Search our knowledge base or browse categories to find answers
          </p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help articles, guides, and tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.title} href={link.href}>
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`${link.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {link.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Help Categories */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={`/help/category/${category.id}`}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                    <CardHeader>
                      <div
                        className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-4`}
                      >
                        <Icon className={`h-6 w-6 ${category.color}`} />
                      </div>
                      <CardTitle className="text-gray-900 dark:text-white">
                        {category.name}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {category.articleCount} articles
                        </span>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Popular Articles */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Popular Articles
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {popularArticles.map((article) => {
                  const Icon = article.icon;
                  return (
                    <Link
                      key={article.id}
                      href={`/help/article/${article.id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="text-blue-600 dark:text-blue-400">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {article.views.toLocaleString()} views
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              {article.helpful} found helpful
                            </span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {article.category}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Still Need Help */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Still need help?
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/help/contact">
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </Link>
              <Link href="/community">
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Ask the Community
                </Button>
              </Link>
              <Link href="/help/videos">
                <Button variant="outline">
                  <Video className="mr-2 h-4 w-4" />
                  Watch Tutorials
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  200+
                </div>
                <p className="text-sm text-muted-foreground">Help Articles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  50+
                </div>
                <p className="text-sm text-muted-foreground">Video Tutorials</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  24/7
                </div>
                <p className="text-sm text-muted-foreground">Support Available</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
