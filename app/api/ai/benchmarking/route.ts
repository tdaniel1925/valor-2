import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText, extractJson } from '@/lib/ai/claude';
import { BENCHMARKING_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { advisorRollups } from '@/lib/ai/valor-data-adapter';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';

export const maxDuration = 60;

interface Benchmark {
  summary: string;
  vsMedian: string;
  percentileNote: string;
  suggestions: string[];
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * POST /api/ai/benchmarking — benchmark one advisor (or the team) vs peer medians.
 * Body: { advisor?: string }.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json().catch(() => ({}));
    const advisorName = typeof body.advisor === 'string' ? body.advisor.trim() : '';

    const advisors = await advisorRollups(ctx.tenantId);
    if (advisors.length === 0) {
      return NextResponse.json({ error: 'No advisor data to benchmark.' }, { status: 404 });
    }

    const medians = {
      commissionablePremium: median(advisors.map((a) => a.commissionablePremium)),
      policyCount: median(advisors.map((a) => a.policyCount)),
      productTypes: median(advisors.map((a) => a.productTypes.length)),
    };

    const target = advisorName
      ? advisors.find((a) => a.advisor.toLowerCase() === advisorName.toLowerCase())
      : null;

    const context = {
      teamSize: advisors.length,
      medians,
      target: target
        ? {
            advisor: target.advisor,
            commissionablePremium: target.commissionablePremium,
            policyCount: target.policyCount,
            productTypes: target.productTypes.length,
            rank: advisors.findIndex((a) => a.advisor === target.advisor) + 1,
          }
        : null,
      topQuartilePremium: median(
        advisors.slice(0, Math.max(1, Math.ceil(advisors.length / 4))).map((a) => a.commissionablePremium)
      ),
    };

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1000,
      system: BENCHMARKING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Benchmark data:\n${JSON.stringify(context, null, 2)}` }],
    });

    const benchmark = extractJson<Benchmark>(messageText(completion));
    return NextResponse.json({ context, benchmark });
  } catch (error) {
    return aiErrorResponse(error, 'Benchmarking failed');
  }
}
