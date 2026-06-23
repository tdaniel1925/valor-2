'use client';

import { Card, CardContent } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';

interface Analysis {
  summary: string;
  concentrationRisk: string;
  topCarriers: string[];
  recommendations: string[];
}
interface Result {
  carriers: { carrier: string; policyCount: number; commissionablePremium: number; advisors: number }[];
  analysis: Analysis | null;
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function CarrierIntelligencePage() {
  return (
    <AiToolShell title="Carrier Intelligence" description="Where the agency's premium is concentrated, over-reliance risk, and carriers worth growing.">
      <AiInsightRunner<Result>
        endpoint="/api/ai/carrier-intelligence"
        runLabel="Analyze carriers"
        render={({ carriers, analysis }) => (
          <div className="space-y-3">
            {analysis && (
              <Card><CardContent className="p-4 space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-200">{analysis.summary}</p>
                <p className="text-sm"><span className="font-medium text-amber-600 dark:text-amber-400">Concentration risk:</span> {analysis.concentrationRisk}</p>
                {analysis.recommendations?.length > 0 && (
                  <ul className="text-sm text-gray-700 dark:text-gray-200 list-disc ml-4 space-y-1">{analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                )}
              </CardContent></Card>
            )}
            <Card><CardContent className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="py-2 pr-4 font-medium">Carrier</th><th className="py-2 pr-4 font-medium">Policies</th><th className="py-2 pr-4 font-medium">Advisors</th><th className="py-2 font-medium">Commissionable</th>
                </tr></thead>
                <tbody>
                  {carriers.map((c) => (
                    <tr key={c.carrier} className="border-b border-gray-50 dark:border-gray-800/50">
                      <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">{c.carrier}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{c.policyCount}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{c.advisors}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-300">{money(c.commissionablePremium)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          </div>
        )}
      />
    </AiToolShell>
  );
}
