import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText, extractJson } from '@/lib/ai/claude';
import { ANOMALIES_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { fetchPolicies, advisorRollups } from '@/lib/ai/valor-data-adapter';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';

export const maxDuration = 60;

interface Anomaly {
  type: string;
  severity: 'high' | 'medium' | 'low';
  finding: string;
  metric: string;
}

/**
 * GET /api/ai/anomalies — flag unusual patterns: decline clusters by carrier,
 * advisors with abnormal pending backlogs, recent premium swings (by statusDate).
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const [policies, advisors] = await Promise.all([
      fetchPolicies(ctx.tenantId),
      advisorRollups(ctx.tenantId),
    ]);

    // Decline counts by carrier.
    const declinesByCarrier = new Map<string, number>();
    for (const p of policies) {
      if (p.bucket === 'DECLINED') declinesByCarrier.set(p.carrier, (declinesByCarrier.get(p.carrier) ?? 0) + 1);
    }
    const topDeclineCarriers = [...declinesByCarrier.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([carrier, count]) => ({ carrier, count }));

    // Advisors with large pending backlogs.
    const pendingBacklog = advisors
      .filter((a) => a.pendingCount >= 3)
      .sort((a, b) => b.pendingCount - a.pendingCount)
      .slice(0, 8)
      .map((a) => ({ advisor: a.advisor, pending: a.pendingCount, inforce: a.inforceCount }));

    // Recent (last 30d) vs prior 30d new-policy counts by statusDate.
    const now = Date.now();
    const day = 86_400_000;
    let last30 = 0;
    let prior30 = 0;
    for (const p of policies) {
      if (!p.statusDate) continue;
      const age = now - new Date(p.statusDate).getTime();
      if (age <= 30 * day) last30 += 1;
      else if (age <= 60 * day) prior30 += 1;
    }

    const context = {
      topDeclineCarriers,
      pendingBacklog,
      recentActivity: { last30Days: last30, prior30Days: prior30 },
      totalPolicies: policies.length,
    };

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1200,
      system: ANOMALIES_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Book signals:\n${JSON.stringify(context, null, 2)}` }],
    });

    const anomalies = extractJson<Anomaly[]>(messageText(completion)) ?? [];
    return NextResponse.json({ context, anomalies });
  } catch (error) {
    return aiErrorResponse(error, 'Anomaly detection failed');
  }
}
