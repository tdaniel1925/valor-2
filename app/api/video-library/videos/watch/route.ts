import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const { videoId, watchedSeconds, completed } = await request.json();

    if (!videoId || watchedSeconds === undefined) {
      return NextResponse.json(
        { error: 'Video ID and watched seconds required' },
        { status: 400 }
      );
    }

    // Verify video exists and belongs to tenant
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        tenantId: dbUser.tenantId,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Upsert watch history
    const watchHistory = await prisma.videoWatchHistory.upsert({
      where: {
        videoId_userId: {
          videoId,
          userId: user.id,
        },
      },
      update: {
        watchedSeconds,
        completed: completed || false,
        lastWatchedAt: new Date(),
      },
      create: {
        videoId,
        userId: user.id,
        tenantId: dbUser.tenantId,
        watchedSeconds,
        completed: completed || false,
      },
    });

    return NextResponse.json({ success: true, watchHistory });
  } catch (error: any) {
    console.error('Watch history error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
