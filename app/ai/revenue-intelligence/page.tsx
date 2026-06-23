'use client';

import { Card, CardContent, Badge } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';

interface Finding {
  category: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dollarImpact: number;
  actionLabel: string;
}
interface Result {
  findings: Finding[];
}

const sev: Record<string, string> = {
  high: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

export default function RevenueIntelligencePage() {
  return (
    <AiToolShell title="Revenue Intelligence" description="Surface the highest-impact findings across the book — stalled deals, concentration risk, missing premium.">
      <AiInsightRunner<Result>
        endpoint="/api/ai/revenue-intelligence"
        runLabel="Analyze book"
        render={(data) => (
          <div className="space-y-3">
            {data.findings.length === 0 && <p className="text-sm text-gray-400">No findings.</p>}
            {data.findings.map((f, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={sev[f.severity] || sev.low}>{f.severity}</Badge>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{f.title}</h3>
                    {f.dollarImpact > 0 && (
                      <span className="ml-auto text-sm font-medium text-gray-700 dark:text-gray-200">${Math.round(f.dollarImpact).toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{f.description}</p>
                  {f.actionLabel && <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">→ {f.actionLabel}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      />
    </AiToolShell>
  );
}
