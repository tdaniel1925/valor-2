'use client';

import { Card, CardContent } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';

interface Benchmark {
  summary: string;
  vsMedian: string;
  percentileNote: string;
  suggestions: string[];
}
interface Result {
  benchmark: Benchmark | null;
}

export default function BenchmarkingPage() {
  return (
    <AiToolShell title="Benchmarking" description="Compare an advisor against the team on premium, volume, and product diversity. Leave blank for a team overview.">
      <AiInsightRunner<Result>
        endpoint="/api/ai/benchmarking"
        method="POST"
        inputLabel="Advisor name (optional)"
        inputPlaceholder="e.g. Theodore Pappas — or leave blank for team"
        buildBody={(advisor) => (advisor ? { advisor } : {})}
        runLabel="Benchmark"
        render={({ benchmark }) =>
          benchmark ? (
            <Card><CardContent className="p-4 space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-200">{benchmark.summary}</p>
              <p className="text-sm"><span className="font-medium text-gray-500 dark:text-gray-400">vs median:</span> {benchmark.vsMedian}</p>
              <p className="text-sm"><span className="font-medium text-gray-500 dark:text-gray-400">Percentile:</span> {benchmark.percentileNote}</p>
              {benchmark.suggestions?.length > 0 && (
                <ul className="text-sm text-gray-700 dark:text-gray-200 list-disc ml-4 space-y-1 pt-1">{benchmark.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
              )}
            </CardContent></Card>
          ) : (
            <p className="text-sm text-gray-400">No benchmark produced.</p>
          )
        }
      />
    </AiToolShell>
  );
}
