'use client';

import { Card, CardContent, Badge } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';

interface Anomaly {
  type: string;
  severity: 'high' | 'medium' | 'low';
  finding: string;
  metric: string;
}
interface Result {
  anomalies: Anomaly[];
}

const sev: Record<string, string> = {
  high: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

export default function AnomaliesPage() {
  return (
    <AiToolShell title="Anomaly Detection" description="Flag unusual patterns — decline clusters, pending backlogs, recent activity swings.">
      <AiInsightRunner<Result>
        endpoint="/api/ai/anomalies"
        runLabel="Scan for anomalies"
        render={(data) => (
          <div className="space-y-3">
            {data.anomalies.length === 0 && <p className="text-sm text-gray-400">No anomalies detected — the book looks normal.</p>}
            {data.anomalies.map((a, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={sev[a.severity] || sev.low}>{a.severity}</Badge>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{a.type}</h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{a.finding}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{a.metric}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      />
    </AiToolShell>
  );
}
