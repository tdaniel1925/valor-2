'use client';

import { Card, CardContent } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';

interface Plan {
  summary: string;
  strengths: string[];
  focusAreas: string[];
  actions: { action: string; why: string }[];
}
interface Result {
  profile: { advisor: string; policyCount: number; commissionablePremium: number };
  plan: Plan;
}

export default function AgentCoachPage() {
  return (
    <AiToolShell title="Agent Coach" description="Generate a practical coaching plan for an advisor from their book.">
      <AiInsightRunner<Result>
        endpoint="/api/ai/agent-coach"
        method="POST"
        inputLabel="Advisor name"
        inputPlaceholder="e.g. Russ Oxendine"
        buildBody={(advisor) => ({ advisor })}
        runLabel="Build plan"
        requireInput
        render={({ profile, plan }) => (
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{profile.advisor}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {profile.policyCount} policies · ${Math.round(profile.commissionablePremium).toLocaleString()} commissionable
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{plan.summary}</p>
              </CardContent>
            </Card>
            <div className="grid sm:grid-cols-2 gap-3">
              <Card><CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Strengths</p>
                <ul className="text-sm text-gray-700 dark:text-gray-200 list-disc ml-4 space-y-1">{plan.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Focus areas</p>
                <ul className="text-sm text-gray-700 dark:text-gray-200 list-disc ml-4 space-y-1">{plan.focusAreas?.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </CardContent></Card>
            </div>
            <Card><CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Action plan</p>
              <div className="space-y-2">
                {plan.actions?.map((a, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.why}</p>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </div>
        )}
      />
    </AiToolShell>
  );
}
