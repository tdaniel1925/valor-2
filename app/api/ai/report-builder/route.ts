import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText } from '@/lib/ai/claude';
import { REPORT_BUILDER_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { fetchStats, advisorRollups, carrierRollups } from '@/lib/ai/valor-data-adapter';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';

export const maxDuration = 60;

/**
 * POST /api/ai/report-builder — generate a markdown business report.
 * Body: { request: string } (what the report should cover).
 * Gathers book aggregates and asks Claude to write a structured report.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();
    const ask = typeof body.request === 'string' ? body.request.trim() : 'Overall book of business summary';

    const [stats, advisors, carriers] = await Promise.all([
      fetchStats(ctx.scope),
      advisorRollups(ctx.scope),
      carrierRollups(ctx.scope),
    ]);

    const data = {
      totals: {
        policies: stats.total,
        inforce: stats.inforce,
        pending: stats.pending,
        annualPremium: stats.annualPremium,
        commissionablePremium: stats.commissionablePremium,
      },
      topAdvisors: advisors.slice(0, 15),
      topCarriers: carriers.slice(0, 15),
    };

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2500,
      system: REPORT_BUILDER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Report request: ${ask}\n\nBook data (use only these numbers):\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    });

    return NextResponse.json({ request: ask, report: messageText(completion) });
  } catch (error) {
    return aiErrorResponse(error, 'Report generation failed');
  }
}
