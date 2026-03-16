'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeft, Clock, Eye, Calendar } from 'lucide-react';

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
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

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (params.id) {
      fetchVideo();
    }

    // Cleanup on unmount
    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, [params.id]);

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/training/videos?videoId=${params.id}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.videos && data.videos.length > 0) {
        setVideo(data.videos[0]);

        // Initialize YouTube player after component mounts
        setTimeout(() => {
          initializeYouTubePlayer(data.videos[0].youtubeId);
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeYouTubePlayer = (youtubeId: string) => {
    // Load YouTube IFrame API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        createPlayer(youtubeId);
      };
    } else {
      createPlayer(youtubeId);
    }
  };

  const createPlayer = (youtubeId: string) => {
    playerRef.current = new (window as any).YT.Player('youtube-player', {
      videoId: youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onStateChange: onPlayerStateChange,
      },
    });

    // Track watch progress every 5 seconds
    watchIntervalRef.current = setInterval(() => {
      trackWatchProgress();
    }, 5000);
  };

  const onPlayerStateChange = (event: any) => {
    // When video ends, mark as completed
    if (event.data === (window as any).YT.PlayerState.ENDED && video) {
      saveWatchHistory(video.duration || 0, true);
    }
  };

  const trackWatchProgress = async () => {
    if (!playerRef.current || !video) return;

    try {
      const currentTime = Math.floor(playerRef.current.getCurrentTime());
      if (currentTime > 0) {
        await saveWatchHistory(currentTime, false);
      }
    } catch (error) {
      console.error('Error tracking progress:', error);
    }
  };

  const saveWatchHistory = async (watchedSeconds: number, completed: boolean) => {
    if (!video) return;

    try {
      await fetch('/api/training/videos/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          videoId: video.id,
          watchedSeconds,
          completed,
        }),
      });
    } catch (error) {
      console.error('Error saving watch history:', error);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading video...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!video) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Video not found</h3>
            <button
              onClick={() => router.push('/training')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Training
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/training')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Training
        </button>

        {/* Video Player */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="aspect-video bg-black">
            <div id="youtube-player" className="w-full h-full"></div>
          </div>
        </div>

        {/* Video Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            {video.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
                {video.category.icon && <span>{video.category.icon}</span>}
                {video.category.name}
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{video.title}</h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              {video.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(video.duration)}
                </div>
              )}
              {video.viewCount > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {video.viewCount.toLocaleString()} views
                </div>
              )}
              {video.publishedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(video.publishedAt)}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{video.description}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
