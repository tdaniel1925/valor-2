'use client';

import { useRef, useState } from 'react';
import { Button, Card, CardContent } from '@/components/ui';
import { Send } from 'lucide-react';
import AiToolShell from '@/components/ai/AiToolShell';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError('');
    const history = messages.slice();
    const next = [...history, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Chat failed');
      setMessages((m) => [...m, { role: 'assistant', content: json.response }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
    } finally {
      setLoading(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  };

  return (
    <AiToolShell
      title="AI Assistant"
      description="Ask anything about the agency's book of business — policies, premium, advisors, carriers."
    >
      <Card className="flex flex-col h-[60vh]">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
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
                className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-gray-400">Thinking…</div>}
          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
          <div ref={endRef} />
        </CardContent>
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
      </Card>
    </AiToolShell>
  );
}
