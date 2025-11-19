'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Search,
  Star,
  Eye,
  Folder,
  File,
  Heart,
  Filter,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  version: number;
  views: number;
  downloads: number;
  uploadedBy: string;
  createdAt: string;
  isFavorite?: boolean;
}

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ['resources', searchQuery, selectedType, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType) params.append('type', selectedType);
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await fetch(`/api/resources?${params}`);
      if (!res.ok) throw new Error('Failed to fetch resources');
      return res.json();
    },
  });

  const types = [
    'All Types',
    'Marketing Material',
    'Product Info',
    'Form',
    'Training Doc',
    'Policy Template',
    'Presentation',
  ];

  const categories = [
    'All Categories',
    'Life Insurance',
    'Annuities',
    'Sales Tools',
    'Compliance',
    'Training',
    'General',
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Marketing Material':
        return TrendingUp;
      case 'Product Info':
        return FileText;
      case 'Form':
        return File;
      case 'Presentation':
        return Folder;
      default:
        return FileText;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading resources...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Resource Library</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Access marketing materials, product information, forms, and training documents
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Resources</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {resources?.length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Favorites</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {resources?.filter(r => r.isFavorite).length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Downloads</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {resources?.reduce((sum, r) => sum + r.downloads, 0) || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Recently Added</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {resources?.filter(r => {
                      const daysSince = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                      return daysSince <= 7;
                    }).length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value === 'All Types' ? '' : e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
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
            </div>
          </CardContent>
        </Card>

        {/* Resources List */}
        <div className="space-y-4">
          {resources?.map((resource) => {
            const Icon = getTypeIcon(resource.type);
            return (
              <Card key={resource.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 flex-1">
                      <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{resource.type}</Badge>
                          <Badge variant="outline">{resource.category}</Badge>
                          {resource.version > 1 && (
                            <Badge className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                              v{resource.version}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                          {resource.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {resource.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Heart className={`h-4 w-4 ${resource.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">File Name</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{resource.fileName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Size</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatFileSize(resource.fileSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Views</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {resource.views}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Downloads</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {resource.downloads}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Uploaded By</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{resource.uploadedBy}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {resources?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No resources found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('');
                  setSelectedCategory('');
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
