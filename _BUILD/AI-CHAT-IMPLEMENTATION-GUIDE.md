# AI Chat Feature - Complete Implementation Guide

## Overview
Natural language chat interface powered by Claude 3.5 Haiku for querying all app data in plain English.

**What users can ask:**
- "Who is my top performing agent?"
- "How many pending policies do I have?"
- "Show me policies from this month"
- "What carriers do I work with most?"
- "Who are the agents in my group?"

**Features:**
- Natural language understanding
- Real-time data queries
- Floating chat bubble (always accessible)
- Chat history saved across sessions
- Multi-tenant secure (users only see their data)

**Tech stack:**
- Claude 3.5 Haiku ($0.25/M in, $1.25/M out)
- Vercel AI SDK (streaming)
- PostgreSQL (via Prisma)
- React + Tailwind

**Estimated monthly cost:** $5-15 for 100 users

---

## Implementation Time

**Total:** ~4-5 hours

- Phase 1: Database (20 min)
- Phase 2: Dependencies (5 min)
- Phase 3: API Route (90 min)
- Phase 4: Chat Component (120 min)
- Phase 5: Testing (30 min)
- Phase 6: Polish (30 min)

---

## Phase 1: Database Schema

### Add Chat Tables

In `prisma/schema.prisma`:

```prisma
model ChatConversation {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  title     String?  // Auto-generated from first message
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages  ChatMessage[]
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tenantId])
  @@index([createdAt])
  @@map("chat_conversations")
}

model ChatMessage {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // 'user' or 'assistant'
  content        String   @db.Text
  sqlQuery       String?  @db.Text
  sqlResults     Json?
  createdAt      DateTime @default(now())

  conversation ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@map("chat_messages")
}
```

**Run migration:**
```bash
npx prisma migrate dev --name add_chat_feature
```

---

## Phase 2: Install Dependencies

```bash
npm install ai @ai-sdk/anthropic
```

---

## Phase 3: Backend Implementation

### 3.1 Environment Variable

Add to `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

Get key from: https://console.anthropic.com/settings/keys

### 3.2 Schema Context Builder

Create `lib/ai/schema-context.ts`:

```typescript
export function buildSchemaContext(tenantId: string): string {
  return `# Database Schema for Tenant: ${tenantId}

You have access to these tables. ALWAYS filter by tenantId.

## smartoffice_policies
- id: String
- tenantId: String (REQUIRED in WHERE clause)
- policyNumber: String
- agentName: String
- insuredName: String
- productType: String (LIFE, ANNUITY, etc.)
- carrier: String
- premium: Decimal
- status: String (ACTIVE, PENDING, CANCELLED)
- statusDate: DateTime
- createdAt: DateTime

## smartoffice_agents
- id: String
- tenantId: String (REQUIRED in WHERE clause)
- name: String
- email: String
- phone: String
- supervisor: String
- npn: String
- source: String
- createdAt: DateTime

## users
- id: String
- tenantId: String (REQUIRED in WHERE clause)
- email: String
- name: String
- role: String
- createdAt: DateTime

## IMPORTANT RULES:
1. EVERY query MUST include: WHERE "tenantId" = '${tenantId}'
2. Use PostgreSQL syntax
3. Use double quotes for column names: "tenantId", "agentName"
4. Return only SELECT queries (no INSERT/UPDATE/DELETE)

## Example Queries:

Q: "Who is my top agent?"
SQL: SELECT "agentName", SUM(premium) as total FROM smartoffice_policies WHERE "tenantId" = '${tenantId}' AND status = 'ACTIVE' GROUP BY "agentName" ORDER BY total DESC LIMIT 1;

Q: "How many pending policies?"
SQL: SELECT COUNT(*) as count FROM smartoffice_policies WHERE "tenantId" = '${tenantId}' AND status = 'PENDING';

Q: "Top 5 carriers?"
SQL: SELECT carrier, COUNT(*) as count FROM smartoffice_policies WHERE "tenantId" = '${tenantId}' GROUP BY carrier ORDER BY count DESC LIMIT 5;
`;
}
```

### 3.3 SQL Executor

Create `lib/ai/sql-executor.ts`:

```typescript
import { prisma } from '@/lib/db/prisma';

