import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/db/prisma';
import { FALLBACK_UNLOCK_MESSAGE, authErrorStatus } from '@/lib/learning/access';

/** GET /api/learning/settings — admin read tenant training settings */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const settings = await prisma.trainingSettings.findUnique({
      where: { tenantId: admin.tenantId },
      select: { defaultUnlockMessage: true, updatedAt: true },
    });
    return NextResponse.json({
      settings: settings ?? { defaultUnlockMessage: FALLBACK_UNLOCK_MESSAGE, updatedAt: null },
    });
  } catch (error: unknown) {
    console.error('[LEARNING] get settings error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load settings';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}

/** PUT /api/learning/settings — admin upsert default unlock message */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const message = typeof body.defaultUnlockMessage === 'string' ? body.defaultUnlockMessage.trim() : '';
    if (!message) {
      return NextResponse.json({ error: 'defaultUnlockMessage is required' }, { status: 400 });
    }
    if (message.length > 500) {
      return NextResponse.json({ error: 'Message must be 500 characters or fewer' }, { status: 400 });
    }

    const settings = await prisma.trainingSettings.upsert({
      where: { tenantId: admin.tenantId },
      update: { defaultUnlockMessage: message },
      create: { tenantId: admin.tenantId, defaultUnlockMessage: message },
      select: { defaultUnlockMessage: true, updatedAt: true },
    });

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    console.error('[LEARNING] update settings error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update settings';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
