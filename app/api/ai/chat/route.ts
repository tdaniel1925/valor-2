import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText } from '@/lib/ai/claude';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { valorTools } from '@/lib/ai/tools';
import { executeValorTool } from '@/lib/ai/tool-executor';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';
import type Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const MAX_TOOL_ROUNDS = 5;

/**
 * POST /api/ai/chat — natural-language assistant over the book of business.
 * Uses Claude tool-use (safe typed executor) — replaces the eval()-based
 * /api/smartoffice/chat path. Body: { message: string, history?: {role,content}[] }
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const history: Anthropic.MessageParam[] = Array.isArray(body.history)
      ? body.history
          .filter((m: unknown): m is { role: string; content: string } =>
            Boolean(m && typeof (m as { content?: unknown }).content === 'string')
          )
          .slice(-10)
          .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      : [];

    const messages: Anthropic.MessageParam[] = [...history, { role: 'user', content: message }];

    let finalText = '';
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 1500,
        system: CHAT_SYSTEM_PROMPT,
        tools: valorTools,
        messages,
      });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );

      if (toolUses.length === 0 || response.stop_reason !== 'tool_use') {
        finalText = messageText(response);
        break;
      }

      // Run each requested tool with the server-trusted tenantId.
      messages.push({ role: 'assistant', content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        const result = await executeValorTool(
          tu.name,
          (tu.input ?? {}) as Record<string, unknown>,
          ctx.tenantId
        );
        toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
      }
      messages.push({ role: 'user', content: toolResults });

      if (round === MAX_TOOL_ROUNDS - 1) {
        // Final round: get a closing answer without more tools.
        const closing = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: 1500,
          system: CHAT_SYSTEM_PROMPT,
          messages,
        });
        finalText = messageText(closing);
      }
    }

    return NextResponse.json({ response: finalText || 'I could not produce an answer.' });
  } catch (error) {
    return aiErrorResponse(error, 'Chat request failed');
  }
}
