import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText, extractJson } from '@/lib/ai/claude';
import { CARRIER_INTEL_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { carrierRollups, fetchStats } from '@/lib/ai/valor-data-adapter';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';

export const maxDuration = 60;

interface CarrierAnalysis {
  summary: string;
  concentrationRisk: string;
  topCarriers: string[];
  recommendations: string[];
}

/** GET /api/ai/carrier-intelligence — carrier concentration + performance analysis. */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const [carriers, stats] = await Promise.all([carrierRollups(ctx.tenantId), fetchStats(ctx.tenantId)]);
    if (carriers.length === 0) {
      return NextResponse.json({ carriers: [], analysis: null, note: 'No carrier data.' });
    }

    const top = carriers.slice(0, 20);
    const context = {
      totalCommissionablePremium: stats.commissionablePremium,
      carrierCount: carriers.length,
      carriers: top,
    };

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1200,
      system: CARRIER_INTEL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Carrier rollups:\n${JSON.stringify(context, null, 2)}` }],
    });

    const analysis = extractJson<CarrierAnalysis>(messageText(completion));
    return NextResponse.json({ carriers: top, analysis });
  } catch (error) {
    return aiErrorResponse(error, 'Carrier intelligence failed');
  }
}
