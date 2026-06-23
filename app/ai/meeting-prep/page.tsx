'use client';

import { Card, CardContent } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';

interface Sheet {
  headline: string;
  keyNumbers: string[];
  talkingPoints: string[];
  questions: string[];
}
interface Result {
  profile: { advisor: string };
  sheet: Sheet | null;
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs font-semibold uppercase text-gray-400 mb-2">{title}</p>
      <ul className="text-sm text-gray-700 dark:text-gray-200 list-disc ml-4 space-y-1">{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </CardContent></Card>
  );
}

export default function MeetingPrepPage() {
  return (
    <AiToolShell title="Meeting Prep" description="A tight 1:1 prep sheet for an advisor — key numbers, talking points, and questions.">
      <AiInsightRunner<Result>
        endpoint="/api/ai/meeting-prep"
        method="POST"
        inputLabel="Advisor name"
        inputPlaceholder="e.g. Naureen Merrani-Ali"
        buildBody={(advisor) => ({ advisor })}
        runLabel="Prepare"
        requireInput
        render={({ profile, sheet }) =>
          sheet ? (
            <div className="space-y-3">
              <Card><CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{profile.advisor}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{sheet.headline}</p>
              </CardContent></Card>
              <Section title="Key numbers" items={sheet.keyNumbers} />
              <Section title="Talking points" items={sheet.talkingPoints} />
              <Section title="Questions to ask" items={sheet.questions} />
            </div>
          ) : (
            <p className="text-sm text-gray-400">No prep sheet produced.</p>
          )
        }
      />
    </AiToolShell>
  );
}
