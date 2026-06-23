'use client';

import { Card, CardContent, Badge } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';

interface SearchResult {
  intent: string;
  count: number;
  policies: {
    id: string;
    policyNumber: string;
    advisor: string;
    carrier: string;
    insured: string;
    status: string;
    commAnnualizedPrem: number;
  }[];
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function SmartSearchPage() {
  return (
    <AiToolShell title="Smart Search" description="Search policies in plain English — Claude translates it into a filtered query.">
      <AiInsightRunner<SearchResult>
        endpoint="/api/ai/search"
        method="POST"
        inputLabel="What are you looking for?"
        inputPlaceholder="e.g. pending annuities from American National over $10k"
        buildBody={(query) => ({ query })}
        runLabel="Search"
        requireInput
        render={(data) => (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {data.intent} — <span className="font-medium text-gray-700 dark:text-gray-200">{data.count} result{data.count === 1 ? '' : 's'}</span>
              </p>
              <div className="space-y-2">
                {data.policies.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 border-b border-gray-50 dark:border-gray-800/50 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{p.policyNumber} · {p.insured || '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.carrier} · {p.advisor}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{p.status}</Badge>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{money(p.commAnnualizedPrem)}</p>
                    </div>
                  </div>
                ))}
                {data.count === 0 && <p className="text-sm text-gray-400">No matching policies.</p>}
              </div>
            </CardContent>
          </Card>
        )}
      />
    </AiToolShell>
  );
}
