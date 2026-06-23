'use client';

import { Card, CardContent } from '@/components/ui';
import AiToolShell from '@/components/ai/AiToolShell';
import AiInsightRunner from '@/components/ai/AiInsightRunner';
import FormattedMessage from '@/components/ai/FormattedMessage';

interface Result {
  request: string;
  report: string;
}

export default function ReportBuilderPage() {
  return (
    <AiToolShell title="Report Builder" description="Generate a written report over the book of business. Describe what you want covered.">
      <AiInsightRunner<Result>
        endpoint="/api/ai/report-builder"
        method="POST"
        inputLabel="What should the report cover?"
        inputPlaceholder="e.g. Q2 production summary by carrier and top advisors"
        buildBody={(request) => ({ request })}
        runLabel="Generate report"
        render={({ report }) => (
          <Card>
            <CardContent className="p-6">
              <FormattedMessage content={report} className="text-sm text-gray-800 dark:text-gray-200" />
            </CardContent>
          </Card>
        )}
      />
    </AiToolShell>
  );
}
