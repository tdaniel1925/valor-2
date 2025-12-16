'use client';

import { useState, useEffect } from 'react';
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
  Target,
  Award,
  Settings,
  Zap,
  ShieldCheck,
} from 'lucide-react';

const helpCategories = [
  {
    id: 'GETTING_STARTED',
    name: 'Getting Started',
    description: 'Learn the basics and set up your account',
    icon: Lightbulb,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
  },
  {
    id: 'CASES',
    name: 'Cases',
    description: 'Managing cases from submission to issue',
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
  },
  {
    id: 'COMMISSIONS',
    name: 'Commissions',
    description: 'Understanding commission tracking and payments',
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
  },
  {
    id: 'QUOTES',
    name: 'Quotes',
    description: 'Creating and managing insurance quotes',
    icon: Target,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/30',
  },
  {
    id: 'CONTRACTS',
    name: 'Contracts',
    description: 'Carrier contracts and commission levels',
    icon: Award,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
  },
  {
    id: 'TRAINING',
    name: 'Training',
    description: 'Access courses and earn certifications',
    icon: Video,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
  },
  {
    id: 'REPORTS',
    name: 'Reports',
    description: 'Generate and understand reports',
    icon: BookOpen,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/30',
  },
  {
    id: 'INTEGRATIONS',
    name: 'Integrations',
    description: 'Connecting with external systems',
    icon: Zap,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
  },
  {
    id: 'TROUBLESHOOTING',
    name: 'Troubleshooting',
    description: 'Fix common issues and errors',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
  },
  {
    id: 'BEST_PRACTICES',
    name: 'Best Practices',
    description: 'Tips and strategies for success',
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  {
    id: 'COMPLIANCE',
    name: 'Compliance',
    description: 'Regulatory requirements and compliance',
    icon: ShieldCheck,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/30',
  },
  {
    id: 'ADMIN',
    name: 'Admin',
    description: 'Administrative features and settings',
    icon: Settings,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/30',
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
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch articles from API
  const { data: articlesData } = useQuery({
    queryKey: ['help-articles'],
    queryFn: async () => {
      const res = await fetch('/api/help/articles');
      if (!res.ok) throw new Error('Failed to fetch articles');
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch FAQs from API
  const { data: faqsData } = useQuery({
    queryKey: ['help-faqs'],
    queryFn: async () => {
      const res = await fetch('/api/help/faqs');
      if (!res.ok) throw new Error('Failed to fetch FAQs');
      const json = await res.json();
      return json.data;
    },
  });

  // Search functionality
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/help/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          if (data.success) {
            setSearchResults(data.data);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Get popular articles (top 5 by views + helpful count)
  const popularArticles = articlesData?.articles
    ?.sort((a: any, b: any) => (b.views + b.helpfulCount) - (a.views + a.helpfulCount))
    .slice(0, 5) || [];

  // Get category counts
  const categoryCounts = articlesData?.groupedByCategory || {};

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
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults && searchQuery.length >= 2 && (
            <div className="absolute z-50 mt-2 w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
              {searchResults.totalResults === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {searchResults.articles.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Articles ({searchResults.articles.length})
                      </div>
                      {searchResults.articles.map((article: any) => (
                        <Link
                          key={article.slug}
                          href={`/help/articles/${article.slug}`}
                          className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setSearchQuery('')}
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {article.title}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {article.summary}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.faqs.length > 0 && (
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        FAQs ({searchResults.faqs.length})
                      </div>
                      {searchResults.faqs.map((faq: any) => (
                        <div
                          key={faq.id}
                          className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {faq.question}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
              const articleCount = categoryCounts[category.id]?.length || 0;
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
                          {articleCount} {articleCount === 1 ? 'article' : 'articles'}
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
        {popularArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Popular Articles
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {popularArticles.map((article: any) => {
                    const categoryInfo = helpCategories.find(c => c.id === article.category);
                    const Icon = categoryInfo?.icon || FileText;
                    return (
                      <Link
                        key={article.id}
                        href={`/help/articles/${article.slug}`}
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
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {article.views.toLocaleString()} views
                              </span>
                              {article.helpfulCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  {article.helpfulCount} found helpful
                                </span>
                              )}
                              <span className="text-blue-600 dark:text-blue-400">
                                {article.category.replace(/_/g, ' ')}
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
        )}

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
                  {articlesData?.total || 0}
                </div>
                <p className="text-sm text-muted-foreground">Help Articles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {faqsData?.total || 0}
                </div>
                <p className="text-sm text-muted-foreground">FAQs Available</p>
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
