'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Clock, Search, Filter, TrendingUp, BookOpen, Users, Shield } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
  views: number;
  uploadedAt: string;
  featured: boolean;
}

const sampleVideos: Video[] = [
  {
    id: '1',
    title: 'Getting Started with Valor Platform',
    description: 'Learn the basics of navigating the Valor insurance platform and setting up your account.',
    duration: '8:45',
    category: 'getting-started',
    thumbnail: '/api/placeholder/400/225',
    views: 1250,
    uploadedAt: '2024-01-15',
    featured: true,
  },
  {
    id: '2',
    title: 'Creating Your First Life Insurance Quote',
    description: 'Step-by-step guide to creating accurate life insurance quotes for your clients.',
    duration: '12:30',
    category: 'quotes',
    thumbnail: '/api/placeholder/400/225',
    views: 980,
    uploadedAt: '2024-01-20',
    featured: true,
  },
  {
    id: '3',
    title: 'Understanding Commission Structures',
    description: 'Deep dive into how commission splits and hierarchies work in the Valor platform.',
    duration: '15:20',
    category: 'commissions',
    thumbnail: '/api/placeholder/400/225',
    views: 750,
    uploadedAt: '2024-02-01',
    featured: false,
  },
  {
    id: '4',
    title: 'Managing Your Client Pipeline',
    description: 'Best practices for tracking leads, opportunities, and client relationships.',
    duration: '10:15',
    category: 'clients',
    thumbnail: '/api/placeholder/400/225',
    views: 620,
    uploadedAt: '2024-02-10',
    featured: false,
  },
  {
    id: '5',
    title: 'Policy Illustrations: Term Life',
    description: 'How to create and present professional term life insurance illustrations.',
    duration: '14:05',
    category: 'illustrations',
    thumbnail: '/api/placeholder/400/225',
    views: 890,
    uploadedAt: '2024-02-15',
    featured: true,
  },
  {
    id: '6',
    title: 'Policy Illustrations: Whole Life',
    description: 'Creating whole life illustrations with cash value projections and dividend schedules.',
    duration: '16:40',
    category: 'illustrations',
    thumbnail: '/api/placeholder/400/225',
    views: 710,
    uploadedAt: '2024-02-20',
    featured: false,
  },
  {
    id: '7',
    title: 'Completing Life Insurance Applications',
    description: 'Walk through the entire application process from start to submission.',
    duration: '18:25',
    category: 'applications',
    thumbnail: '/api/placeholder/400/225',
    views: 840,
    uploadedAt: '2024-03-01',
    featured: false,
  },
  {
    id: '8',
    title: 'Document Management Best Practices',
    description: 'Organizing and managing client documents, forms, and compliance materials.',
    duration: '9:30',
    category: 'documents',
    thumbnail: '/api/placeholder/400/225',
    views: 560,
    uploadedAt: '2024-03-05',
    featured: false,
  },
  {
    id: '9',
    title: 'Advanced Commission Reporting',
    description: 'Generate custom commission reports and forecast future earnings.',
    duration: '13:15',
    category: 'commissions',
    thumbnail: '/api/placeholder/400/225',
    views: 690,
    uploadedAt: '2024-03-10',
    featured: false,
  },
  {
    id: '10',
    title: 'Team Management and Hierarchy Setup',
    description: 'Setting up your agency hierarchy and managing team permissions.',
    duration: '11:50',
    category: 'admin',
    thumbnail: '/api/placeholder/400/225',
    views: 420,
    uploadedAt: '2024-03-15',
    featured: false,
  },
  {
    id: '11',
    title: 'Carrier Integrations Overview',
    description: 'Understanding how carrier integrations work and troubleshooting common issues.',
    duration: '10:40',
    category: 'integrations',
    thumbnail: '/api/placeholder/400/225',
    views: 530,
    uploadedAt: '2024-03-20',
    featured: false,
  },
  {
    id: '12',
    title: 'Analytics Dashboard Deep Dive',
    description: 'Leverage analytics to track performance, identify trends, and grow your business.',
    duration: '12:00',
    category: 'analytics',
    thumbnail: '/api/placeholder/400/225',
    views: 780,
    uploadedAt: '2024-03-25',
    featured: false,
  },
];

const categories = [
  { value: 'all', label: 'All Videos', icon: BookOpen },
  { value: 'getting-started', label: 'Getting Started', icon: Play },
  { value: 'quotes', label: 'Quotes', icon: TrendingUp },
  { value: 'illustrations', label: 'Illustrations', icon: BookOpen },
  { value: 'applications', label: 'Applications', icon: Shield },
  { value: 'commissions', label: 'Commissions', icon: TrendingUp },
  { value: 'clients', label: 'Client Management', icon: Users },
  { value: 'documents', label: 'Documents', icon: BookOpen },
  { value: 'admin', label: 'Administration', icon: Shield },
  { value: 'integrations', label: 'Integrations', icon: Shield },
  { value: 'analytics', label: 'Analytics', icon: TrendingUp },
];

export default function VideoTutorialsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Filter and sort videos
  const filteredVideos = sampleVideos
    .filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          video.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      } else if (sortBy === 'popular') {
        return b.views - a.views;
      } else if (sortBy === 'duration') {
        const getDuration = (dur: string) => {
          const [min, sec] = dur.split(':').map(Number);
          return min * 60 + sec;
        };
        return getDuration(a.duration) - getDuration(b.duration);
      }
      return 0;
    });

  const featuredVideos = sampleVideos.filter(v => v.featured);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Video Tutorials
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Learn how to use Valor with our comprehensive video library
          </p>
        </div>

        {/* Featured Videos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Featured Tutorials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-blue-600 rounded-full p-4 hover:bg-blue-700 transition-colors">
                      <Play className="h-8 w-8 text-white" fill="white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                  <Badge className="absolute top-2 left-2 bg-blue-600">Featured</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{video.views.toLocaleString()} views</span>
                    <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="md:col-span-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="md:col-span-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredVideos.length} of {sampleVideos.length} videos
            {selectedCategory !== 'all' && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-blue-600 rounded-full p-3 hover:bg-blue-700 transition-colors">
                    <Play className="h-6 w-6 text-white" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {video.duration}
                </div>
              </div>
              <CardContent className="p-4">
                <Badge className="mb-2 text-xs">
                  {categories.find(c => c.value === video.category)?.label || video.category}
                </Badge>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {video.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{video.views.toLocaleString()} views</span>
                  <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No videos found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
