import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// YouTube Data API v3 endpoint
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
  };
  contentDetails: {
    duration: string; // ISO 8601 duration format (PT1H2M10S)
  };
  statistics: {
    viewCount: string;
  };
}

// Convert ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can sync videos
    if (dbUser.role !== 'ADMINISTRATOR' && dbUser.role !== 'EXECUTIVE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { channelId } = await request.json();

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
    }

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    console.log(`Syncing videos from YouTube channel: ${channelId}`);

    // Fetch channel's uploads playlist ID
    const channelResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${youtubeApiKey}`
    );
    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Fetch all videos from uploads playlist
    let allVideos: YouTubeVideo[] = [];
    let nextPageToken: string | null = null;

    do {
      const playlistUrl = `${YOUTUBE_API_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${youtubeApiKey}${
        nextPageToken ? `&pageToken=${nextPageToken}` : ''
      }`;

      const playlistResponse = await fetch(playlistUrl);
      const playlistData = await playlistResponse.json();

      if (playlistData.items) {
        const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(',');

        // Fetch video details
        const videosResponse = await fetch(
          `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${youtubeApiKey}`
        );
        const videosData = await videosResponse.json();

        if (videosData.items) {
          allVideos = allVideos.concat(videosData.items);
        }
      }

      nextPageToken = playlistData.nextPageToken || null;
    } while (nextPageToken);

    console.log(`Found ${allVideos.length} videos`);

    // Sync videos to database
    const syncedVideos = [];
    for (const ytVideo of allVideos) {
      const video = await prisma.video.upsert({
        where: { youtubeId: ytVideo.id },
        update: {
          title: ytVideo.snippet.title,
          description: ytVideo.snippet.description,
          thumbnailUrl: ytVideo.snippet.thumbnails.high.url,
          duration: parseDuration(ytVideo.contentDetails.duration),
          publishedAt: new Date(ytVideo.snippet.publishedAt),
          viewCount: parseInt(ytVideo.statistics.viewCount || '0'),
          lastSyncedAt: new Date(),
        },
        create: {
          youtubeId: ytVideo.id,
          tenantId: dbUser.tenantId,
          title: ytVideo.snippet.title,
          description: ytVideo.snippet.description,
          thumbnailUrl: ytVideo.snippet.thumbnails.high.url,
          duration: parseDuration(ytVideo.contentDetails.duration),
          publishedAt: new Date(ytVideo.snippet.publishedAt),
          viewCount: parseInt(ytVideo.statistics.viewCount || '0'),
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });
      syncedVideos.push(video);
    }

    return NextResponse.json({
      success: true,
      synced: syncedVideos.length,
      videos: syncedVideos,
    });
  } catch (error: any) {
    console.error('YouTube sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync videos' },
      { status: 500 }
    );
  }
}
