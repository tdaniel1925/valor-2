'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import {
  ArrowLeft,
  Send,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Pencil,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import FormattedMessage from '@/components/ai/FormattedMessage';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}
interface ConversationSummary {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
}

export default function AiChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/conversations');
      const json = await res.json();
      if (res.ok) setConversations(json.conversations ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setError('');
    try {
      const res = await fetch(`/api/ai/conversations/${id}`);
      const json = await res.json();
      if (res.ok) setMessages(json.conversation.messages ?? []);
    } catch {
      setError('Failed to load conversation.');
    }
  }, []);

  const newChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setInput('');
    setError('');
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId: activeId ?? undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Chat failed');
      setMessages((m) => [...m, { role: 'assistant', content: json.response }]);
      if (json.conversationId && json.conversationId !== activeId) setActiveId(json.conversationId);
      void refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
    } finally {
      setLoading(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  };

  const togglePin = async (c: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/ai/conversations/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !c.pinned }),
    });
    void refreshList();
  };

  const rename = async (c: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    const title = window.prompt('Rename chat', c.title);
    if (!title?.trim()) return;
    await fetch(`/api/ai/conversations/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() }),
    });
    void refreshList();
  };

  const remove = async (c: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    await fetch(`/api/ai/conversations/${c.id}`, { method: 'DELETE' });
    if (activeId === c.id) newChat();
    void refreshList();
  };

  const pinned = conversations.filter((c) => c.pinned);
  const recent = conversations.filter((c) => !c.pinned);

  const Row = ({ c }: { c: ConversationSummary }) => (
    <div
      onClick={() => openConversation(c.id)}
      className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-sm ${
        activeId === c.id
          ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
    >
      <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
      <span className="flex-1 truncate">{c.title}</span>
      <span className="hidden group-hover:flex items-center gap-1 shrink-0">
        <button onClick={(e) => togglePin(c, e)} title={c.pinned ? 'Unpin' : 'Pin'} className="p-0.5 hover:text-violet-600">
          {c.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
        <button onClick={(e) => rename(c, e)} title="Rename" className="p-0.5 hover:text-violet-600">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => remove(c, e)} title="Delete" className="p-0.5 hover:text-red-600">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  );

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <div className="flex flex-1 min-h-0 gap-4">
          {/* Conversation rail */}
          <div className="hidden md:flex flex-col w-64 shrink-0 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <Button onClick={newChat} className="w-full justify-center">
                <Plus className="h-4 w-4 mr-2" /> New chat
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {pinned.length > 0 && (
                <>
                  <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pinned</p>
                  {pinned.map((c) => (
                    <Row key={c.id} c={c} />
                  ))}
                  <p className="px-2.5 pt-3 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Recent</p>
                </>
              )}
              {recent.map((c) => (
                <Row key={c.id} c={c} />
              ))}
              {conversations.length === 0 && (
                <p className="px-2.5 py-3 text-xs text-gray-400">No chats yet. Start one on the right.</p>
              )}
            </div>
          </div>

          {/* Chat pane */}
          <div className="flex-1 min-w-0 flex flex-col border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {conversations.find((c) => c.id === activeId)?.title ?? 'AI Assistant'}
                </h1>
                <p className="text-xs text-gray-400 truncate">Ask about policies, premium, advisors, carriers.</p>
              </div>
              <Button onClick={newChat} variant="outline" size="sm" className="ml-auto md:hidden">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-gray-400 dark:text-gray-500 space-y-1">
                  <p>Try:</p>
                  <p>• &quot;How many inforce policies do we have?&quot;</p>
                  <p>• &quot;Who are our top 5 producers by commissionable premium?&quot;</p>
                  <p>• &quot;Show pending policies for Russ Oxendine&quot;</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div
                    className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm text-left ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white whitespace-pre-wrap'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {m.role === 'assistant' ? <FormattedMessage content={m.content} /> : m.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-sm text-gray-400">Thinking…</div>}
              {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
              <div ref={endRef} />
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 p-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask about your book of business…"
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <Button onClick={send} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
