import { NextRequest, NextResponse } from 'next/server';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';
import { listConversations, createConversation } from '@/lib/ai/conversations';

/** GET /api/ai/conversations — list the user's chats (pinned first, then recent). */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;
    const conversations = await listConversations(ctx.tenantId, ctx.userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    return aiErrorResponse(error, 'Failed to load conversations');
  }
}

/** POST /api/ai/conversations — start a new (empty) chat. */
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;
    const conversation = await createConversation(ctx.tenantId, ctx.userId);
    return NextResponse.json({ conversation });
  } catch (error) {
    return aiErrorResponse(error, 'Failed to create conversation');
  }
}
