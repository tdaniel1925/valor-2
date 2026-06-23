'use client';

import { Card, CardContent } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';

interface Result {
  id: string;
  draft: { subject: string; body: string };
}

export default function SmartEmailsPage() {
  return (
    <AiToolShell title="Smart Emails" description="Draft a professional email for an advisor or client. Drafts are saved automatically.">
      <AiInsightRunner<Result>
        endpoint="/api/ai/smart-emails"
        method="POST"
        inputLabel="What's the email for?"
        inputPlaceholder="e.g. follow up with Russ on his 3 stalled annuity apps"
        buildBody={(purpose) => ({ purpose })}
        runLabel="Draft email"
        requireInput
        render={({ draft }) => (
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-gray-400 uppercase mb-1">Subject</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">{draft.subject}</p>
              <p className="text-xs text-gray-400 uppercase mb-1">Body</p>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans">{draft.body}</pre>
            </CardContent>
          </Card>
        )}
      />
    </AiToolShell>
  );
}
