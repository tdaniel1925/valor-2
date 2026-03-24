'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  duration: number;
  category: string;
  thumbnail: string | null;
  views: number;
  uploadedAt: string;
  featured: boolean;
}

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

  // Fetch videos from API
  const { data: allVideos = [], isLoading } = useQuery<Video[]>({
    queryKey: ['help-videos'],
    queryFn: async () => {
      const res = await fetch('/api/help/videos');
      if (!res.ok) throw new Error('Failed to fetch videos');
      return res.json();
    },
  });

  // Filter and sort videos
  const filteredVideos = allVideos
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
        return a.duration - b.duration;
      }
      return 0;
    });

  const featuredVideos = allVideos.filter(v => v.featured);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading videos...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

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
                    {formatDuration(video.duration)}
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
            Showing {filteredVideos.length} of {allVideos.length} videos
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
                  {formatDuration(video.duration)}
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
