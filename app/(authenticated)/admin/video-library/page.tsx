'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Youtube, RefreshCw, Plus, FolderPlus } from 'lucide-react';

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  categoryId: string | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  _count: {
    videos: number;
  };
}

export default function AdminTrainingPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState('UCa9Gu-MJbAZgvK-Uy--AEdw'); // Default to Valor Financial channel

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [videosRes, categoriesRes] = await Promise.all([
        fetch('/api/video-library/videos', { credentials: 'include' }),
        fetch('/api/video-library/categories', { credentials: 'include' }),
      ]);

      const videosData = await videosRes.json();
      const categoriesData = await categoriesRes.json();

      setVideos(videosData.videos || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!channelId.trim()) {
      alert('Please enter a YouTube channel ID');
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch('/api/video-library/videos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channelId: channelId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Successfully synced ${data.synced} videos!`);
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      alert('Failed to sync videos');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateCategory = async () => {
    const name = prompt('Enter category name:');
    if (!name) return;

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const icon = prompt('Enter category icon (emoji):');

    try {
      const response = await fetch('/api/video-library/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          slug,
          icon: icon || null,
          description: '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Category created successfully!');
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Create category error:', error);
      alert('Failed to create category');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Video Management</h1>
          <p className="text-gray-600">Sync videos from YouTube and manage categories</p>
        </div>

        {/* YouTube Sync Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Youtube className="w-6 h-6 text-red-600" />
            Sync from YouTube
          </h2>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Channel ID
              </label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="UCa9Gu-MJbAZgvK-Uy--AEdw"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your channel ID: YouTube Studio → Settings → Channel → Advanced Settings
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Videos
                </>
              )}
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FolderPlus className="w-6 h-6 text-blue-600" />
              Video Categories
            </h2>
            <button
              onClick={handleCreateCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Category
            </button>
          </div>

          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No categories created yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {category.icon && <span className="text-2xl">{category.icon}</span>}
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {category._count.videos} video{category._count.videos !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Slug: {category.slug}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Videos List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Videos ({videos.length})</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Youtube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos synced</h3>
              <p className="text-gray-600">Use the sync button above to import videos from YouTube</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">YouTube ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video) => (
                    <tr key={video.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <a
                          href={`/video-library/${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {video.title}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {video.categoryId ? (
                          categories.find((c) => c.id === video.categoryId)?.name || 'Unknown'
                        ) : (
                          <span className="text-gray-400">Uncategorized</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">{video.youtubeId}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            video.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {video.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
