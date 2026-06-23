import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText, extractJson } from '@/lib/ai/claude';
import { CROSS_SELL_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { advisorRollups } from '@/lib/ai/valor-data-adapter';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';

export const maxDuration = 60;

interface Opportunity {
  advisor: string;
  opportunity: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * GET /api/ai/cross-sell — find advisors concentrated in one product type who
 * could sell adjacent products. Groups policies by advisor (name-linked).
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const advisors = await advisorRollups(ctx.tenantId);
    // Only advisors with enough volume to matter.
    const candidates = advisors
      .filter((a) => a.policyCount >= 3)
      .slice(0, 40)
      .map((a) => ({
        advisor: a.advisor,
        policyCount: a.policyCount,
        commissionablePremium: a.commissionablePremium,
        productTypes: a.productTypes,
        carriers: a.carriers.length,
      }));

    if (candidates.length === 0) {
      return NextResponse.json({ opportunities: [], note: 'Not enough advisor volume to analyze.' });
    }

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      system: CROSS_SELL_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Advisor product mixes:\n${JSON.stringify(candidates, null, 2)}` },
      ],
    });

    const opportunities = extractJson<Opportunity[]>(messageText(completion)) ?? [];
    return NextResponse.json({ opportunities: opportunities.slice(0, 10) });
  } catch (error) {
    return aiErrorResponse(error, 'Cross-sell analysis failed');
  }
}
