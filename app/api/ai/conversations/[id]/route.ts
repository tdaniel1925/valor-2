import { NextRequest, NextResponse } from 'next/server';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';
import {
  getConversation,
  renameConversation,
  setPinned,
  deleteConversation,
} from '@/lib/ai/conversations';

/** GET /api/ai/conversations/[id] — load a conversation's messages. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;
    const { id } = await params;
    const conversation = await getConversation(ctx.tenantId, ctx.userId, id);
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    return NextResponse.json({ conversation });
  } catch (error) {
    return aiErrorResponse(error, 'Failed to load conversation');
  }
}

/** PATCH /api/ai/conversations/[id] — rename or pin/unpin. Body: { title? , pinned? } */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;
    const { id } = await params;
    const body = await request.json();
    if (typeof body.title === 'string' && body.title.trim()) {
      await renameConversation(ctx.tenantId, ctx.userId, id, body.title.trim());
    }
    if (typeof body.pinned === 'boolean') {
      await setPinned(ctx.tenantId, ctx.userId, id, body.pinned);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return aiErrorResponse(error, 'Failed to update conversation');
  }
}

/** DELETE /api/ai/conversations/[id] */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;
    const { id } = await params;
    await deleteConversation(ctx.tenantId, ctx.userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return aiErrorResponse(error, 'Failed to delete conversation');
  }
}
