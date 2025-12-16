'use client';

import { use } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Search,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  Clock,
  ArrowLeft,
  FileText,
  Video,
} from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'guide';
  readTime?: string;
  duration?: string;
  views: number;
  helpful: number;
  lastUpdated: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  articleCount: number;
  videoCount: number;
}

// Sample category data
const categories: Record<string, Category> = {
  'getting-started': {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Essential guides to help you get up and running with Valor',
    icon: 'BookOpen',
    articleCount: 12,
    videoCount: 5,
  },
  'quotes': {
    id: 'quotes',
    name: 'Quotes & Illustrations',
    description: 'Learn how to create accurate quotes and professional illustrations',
    icon: 'FileText',
    articleCount: 18,
    videoCount: 8,
  },
  'applications': {
    id: 'applications',
    name: 'Applications',
    description: 'Complete guide to processing life insurance applications',
    icon: 'FileText',
    articleCount: 15,
    videoCount: 6,
  },
  'commissions': {
    id: 'commissions',
    name: 'Commission Management',
    description: 'Understanding commission structures, splits, and reporting',
    icon: 'DollarSign',
    articleCount: 10,
    videoCount: 4,
  },
  'clients': {
    id: 'clients',
    name: 'Client Management',
    description: 'Best practices for managing client relationships and pipeline',
    icon: 'Users',
    articleCount: 14,
    videoCount: 5,
  },
  'integrations': {
    id: 'integrations',
    name: 'Integrations',
    description: 'Connect with carriers, CRMs, and other third-party systems',
    icon: 'Plug',
    articleCount: 8,
    videoCount: 3,
  },
};