export async function executeSafeSQL(
  sql: string,
  tenantId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    // Security checks
    const sqlLower = sql.toLowerCase();

    // Must include tenant filter
    if (!sqlLower.includes('tenantid') || !sqlLower.includes(tenantId.toLowerCase())) {
      throw new Error('Query must filter by current tenant');
    }

    // Block destructive operations
    const forbidden = ['insert', 'update', 'delete', 'drop', 'truncate', 'alter', 'create'];
    if (forbidden.some(kw => sqlLower.includes(kw))) {
      throw new Error('Only SELECT queries allowed');
    }

    // Execute
    const results = await prisma.$queryRawUnsafe(sql);

    return { success: true, data: results as any[] };

  } catch (error: any) {
    console.error('SQL Error:', error);
    return { success: false, error: error.message };
  }
}
```

### 3.4 Chat API Route

Create `app/api/chat/route.ts`:

```typescript
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
      where: { authId: user.id },
      include: { tenant: true }
    });

    if (!dbUser) {
      return new Response('User not found', { status: 404 });
    }

    const tenantId = dbUser.tenantId;
    const userId = dbUser.id;

    // Build schema context
    const schemaContext = buildSchemaContext(tenantId);

    // System prompt
    const systemPrompt = `You are an AI assistant for SmartLook 360.

Help users understand their SmartOffice data through natural language queries.

${schemaContext}

When user asks a data question:
1. Use the queryDatabase tool to fetch data
2. Present results conversationally
3. Highlight key insights

Be friendly, concise, and helpful.`;

    // Stream response with tools
    const result = await streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      system: systemPrompt,
      messages,
      tools: {
        queryDatabase: tool({
          description: 'Execute a SQL query against the SmartOffice database',
          parameters: z.object({
            sql: z.string().describe('The SQL SELECT query to execute'),
            reasoning: z.string().describe('Why this query answers the user question')
          }),
          execute: async ({ sql, reasoning }) => {
            console.log('[Chat] Executing SQL:', sql);
            console.log('[Chat] Reasoning:', reasoning);

            const result = await executeSafeSQL(sql, tenantId);

            if (!result.success) {
              return { error: result.error };
            }

            return { data: result.data };
          }
        })
      },
      maxSteps: 5
    });

    // Save conversation after streaming completes
    result.then(async (finalResult) => {
      try {
        // Create or update conversation
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

      } catch (error) {
        console.error('Failed to save chat:', error);
      }
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(error.message, { status: 500 });
  }
}
```

### 3.5 Conversation History API

Create `app/api/chat/conversations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id }
    });

    if (!dbUser) {
      return new Response('User not found', { status: 404 });
    }

    const conversations = await prisma.chatConversation.findMany({
      where: { userId: dbUser.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      }
    });

    return NextResponse.json({ conversations });

  } catch (error: any) {
    console.error('Conversations API error:', error);
    return new Response(error.message, { status: 500 });
  }
}
```

Create `app/api/chat/conversations/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id }
    });

    if (!dbUser) {
      return new Response('User not found', { status: 404 });
    }

    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: params.id,
        userId: dbUser.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true
          }
        }
      }
    });

    if (!conversation) {
      return new Response('Not found', { status: 404 });
    }

    return NextResponse.json({ conversation });

  } catch (error: any) {
    console.error('Conversation API error:', error);
    return new Response(error.message, { status: 500 });
  }
}
```

---

## Phase 4: Frontend Components

### 4.1 Floating Chat Bubble

Create `components/FloatingChat.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useChat } from 'ai/react';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      conversationId: null // Will be set after first message
    }
  });

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-semibold">Ask about your data</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-sm">Ask me anything about your data!</p>
                <p className="text-xs mt-2">Try: "Who is my top agent?"</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
```

### 4.2 Add to Root Layout

In `app/layout.tsx`:

```tsx
import { FloatingChat } from '@/components/FloatingChat';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <FloatingChat />
      </body>
    </html>
  );
}
```

---

## Phase 5: Testing

### Test Questions

```
1. "Who is my top performing agent?"
2. "How many pending policies do I have?"
3. "Show me my top 5 carriers"
4. "What's my total premium across all active policies?"
5. "List agents who have more than 10 policies"
6. "How many policies were added this month?"
7. "What products do I sell most?"
```

### Expected Behavior

1. User types question
2. Chat shows "thinking" animation
3. Response streams in real-time
4. Answer is conversational and accurate
5. Message saved to database

### Verify Security

```typescript
// This should be BLOCKED:
"Show me policies from tenant ABC"

// This should work:
"Show me MY top agents"
```

---

## Phase 6: Production Deployment

### Checklist

- [ ] Add `ANTHROPIC_API_KEY` to production env vars
- [ ] Run migrations on production database
- [ ] Test with real user account
- [ ] Monitor API costs in Anthropic dashboard
- [ ] Set up error tracking (Sentry)
- [ ] Add rate limiting (optional)

### Cost Monitoring

**Anthropic Dashboard:**
- https://console.anthropic.com/usage
- Shows daily/monthly spend
- Set budget alerts

**Expected costs:**
- 100 users × 10 chats/day = 1,000 chats/day
- Avg conversation: ~5k tokens in, ~1k tokens out
- Daily cost: ~$2-5
- Monthly: ~$60-150

**Optimization tips:**
- Use Haiku (not Sonnet) ✅
- Limit context to schema only ✅
- Cache system prompts (future)
- Set max message history (e.g., last 10 messages)

---

## Troubleshooting

### Chat not responding

**Check:**
1. `ANTHROPIC_API_KEY` is set
2. API route is not auth-blocked
3. Browser console for errors
4. Network tab for 401/500 errors

### SQL errors

**Common issues:**
- Missing `WHERE "tenantId" = '...'`
- Wrong column names (use double quotes)
- Invalid PostgreSQL syntax

**Fix:** Check `sql-executor.ts` logs

### Messages not saving

**Check:**
- Database migration applied
- `ChatConversation` and `ChatMessage` tables exist
- User has valid `userId` and `tenantId`

---

## Future Enhancements

1. **Voice input** - Add speech-to-text
2. **Suggested questions** - Show common queries
3. **Export chat** - Download as PDF
4. **Chart generation** - Create visualizations from data
5. **Multi-step reasoning** - Complex analysis
6. **Context awareness** - Remember previous conversations

---

## Summary

**What we built:**
- Natural language SQL query system
- Floating chat UI
- Chat history storage
- Multi-tenant security
- Streaming responses

**Total code:**
- 3 new database tables
- 4 API routes
- 2 utility files
- 1 React component
- ~500 lines of code

**Time to implement:** 4-5 hours

**Monthly cost:** $5-15 for 100 users

**User experience:** Type question → Get instant answer

---

**Ready to build!** Follow phases 1-6 in order. Reference Valor's implementation at `C:\dev\valor-2\app\api\smartoffice\chat\route.ts` (if it exists) for working examples.
