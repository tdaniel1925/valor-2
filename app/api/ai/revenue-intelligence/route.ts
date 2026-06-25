import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText, extractJson } from '@/lib/ai/claude';
import { REVENUE_INTEL_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { fetchPolicies, fetchStats, advisorRollups } from '@/lib/ai/valor-data-adapter';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';
import { prisma } from '@/lib/db/prisma';

export const maxDuration = 60;

interface Finding {
  category: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dollarImpact: number;
  actionLabel: string;
}

const STALE_DAYS = 30;

/**
 * GET /api/ai/revenue-intelligence — analyze the book and surface findings.
 * Computes aggregates locally, asks Claude to prioritize, persists to ai_findings.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const [stats, policies, advisors] = await Promise.all([
      fetchStats(ctx.scope),
      fetchPolicies(ctx.scope),
      advisorRollups(ctx.scope),
    ]);

    const now = Date.now();
    const stalled = policies.filter(
      (p) =>
        p.bucket === 'PENDING' &&
        p.statusDate &&
        now - new Date(p.statusDate).getTime() > STALE_DAYS * 86_400_000
    );
    const missingPremium = policies.filter((p) => p.bucket === 'INFORCE' && p.commAnnualizedPrem <= 0);
    const topAdvisorShare =
      advisors.length > 0 && stats.commissionablePremium > 0
        ? Math.round((advisors[0].commissionablePremium / stats.commissionablePremium) * 100)
        : 0;
    const singleProductAdvisors = advisors.filter(
      (a) => a.policyCount >= 5 && a.productTypes.length <= 1
    ).length;

    const context = {
      totals: {
        policies: stats.total,
        inforce: stats.inforce,
        pending: stats.pending,
        annualPremium: stats.annualPremium,
        commissionablePremium: stats.commissionablePremium,
      },
      stalledPendingCount: stalled.length,
      stalledPendingPremium: Math.round(stalled.reduce((s, p) => s + p.commAnnualizedPrem, 0)),
      inforceMissingPremiumCount: missingPremium.length,
      topAdvisor: advisors[0]
        ? { name: advisors[0].advisor, share: topAdvisorShare, premium: advisors[0].commissionablePremium }
        : null,
      singleProductAdvisors,
      advisorCount: advisors.length,
    };

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      system: REVENUE_INTEL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Book metrics:\n${JSON.stringify(context, null, 2)}` }],
    });

    const findings = extractJson<Finding[]>(messageText(completion)) ?? [];

    // Refresh persisted findings for this tenant.
    if (findings.length > 0) {
      await prisma.aiFinding.deleteMany({ where: { tenantId: ctx.tenantId, status: 'open' } });
      await prisma.aiFinding.createMany({
        data: findings.slice(0, 12).map((f) => ({
          tenantId: ctx.tenantId,
          category: String(f.category || 'opportunity'),
          severity: ['high', 'medium', 'low'].includes(f.severity) ? f.severity : 'medium',
          title: String(f.title || 'Finding'),
          description: String(f.description || ''),
          dollarImpact: Number(f.dollarImpact) || 0,
          actionLabel: f.actionLabel ? String(f.actionLabel) : null,
        })),
      });
    }

    return NextResponse.json({ context, findings });
  } catch (error) {
    return aiErrorResponse(error, 'Revenue intelligence failed');
  }
}
