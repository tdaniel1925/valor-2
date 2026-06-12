import { NextRequest, NextResponse } from 'next/server';
import { requireDbUser, authErrorStatus } from '@/lib/learning/access';
import { resolveLessonContext, applyHeartbeat } from '@/lib/learning/progress';

/**
 * POST /api/learning/progress — playback heartbeat from the no-skip player.
 * Body: { lessonId: string, positionSeconds: number }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireDbUser(request);
    const body = await request.json();

    const lessonId = typeof body.lessonId === 'string' ? body.lessonId : '';
    const positionSeconds = Number(body.positionSeconds);
    if (!lessonId || !Number.isFinite(positionSeconds) || positionSeconds < 0) {
      return NextResponse.json({ error: 'lessonId and positionSeconds are required' }, { status: 400 });
    }

    const ctx = await resolveLessonContext(user, lessonId);
    if (ctx === 'not_found') return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    if (ctx === 'no_access') return NextResponse.json({ error: 'You do not have access to this course' }, { status: 403 });
    if (ctx === 'lesson_locked') {
      return NextResponse.json({ error: 'Complete the previous lesson first' }, { status: 403 });
    }

    const result = await applyHeartbeat(ctx, positionSeconds);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[LEARNING] progress heartbeat error:', error);
    const message = error instanceof Error ? error.message : 'Failed to record progress';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
