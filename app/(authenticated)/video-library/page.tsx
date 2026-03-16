'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Play, Clock, CheckCircle, Filter } from 'lucide-react';

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  publishedAt: Date | null;
  viewCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  progress?: {
    watchedSeconds: number;
    completed: boolean;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  _count: {
    videos: number;
  };
}

export default function TrainingPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [videosRes, categoriesRes] = await Promise.all([
        fetch(`/api/video-library/videos${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`, {
          credentials: 'include',
        }),
        fetch('/api/video-library/categories', { credentials: 'include' }),
      ]);

      const videosData = await videosRes.json();
      const categoriesData = await categoriesRes.json();

      setVideos(videosData.videos || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (video: Video) => {
    if (!video.progress || !video.duration) return 0;
    return Math.round((video.progress.watchedSeconds / video.duration) * 100);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Videos</h1>
          <p className="text-gray-600">Access exclusive training content for Valor agents</p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Videos ({videos.length})
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon && <span>{category.icon}</span>}
              {category.name} ({category._count.videos})
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading videos...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && videos.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos available</h3>
            <p className="text-gray-600">Check back soon for new training content</p>
          </div>
        )}

        {/* Video Grid */}
        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <a
                key={video.id}
                href={`/video-library/${video.id}`}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-200">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {video.progress && video.progress.watchedSeconds > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${getProgressPercentage(video)}%` }}
                      />
                    </div>
                  )}

                  {/* Completed Badge */}
                  {video.progress?.completed && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <div className="bg-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
                      <Play className="w-8 h-8 text-blue-600" fill="currentColor" />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{video.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {video.category && (
                      <span className="flex items-center gap-1">
                        {video.category.icon && <span>{video.category.icon}</span>}
                        {video.category.name}
                      </span>
                    )}
                    {video.progress && !video.progress.completed && (
                      <span>{getProgressPercentage(video)}% watched</span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
