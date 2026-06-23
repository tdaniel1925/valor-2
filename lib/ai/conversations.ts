/**
 * AI Assistant conversation persistence — ChatGPT-style threads, plus a
 * lightweight cross-chat memory of durable facts.
 *
 * Tenant-scoped at the API layer: every function takes (tenantId, userId) and
 * filters on them. Tables have RLS disabled (see scripts/ai-tools-schema.sql).
 */

import { prisma } from '@/lib/db/prisma';
import { anthropic, AI_MODEL, messageText } from '@/lib/ai/claude';

export interface ConversationSummary {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------------
// Conversations

export async function listConversations(tenantId: string, userId: string): Promise<ConversationSummary[]> {
  const rows = await prisma.aiConversation.findMany({
    where: { tenantId, userId, archived: false },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    select: { id: true, title: true, pinned: true, updatedAt: true },
    take: 100,
  });
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
}

export async function createConversation(tenantId: string, userId: string): Promise<ConversationSummary> {
  const c = await prisma.aiConversation.create({
    data: { tenantId, userId, title: 'New chat' },
    select: { id: true, title: true, pinned: true, updatedAt: true },
  });
  return { ...c, updatedAt: c.updatedAt.toISOString() };
}

/** Load a conversation's messages, verifying ownership. Returns null if not found/owned. */
export async function getConversation(
  tenantId: string,
  userId: string,
  conversationId: string
): Promise<{ id: string; title: string; pinned: boolean; messages: ConversationMessage[] } | null> {
  const c = await prisma.aiConversation.findFirst({
    where: { id: conversationId, tenantId, userId },
    select: {
      id: true,
      title: true,
      pinned: true,
      messages: { orderBy: { createdAt: 'asc' }, select: { role: true, content: true } },
    },
  });
  if (!c) return null;
  return {
    id: c.id,
    title: c.title,
    pinned: c.pinned,
    messages: c.messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
  };
}

export async function ownsConversation(tenantId: string, userId: string, conversationId: string): Promise<boolean> {
  const c = await prisma.aiConversation.findFirst({
    where: { id: conversationId, tenantId, userId },
    select: { id: true },
  });
  return Boolean(c);
}

export async function appendMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
  await prisma.aiMessage.create({ data: { conversationId, role, content } });
  await prisma.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
}

export async function renameConversation(tenantId: string, userId: string, conversationId: string, title: string) {
  await prisma.aiConversation.updateMany({
    where: { id: conversationId, tenantId, userId },
    data: { title: title.slice(0, 120) },
  });
}

export async function setPinned(tenantId: string, userId: string, conversationId: string, pinned: boolean) {
  await prisma.aiConversation.updateMany({
    where: { id: conversationId, tenantId, userId },
    data: { pinned },
  });
}

export async function deleteConversation(tenantId: string, userId: string, conversationId: string) {
  await prisma.aiConversation.deleteMany({ where: { id: conversationId, tenantId, userId } });
}

/** Generate a short title from the first user message (best-effort; falls back to a slice). */
export async function generateTitle(firstMessage: string): Promise<string> {
  const fallback = firstMessage.replace(/\s+/g, ' ').trim().slice(0, 48) || 'New chat';
  try {
    const r = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 24,
      system: 'Generate a 3-6 word title for a chat that starts with the user message. Reply with ONLY the title, no quotes or punctuation at the end.',
      messages: [{ role: 'user', content: firstMessage.slice(0, 500) }],
    });
    const title = messageText(r).replace(/^["']|["']$/g, '').trim();
    return title ? title.slice(0, 60) : fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Cross-chat memory (durable facts about the user / their book)

/** Return memory facts as a compact block to inject into the system prompt. */
export async function getMemoryBlock(tenantId: string, userId: string): Promise<string> {
  const rows = await prisma.aiChatMemory.findMany({
    where: { tenantId, userId },
    orderBy: { updatedAt: 'desc' },
    select: { value: true },
    take: 30,
  });
  if (rows.length === 0) return '';
  return (
    '\n\nWHAT YOU REMEMBER ABOUT THIS USER (from past chats — use when relevant):\n' +
    rows.map((r) => `- ${r.value}`).join('\n')
  );
}

/**
 * After a chat exchange, extract durable facts worth remembering across chats
 * and upsert them. Best-effort; never throws into the request path.
 */
export async function updateMemory(
  tenantId: string,
  userId: string,
  recentMessages: ConversationMessage[]
): Promise<void> {
  try {
    const transcript = recentMessages
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')
      .slice(0, 3000);

    const r = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 300,
      system:
        'Extract 0-3 durable facts worth remembering about this user or their insurance book across future chats (preferences, focus areas, named people/carriers they care about). Skip transient/one-off details. Reply with ONLY a JSON array of short strings, e.g. ["focuses on annuity cross-sell"]. Empty array if nothing durable.',
      messages: [{ role: 'user', content: transcript }],
    });
    const text = messageText(r);
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return;
    const facts: unknown = JSON.parse(match[0]);
    if (!Array.isArray(facts)) return;

    for (const fact of facts.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).slice(0, 3)) {
      const key = fact.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'fact';
      await prisma.aiChatMemory.upsert({
        where: { tenantId_userId_key: { tenantId, userId, key } },
        update: { value: fact.slice(0, 300) },
        create: { tenantId, userId, key, value: fact.slice(0, 300) },
      });
    }
  } catch {
    /* memory is best-effort */
  }
}