// Sample articles by category
const articlesByCategory: Record<string, Article[]> = {
  'getting-started': [
    {
      id: '1',
      title: 'Welcome to Valor: Your First Steps',
      description: 'A comprehensive introduction to the Valor platform and its key features.',
      type: 'article',
      readTime: '5 min',
      views: 2450,
      helpful: 189,
      lastUpdated: '2024-03-15',
    },
    {
      id: '2',
      title: 'Setting Up Your Profile and Preferences',
      description: 'Customize your Valor experience with profile settings and preferences.',
      type: 'article',
      readTime: '3 min',
      views: 1820,
      helpful: 142,
      lastUpdated: '2024-03-10',
    },
    {
      id: '3',
      title: 'Getting Started Video Tutorial',
      description: 'Watch this 10-minute video to learn the basics of using Valor.',
      type: 'video',
      duration: '10:30',
      views: 3200,
      helpful: 256,
      lastUpdated: '2024-03-01',
    },
    {
      id: '4',
      title: 'Navigating the Dashboard',
      description: 'Learn how to use the dashboard to access key features and insights.',
      type: 'article',
      readTime: '4 min',
      views: 1650,
      helpful: 128,
      lastUpdated: '2024-02-25',
    },
    {
      id: '5',
      title: 'Understanding User Roles and Permissions',
      description: 'Learn about different user roles and what permissions each role has.',
      type: 'guide',
      readTime: '7 min',
      views: 980,
      helpful: 76,
      lastUpdated: '2024-02-20',
    },
  ],
  'quotes': [
    {
      id: '6',
      title: 'Creating Your First Quote',
      description: 'Step-by-step guide to creating accurate life insurance quotes.',
      type: 'article',
      readTime: '6 min',
      views: 2100,
      helpful: 167,
      lastUpdated: '2024-03-18',
    },
    {
      id: '7',
      title: 'Understanding Quote Comparison Tools',
      description: 'Compare quotes across multiple carriers to find the best options.',
      type: 'article',
      readTime: '5 min',
      views: 1580,
      helpful: 124,
      lastUpdated: '2024-03-12',
    },
    {
      id: '8',
      title: 'Term Life Illustrations Walkthrough',
      description: 'Video tutorial on creating professional term life illustrations.',
      type: 'video',
      duration: '14:05',
      views: 1890,
      helpful: 145,
      lastUpdated: '2024-03-05',
    },
    {
      id: '9',
      title: 'Whole Life Cash Value Projections',
      description: 'Learn how to create accurate cash value projections for whole life policies.',
      type: 'guide',
      readTime: '10 min',
      views: 1420,
      helpful: 112,
      lastUpdated: '2024-02-28',
    },
  ],
  'applications': [
    {
      id: '10',
      title: 'Life Insurance Application Process Overview',
      description: 'Complete overview of the application workflow from start to finish.',
      type: 'guide',
      readTime: '12 min',
      views: 1950,
      helpful: 156,
      lastUpdated: '2024-03-20',
    },
    {
      id: '11',
      title: 'Required Documents Checklist',
      description: 'What documents you need to collect from clients for applications.',
      type: 'article',
      readTime: '4 min',
      views: 1680,
      helpful: 132,
      lastUpdated: '2024-03-14',
    },
    {
      id: '12',
      title: 'E-Application Best Practices',
      description: 'Tips for completing electronic applications efficiently and accurately.',
      type: 'article',
      readTime: '6 min',
      views: 1420,
      helpful: 109,
      lastUpdated: '2024-03-08',
    },
  ],
  'commissions': [
    {
      id: '13',
      title: 'Understanding Commission Structures',
      description: 'Learn how commission splits and hierarchies work in Valor.',
      type: 'guide',
      readTime: '8 min',
      views: 1750,
      helpful: 138,
      lastUpdated: '2024-03-16',
    },
    {
      id: '14',
      title: 'Commission Reporting and Forecasting',
      description: 'Generate reports and forecast future commission earnings.',
      type: 'article',
      readTime: '5 min',
      views: 1290,
      helpful: 98,
      lastUpdated: '2024-03-09',
    },
  ],
  'clients': [
    {
      id: '15',
      title: 'Managing Your Client Pipeline',
      description: 'Best practices for tracking leads and opportunities.',
      type: 'article',
      readTime: '7 min',
      views: 1620,
      helpful: 126,
      lastUpdated: '2024-03-17',
    },
    {
      id: '16',
      title: 'Client Communication Tools',
      description: 'Use built-in tools to communicate effectively with clients.',
      type: 'article',
      readTime: '5 min',
      views: 1180,
      helpful: 89,
      lastUpdated: '2024-03-11',
    },
  ],
  'integrations': [
    {
      id: '17',
      title: 'Carrier Integration Setup',
      description: 'Connect your Valor account with carrier systems for seamless data flow.',
      type: 'guide',
      readTime: '10 min',
      views: 890,
      helpful: 67,
      lastUpdated: '2024-03-13',
    },
    {
      id: '18',
      title: 'Troubleshooting Integration Issues',
      description: 'Common integration problems and how to resolve them.',
      type: 'article',
      readTime: '6 min',
      views: 720,
      helpful: 54,
      lastUpdated: '2024-03-07',
    },
  ],
};

export default function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.categoryId;
  const category = categories[categoryId];
  const articles = articlesByCategory[categoryId] || [];

  // If category not found, show error
  if (!category) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Category Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The category you're looking for doesn't exist.
            </p>
            <Link
              href="/help"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'guide':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'guide':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/help" className="hover:text-blue-600 dark:hover:text-blue-400">
              Help Center
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 dark:text-gray-100 font-medium">{category.name}</span>
          </div>
        </div>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {category.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {category.description}
              </p>
            </div>
            <Link
              href="/help"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </div>

          {/* Category Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{category.articleCount} articles</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>{category.videoCount} videos</span>
            </div>
          </div>
        </div>

        {/* Search within category */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search in ${category.name}...`}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getTypeBadgeColor(article.type)}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(article.type)}
                          {article.type.charAt(0).toUpperCase() + article.type.slice(1)}
                        </span>
                      </Badge>
                      {article.readTime && (
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          {article.readTime}
                        </span>
                      )}
                      {article.duration && (
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          {article.duration}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {article.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {article.helpful} helpful
                      </span>
                      <span>{article.views.toLocaleString()} views</span>
                      <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {articles.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No articles yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We're working on adding content to this category.
            </p>
          </div>
        )}

        {/* Related Categories */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Related Categories</CardTitle>
            <CardDescription>Explore other help topics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(categories)
                .filter(cat => cat.id !== categoryId)
                .slice(0, 4)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/help/category/${cat.id}`}
                    className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {cat.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {cat.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{cat.articleCount} articles</span>
                      <span>{cat.videoCount} videos</span>
                    </div>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
