import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText } from '@/lib/ai/claude';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { valorTools } from '@/lib/ai/tools';
import { executeValorTool } from '@/lib/ai/tool-executor';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';
import { resolveSelfAdvisor } from '@/lib/ai/valor-data-adapter';
import {
  createConversation,
  getConversation,
  appendMessage,
  renameConversation,
  generateTitle,
  getMemoryBlock,
  updateMemory,
} from '@/lib/ai/conversations';
import type Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const MAX_TOOL_ROUNDS = 5;

/**
 * POST /api/ai/chat — conversation-aware assistant over the book of business.
 * Body: { message: string, conversationId?: string }
 * - Creates a conversation if none given; loads prior turns from the DB.
 * - Injects cross-chat memory; persists both messages; auto-titles first turn;
 *   updates memory after the exchange.
 * Returns: { response, conversationId, title? }
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

    // Resolve (or create) the conversation and load its prior turns.
    let conversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
    let priorMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    let isFirstTurn = false;

    if (conversationId) {
      const existing = await getConversation(ctx.tenantId, ctx.userId, conversationId);
      if (!existing) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      priorMessages = existing.messages;
      isFirstTurn = existing.messages.length === 0;
    } else {
      const created = await createConversation(ctx.tenantId, ctx.userId);
      conversationId = created.id;
      isFirstTurn = true;
    }

    await appendMessage(conversationId, 'user', message);

    // Identity: tell the model WHO is asking so "my/I/me" scopes to this user's
    // own book of business without needing to ask for their name.
    const self = await resolveSelfAdvisor(ctx.tenantId, ctx.email);
    const identityBlock = self.primaryName
      ? `\n\nWHO YOU ARE TALKING TO: the signed-in user is **${self.primaryName}**${
          self.names.length > 1 ? ` (also: ${self.names.slice(1).join(', ')})` : ''
        }. When they say "my", "I", "me", or "mine", they mean policies/production written under that advisor name. Use it directly — never ask them who they are.`
      : `\n\nWHO YOU ARE TALKING TO: the signed-in user (${ctx.email || 'unknown email'}) has no matching writing-advisor record in the book, so they have no personal policies. If they ask about "my policies", explain they aren't listed as a writing advisor and offer agency-wide data instead — do not ask them to provide a name.`;

    const memoryBlock = await getMemoryBlock(ctx.tenantId, ctx.userId);
    const system = CHAT_SYSTEM_PROMPT + identityBlock + memoryBlock;

    const messages: Anthropic.MessageParam[] = [
      ...priorMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    let finalText = '';
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 1500,
        system,
        tools: valorTools,
        messages,
      });

      const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');

      if (toolUses.length === 0 || response.stop_reason !== 'tool_use') {
        finalText = messageText(response);
        break;
      }

      messages.push({ role: 'assistant', content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        const result = await executeValorTool(tu.name, (tu.input ?? {}) as Record<string, unknown>, ctx.scope);
        toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
      }
      messages.push({ role: 'user', content: toolResults });

      if (round === MAX_TOOL_ROUNDS - 1) {
        const closing = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: 1500,
          system,
          messages,
        });
        finalText = messageText(closing);
      }
    }

    finalText = finalText || 'I could not produce an answer.';
    await appendMessage(conversationId, 'assistant', finalText);

    // Auto-title on the first turn.
    let title: string | undefined;
    if (isFirstTurn) {
      title = await generateTitle(message);
      await renameConversation(ctx.tenantId, ctx.userId, conversationId, title);
    }

    // Best-effort cross-chat memory update (does not block the response).
    void updateMemory(ctx.tenantId, ctx.userId, [
      ...priorMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: finalText },
    ]);

    return NextResponse.json({ response: finalText, conversationId, title });
  } catch (error) {
    return aiErrorResponse(error, 'Chat request failed');
  }
}
