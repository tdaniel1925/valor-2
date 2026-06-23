'use client';

import { Card, CardContent, Badge } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';

interface Opportunity {
  advisor: string;
  opportunity: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}
interface Result {
  opportunities: Opportunity[];
  note?: string;
}

const pri: Record<string, string> = {
  high: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

export default function CrossSellPage() {
  return (
    <AiToolShell title="Cross-Sell Opportunities" description="Find advisors concentrated in one product type who could write adjacent products.">
      <AiInsightRunner<Result>
        endpoint="/api/ai/cross-sell"
        runLabel="Find opportunities"
        render={(data) => (
          <div className="space-y-3">
            {data.note && <p className="text-sm text-gray-400">{data.note}</p>}
            {data.opportunities.map((o, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={pri[o.priority] || pri.low}>{o.priority}</Badge>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{o.advisor}</h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{o.opportunity}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{o.rationale}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      />
    </AiToolShell>
  );
}
