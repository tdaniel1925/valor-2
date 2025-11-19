'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  MessageSquare,
  Users,
  TrendingUp,
  ThumbsUp,
  MessageCircle,
  Eye,
  Clock,
  Pin,
  Award,
  Flame,
  Star,
  CheckCircle,
  UserPlus,
} from 'lucide-react';

const categories = [
  {
    id: 'all',
    name: 'All Discussions',
    count: 156,
    icon: MessageSquare,
    color: 'text-gray-600 dark:text-gray-400',
  },
  {
    id: 'general',
    name: 'General Discussion',
    count: 42,
    icon: MessageSquare,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'sales-tips',
    name: 'Sales Tips & Strategies',
    count: 38,
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'product-questions',
    name: 'Product Questions',
    count: 29,
    icon: MessageCircle,
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'success-stories',
    name: 'Success Stories',
    count: 24,
    icon: Award,
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'feature-requests',
    name: 'Feature Requests',
    count: 23,
    icon: Flame,
    color: 'text-orange-600 dark:text-orange-400',
  },
];

const discussions = [
  {
    id: '1',
    title: 'Best practices for converting term life quotes to applications',
    author: {
      name: 'Sarah Johnson',
      avatar: 'SJ',
      level: 'Top Contributor',
      posts: 127,
    },
    category: 'Sales Tips & Strategies',
    categoryId: 'sales-tips',
    excerpt: 'I wanted to share some techniques that have really helped improve my conversion rates...',
    replies: 23,
    views: 456,
    likes: 34,
    isPinned: true,
    isSolved: false,
    lastActivity: '2 hours ago',
    createdAt: '2024-11-15',
  },
  {
    id: '2',
    title: 'How do you handle complex annuity illustrations for clients?',
    author: {
      name: 'Michael Chen',
      avatar: 'MC',
      level: 'Expert',
      posts: 89,
    },
    category: 'Product Questions',
    categoryId: 'product-questions',
    excerpt: 'Looking for advice on explaining indexed annuities to clients who are new to the concept...',
    replies: 15,
    views: 234,
    likes: 18,
    isPinned: false,
    isSolved: true,
    lastActivity: '4 hours ago',
    createdAt: '2024-11-14',
  },
  {
    id: '3',
    title: 'Closed my biggest case ever - $2M term policy!',
    author: {
      name: 'Emily Rodriguez',
      avatar: 'ER',
      level: 'Rising Star',
      posts: 34,
    },
    category: 'Success Stories',
    categoryId: 'success-stories',
    excerpt: 'After 6 months of relationship building, finally got the signature! Here\'s what worked...',
    replies: 42,
    views: 892,
    likes: 87,
    isPinned: true,
    isSolved: false,
    lastActivity: '6 hours ago',
    createdAt: '2024-11-14',
  },
  {
    id: '4',
    title: 'Feature request: Mobile app for on-the-go quotes',
    author: {
      name: 'David Thompson',
      avatar: 'DT',
      level: 'Active Member',
      posts: 56,
    },
    category: 'Feature Requests',
    categoryId: 'feature-requests',
    excerpt: 'It would be great to have a mobile app for creating quick quotes during client meetings...',
    replies: 31,
    views: 567,
    likes: 45,
    isPinned: false,
    isSolved: false,
    lastActivity: '1 day ago',
    createdAt: '2024-11-13',
  },
  {
    id: '5',
    title: 'Tips for new agents - what I wish I knew when starting',
    author: {
      name: 'Jennifer Martinez',
      avatar: 'JM',
      level: 'Top Contributor',
      posts: 145,
    },
    category: 'General Discussion',
    categoryId: 'general',
    excerpt: 'Been in the business for 5 years now. Here are the top 10 things that helped me succeed...',
    replies: 67,
    views: 1234,
    likes: 102,
    isPinned: true,
    isSolved: false,
    lastActivity: '1 day ago',
    createdAt: '2024-11-12',
  },
  {
    id: '6',
    title: 'Question about commission splits with downline agents',
    author: {
      name: 'Robert Williams',
      avatar: 'RW',
      level: 'Member',
      posts: 12,
    },
    category: 'General Discussion',
    categoryId: 'general',
    excerpt: 'Can someone explain how commission splits work when you have multiple levels?...',
    replies: 8,
    views: 145,
    likes: 5,
    isPinned: false,
    isSolved: true,
    lastActivity: '2 days ago',
    createdAt: '2024-11-11',
  },
];

const topContributors = [
  {
    name: 'Jennifer Martinez',
    avatar: 'JM',
    posts: 145,
    helpful: 234,
    level: 'Top Contributor',
  },
  {
    name: 'Sarah Johnson',
    avatar: 'SJ',
    posts: 127,
    helpful: 198,
    level: 'Top Contributor',
  },
  {
    name: 'Michael Chen',
    avatar: 'MC',
    posts: 89,
    helpful: 156,
    level: 'Expert',
  },
  {
    name: 'David Thompson',
    avatar: 'DT',
    posts: 56,
    helpful: 87,
    level: 'Active Member',
  },
];

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDiscussions = discussions.filter((discussion) => {
    const matchesSearch =
      searchQuery === '' ||
      discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || discussion.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Community</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Connect with fellow agents, share insights, and grow together
            </p>
          </div>
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            New Discussion
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
                  <p className="text-sm text-muted-foreground">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
                  <p className="text-sm text-muted-foreground">Discussions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">2,384</p>
                  <p className="text-sm text-muted-foreground">Total Replies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">89%</p>
                  <p className="text-sm text-muted-foreground">Solved Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Category */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-900 dark:text-white">
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${category.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{category.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {category.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div key={contributor.name} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {contributor.avatar}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {contributor.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contributor.posts} posts • {contributor.helpful} helpful
                      </p>
                    </div>
                    {index === 0 && <Star className="h-4 w-4 text-yellow-500" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Discussions List */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedCategory === 'all'
                  ? 'All Discussions'
                  : categories.find((c) => c.id === selectedCategory)?.name}
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredDiscussions.length} discussion{filteredDiscussions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredDiscussions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No discussions found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDiscussions.map((discussion) => (
                  <Link key={discussion.id} href={`/community/discussion/${discussion.id}`}>
                    <Card className="hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Author Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {discussion.author.avatar}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              {discussion.isPinned && (
                                <Pin className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                              )}
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {discussion.title}
                              </h3>
                              {discussion.isSolved && (
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {discussion.excerpt}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {discussion.author.name}
                              </span>
                              <span className="text-blue-600 dark:text-blue-400">
                                {discussion.author.level}
                              </span>
                              <span className="text-purple-600 dark:text-purple-400">
                                {discussion.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {discussion.replies}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {discussion.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {discussion.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {discussion.lastActivity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Community Guidelines */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Community Guidelines
            </CardTitle>
            <CardDescription>Help us maintain a positive and helpful environment</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                Be respectful and professional in all interactions
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                Share knowledge and help others succeed
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                Search before posting to avoid duplicates
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                Mark discussions as solved when you find an answer
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
