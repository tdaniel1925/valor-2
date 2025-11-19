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
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Shield,
  Settings,
  Lightbulb,
  ChevronRight,
  Clock,
  Tag,
  Star,
  Filter,
} from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Articles', count: 87 },
  { id: 'getting-started', name: 'Getting Started', count: 12 },
  { id: 'quotes', name: 'Quotes & Applications', count: 18 },
  { id: 'commissions', name: 'Commissions', count: 10 },
  { id: 'reports', name: 'Reports & Analytics', count: 15 },
  { id: 'training', name: 'Training', count: 8 },
  { id: 'admin', name: 'Administration', count: 14 },
  { id: 'integrations', name: 'Integrations', count: 10 },
];

const articles = [
  {
    id: '1',
    title: 'Complete guide to creating life insurance quotes',
    excerpt: 'Learn how to create accurate life insurance quotes, including term, whole life, and universal life products.',
    category: 'Quotes & Applications',
    categoryId: 'quotes',
    author: 'Support Team',
    lastUpdated: '2024-11-15',
    readTime: 8,
    views: 2456,
    helpful: 234,
    tags: ['quotes', 'life insurance', 'applications'],
    icon: FileText,
    featured: true,
  },
  {
    id: '2',
    title: 'Understanding commission structures and hierarchies',
    excerpt: 'Detailed explanation of how commission splits work within organizational hierarchies.',
    category: 'Commissions',
    categoryId: 'commissions',
    author: 'Finance Team',
    lastUpdated: '2024-11-14',
    readTime: 12,
    views: 1892,
    helpful: 187,
    tags: ['commissions', 'payments', 'hierarchy'],
    icon: DollarSign,
    featured: true,
  },
  {
    id: '3',
    title: 'Setting up your agent profile and preferences',
    excerpt: 'Step-by-step guide to completing your profile, including licensing information and notification settings.',
    category: 'Getting Started',
    categoryId: 'getting-started',
    author: 'Support Team',
    lastUpdated: '2024-11-13',
    readTime: 5,
    views: 1654,
    helpful: 165,
    tags: ['profile', 'setup', 'preferences'],
    icon: Users,
    featured: false,
  },
  {
    id: '4',
    title: 'How to generate and export custom reports',
    excerpt: 'Learn how to use the custom report builder to create tailored analytics and export data.',
    category: 'Reports & Analytics',
    categoryId: 'reports',
    author: 'Analytics Team',
    lastUpdated: '2024-11-12',
    readTime: 10,
    views: 1432,
    helpful: 142,
    tags: ['reports', 'analytics', 'export'],
    icon: BarChart3,
    featured: true,
  },
  {
    id: '5',
    title: 'Enrolling in training courses and tracking progress',
    excerpt: 'Guide to browsing courses, enrolling, and tracking your learning progress.',
    category: 'Training',
    categoryId: 'training',
    author: 'Training Team',
    lastUpdated: '2024-11-11',
    readTime: 6,
    views: 1298,
    helpful: 128,
    tags: ['training', 'courses', 'certifications'],
    icon: BookOpen,
    featured: false,
  },
  {
    id: '6',
    title: 'Managing organizational hierarchies and teams',
    excerpt: 'How to set up and manage multi-level organizations with proper role assignments.',
    category: 'Administration',
    categoryId: 'admin',
    author: 'Admin Team',
    lastUpdated: '2024-11-10',
    readTime: 15,
    views: 987,
    helpful: 98,
    tags: ['organizations', 'hierarchy', 'teams'],
    icon: Shield,
    featured: false,
  },
  {
    id: '7',
    title: 'Integrating with carrier systems and APIs',
    excerpt: 'Connect your account with carrier systems for automated application submission.',
    category: 'Integrations',
    categoryId: 'integrations',
    author: 'Integration Team',
    lastUpdated: '2024-11-09',
    readTime: 20,
    views: 756,
    helpful: 75,
    tags: ['integrations', 'api', 'carriers'],
    icon: Settings,
    featured: false,
  },
  {
    id: '8',
    title: 'Best practices for annuity quotes',
    excerpt: 'Tips and best practices for creating accurate annuity quotes including MYGA, fixed, and indexed products.',
    category: 'Quotes & Applications',
    categoryId: 'quotes',
    author: 'Product Team',
    lastUpdated: '2024-11-08',
    readTime: 12,
    views: 654,
    helpful: 65,
    tags: ['annuities', 'quotes', 'best practices'],
    icon: FileText,
    featured: false,
  },
  {
    id: '9',
    title: 'Understanding commission forecasting',
    excerpt: 'Learn how the AI-powered commission forecast works and how to interpret projections.',
    category: 'Reports & Analytics',
    categoryId: 'reports',
    author: 'Analytics Team',
    lastUpdated: '2024-11-07',
    readTime: 8,
    views: 543,
    helpful: 54,
    tags: ['forecasting', 'commissions', 'analytics'],
    icon: TrendingUp,
    featured: false,
  },
  {
    id: '10',
    title: 'Role-based permissions and access control',
    excerpt: 'Complete guide to setting up roles, permissions, and access controls for your organization.',
    category: 'Administration',
    categoryId: 'admin',
    author: 'Security Team',
    lastUpdated: '2024-11-06',
    readTime: 18,
    views: 432,
    helpful: 43,
    tags: ['permissions', 'roles', 'security'],
    icon: Shield,
    featured: false,
  },
];

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'helpful'>('popular');

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || article.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === 'popular') return b.views - a.views;
    if (sortBy === 'helpful') return b.helpful - a.helpful;
    if (sortBy === 'recent')
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    return 0;
  });

  const featuredArticles = articles.filter((a) => a.featured);

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Comprehensive guides and documentation for all platform features
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search articles, guides, and documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent' | 'helpful')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Recently Updated</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>

        {/* Featured Articles */}
        {selectedCategory === 'all' && !searchQuery && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Featured Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article) => {
                const Icon = article.icon;
                return (
                  <Link key={article.id} href={`/knowledge-base/article/${article.id}`}>
                    <Card className="h-full hover:shadow-lg transition-all cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs text-muted-foreground">
                            {article.readTime} min read
                          </span>
                        </div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">
                          {article.title}
                        </CardTitle>
                        <CardDescription>{article.excerpt}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="text-blue-600 dark:text-blue-400">
                            {article.category}
                          </span>
                          <span>{article.views.toLocaleString()} views</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-900 dark:text-white">
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-xs text-muted-foreground">{category.count}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Articles List */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedCategory === 'all'
                  ? 'All Articles'
                  : categories.find((c) => c.id === selectedCategory)?.name}
              </h2>
              <span className="text-sm text-muted-foreground">
                {sortedArticles.length} article{sortedArticles.length !== 1 ? 's' : ''}
              </span>
            </div>

            {sortedArticles.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No articles found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedArticles.map((article) => {
                  const Icon = article.icon;
                  return (
                    <Link key={article.id} href={`/knowledge-base/article/${article.id}`}>
                      <Card className="hover:shadow-lg transition-all cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="text-blue-600 dark:text-blue-400">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {article.title}
                                </h3>
                                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {article.excerpt}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {article.readTime} min read
                                </span>
                                <span className="text-blue-600 dark:text-blue-400">
                                  {article.category}
                                </span>
                                <span>{article.views.toLocaleString()} views</span>
                                <span className="text-green-600 dark:text-green-400">
                                  {article.helpful} helpful
                                </span>
                                <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {article.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                                  >
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Can't find what you're looking for?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try our interactive help center or contact support
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/help">
                  <Button variant="outline">Help Center</Button>
                </Link>
                <Link href="/help/contact">
                  <Button>Contact Support</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
