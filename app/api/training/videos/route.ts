import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // Fetch videos with categories
    const videos = await prisma.video.findMany({
      where: {
        tenantId: dbUser.tenantId,
        isActive: true,
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
      },
      orderBy: [
        { order: 'asc' },
        { publishedAt: 'desc' },
      ],
    });

    // Get watch history for current user
    const watchHistory = await prisma.videoWatchHistory.findMany({
      where: {
        userId: user.id,
        tenantId: dbUser.tenantId,
      },
      select: {
        videoId: true,
        watchedSeconds: true,
        completed: true,
      },
    });

    const watchMap = new Map(
      watchHistory.map((w) => [w.videoId, { watchedSeconds: w.watchedSeconds, completed: w.completed }])
    );

    // Merge watch data with videos
    const videosWithProgress = videos.map((video) => ({
      ...video,
      progress: watchMap.get(video.id),
    }));

    return NextResponse.json({ videos: videosWithProgress });
  } catch (error: any) {
    console.error('Fetch videos error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
