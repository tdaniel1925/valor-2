import { NextRequest } from 'next/server';
import { streamText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { buildSchemaContext } from '@/lib/ai/schema-context';
import { executeSafeSQL } from '@/lib/ai/sql-executor';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId } = await request.json();

    // Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user + tenant
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true }
    });

    if (!dbUser) {
      return new Response('User not found', { status: 404 });
    }

    const tenantId = dbUser.tenantId;
    const userId = dbUser.id;

    console.log(`[Chat] User: ${dbUser.email}, Tenant: ${tenantId}`);

    // Build schema context
    const schemaContext = buildSchemaContext(tenantId);

    // System prompt
    const systemPrompt = `You are an AI assistant for Valor Financial Specialists' back office platform.

Help users understand their SmartOffice data through natural language queries.

${schemaContext}

When user asks a data question:
1. Use the queryDatabase tool to fetch data
2. Present results conversationally and concisely
3. Highlight key insights

Be friendly, helpful, and professional. Answer in 2-3 sentences when possible.`;

    // Stream response with tools
    const result = await streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      system: systemPrompt,
      messages,
      tools: {
        queryDatabase: tool({
          description: 'Execute a SQL query against the SmartOffice database to fetch data',
          parameters: z.object({
            sql: z.string().describe('The SQL SELECT query to execute'),
            reasoning: z.string().describe('Why this query answers the user question')
          }),
          execute: async ({ sql, reasoning }) => {
            console.log('[Chat] Query reasoning:', reasoning);
            console.log('[Chat] Executing SQL:', sql);

            const result = await executeSafeSQL(sql, tenantId);

            if (!result.success) {
              return { error: result.error };
            }

            console.log('[Chat] Query successful, rows:', result.data?.length || 0);
            return { data: result.data };
          }
        })
      },
      maxSteps: 5
    });

    // Save conversation after streaming completes
    result.then(async (finalResult) => {
      try {
        // Create or find conversation
        let conversation;
        if (conversationId) {
          conversation = await prisma.chatConversation.findUnique({
            where: { id: conversationId }
          });
        }

        if (!conversation) {
          // Auto-generate title from first user message
          const firstUserMsg = messages.find((m: any) => m.role === 'user');
          const title = firstUserMsg?.content.slice(0, 100) || 'New Conversation';

          conversation = await prisma.chatConversation.create({
            data: {
              userId,
              tenantId,
              title
            }
          });

          console.log('[Chat] Created conversation:', conversation.id);
        }

        // Save messages
        const lastUserMsg = messages[messages.length - 1];
        if (lastUserMsg?.role === 'user') {
          await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'user',
              content: lastUserMsg.content
            }
          });
        }

        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: finalResult.text
          }
        });

        console.log('[Chat] Saved messages to conversation:', conversation.id);

      } catch (error) {
        console.error('[Chat] Failed to save conversation:', error);
      }
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error('[Chat] API error:', error);
    return new Response(error.message, { status: 500 });
  }
}
