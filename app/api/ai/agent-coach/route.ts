import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText, extractJson } from '@/lib/ai/claude';
import { AGENT_COACH_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { advisorDetail, statusBucket } from '@/lib/ai/valor-data-adapter';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';
import { prisma } from '@/lib/db/prisma';

export const maxDuration = 60;

interface CoachingPlan {
  summary: string;
  strengths: string[];
  focusAreas: string[];
  actions: { action: string; why: string }[];
}

/**
 * POST /api/ai/agent-coach — coaching plan for one advisor. Body: { advisor }.
 * Uses proxy metrics (premium, volume, mix, recency) — no production scores exist.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();
    const advisor = typeof body.advisor === 'string' ? body.advisor.trim() : '';
    if (!advisor) return NextResponse.json({ error: 'advisor is required' }, { status: 400 });

    const { agent, policies } = await advisorDetail(ctx.scope, advisor);
    if (policies.length === 0) {
      return NextResponse.json({ error: `No book found for "${advisor}".` }, { status: 404 });
    }

    const inforce = policies.filter((p) => statusBucket(p.status) === 'INFORCE').length;
    const pending = policies.filter((p) => statusBucket(p.status) === 'PENDING').length;
    const comm = Math.round(policies.reduce((s, p) => s + p.commAnnualizedPrem, 0));
    const carriers = [...new Set(policies.map((p) => p.carrier))];
    const types = [...new Set(policies.map((p) => p.type).filter(Boolean))];
    const lastDate = policies
      .map((p) => p.statusDate)
      .filter(Boolean)
      .sort()
      .pop();

    const profile = {
      advisor: agent?.fullName || advisor,
      policyCount: policies.length,
      inforce,
      pending,
      commissionablePremium: comm,
      carriers,
      productTypes: types,
      lastActivity: lastDate ?? null,
    };

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1200,
      system: AGENT_COACH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Advisor book:\n${JSON.stringify(profile, null, 2)}` }],
    });

    const plan = extractJson<CoachingPlan>(messageText(completion));
    if (!plan) return NextResponse.json({ error: 'Could not generate a plan.' }, { status: 422 });

    await prisma.aiCoachingPlan.create({
      data: {
        tenantId: ctx.tenantId,
        advisor: profile.advisor,
        plan: plan as object,
        createdBy: ctx.userId,
      },
    });

    return NextResponse.json({ profile, plan });
  } catch (error) {
    return aiErrorResponse(error, 'Agent coaching failed');
  }
}
