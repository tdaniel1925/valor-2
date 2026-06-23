'use client';

import { useState, ReactNode } from 'react';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { Sparkles } from 'lucide-react';
import { AiError } from '@/components/ai/AiToolShell';

interface AiInsightRunnerProps<T> {
  /** API endpoint to call. */
  endpoint: string;
  method?: 'GET' | 'POST';
  /** Optional single text input (e.g. an advisor name or request). */
  inputLabel?: string;
  inputPlaceholder?: string;
  /** Maps the text input into the POST body. */
  buildBody?: (value: string) => Record<string, unknown>;
  runLabel: string;
  /** Renders the successful result. */
  render: (data: T) => ReactNode;
  /** Require the input to be non-empty before running. */
  requireInput?: boolean;
}

export default function AiInsightRunner<T>({
  endpoint,
  method = 'GET',
  inputLabel,
  inputPlaceholder,
  buildBody,
  runLabel,
  render,
  requireInput,
}: AiInsightRunnerProps<T>) {
  const [value, setValue] = useState('');
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (requireInput && !value.trim()) {
      setError(`${inputLabel || 'Input'} is required.`);
      return;
    }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const init: RequestInit = { method };
      if (method === 'POST') {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = JSON.stringify(buildBody ? buildBody(value.trim()) : {});
      }
      const res = await fetch(endpoint, init);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setData(json as T);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          {inputLabel && (
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{inputLabel}</label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run()}
                placeholder={inputPlaceholder}
              />
            </div>
          )}
          <Button onClick={run} disabled={loading} className="sm:w-auto">
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? 'Working…' : runLabel}
          </Button>
        </CardContent>
      </Card>

      {error && <AiError message={error} />}
      {data && render(data)}
    </div>
  );
}
