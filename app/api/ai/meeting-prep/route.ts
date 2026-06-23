import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText, extractJson } from '@/lib/ai/claude';
import { MEETING_PREP_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { advisorDetail, statusBucket } from '@/lib/ai/valor-data-adapter';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';
import { prisma } from '@/lib/db/prisma';

export const maxDuration = 60;

interface PrepSheet {
  headline: string;
  keyNumbers: string[];
  talkingPoints: string[];
  questions: string[];
}

/** POST /api/ai/meeting-prep — 1:1 prep sheet for an advisor. Body: { advisor }. */
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();
    const advisor = typeof body.advisor === 'string' ? body.advisor.trim() : '';
    if (!advisor) return NextResponse.json({ error: 'advisor is required' }, { status: 400 });

    const { agent, policies } = await advisorDetail(ctx.tenantId, advisor);
    if (policies.length === 0) {
      return NextResponse.json({ error: `No book found for "${advisor}".` }, { status: 404 });
    }

    const findings = await prisma.aiFinding.findMany({
      where: { tenantId: ctx.tenantId, status: 'open', advisor: agent?.fullName || advisor },
      select: { title: true, description: true, severity: true },
      take: 5,
    });

    const profile = {
      advisor: agent?.fullName || advisor,
      email: agent?.email ?? null,
      policyCount: policies.length,
      inforce: policies.filter((p) => statusBucket(p.status) === 'INFORCE').length,
      pending: policies.filter((p) => statusBucket(p.status) === 'PENDING').length,
      commissionablePremium: Math.round(policies.reduce((s, p) => s + p.commAnnualizedPrem, 0)),
      carriers: [...new Set(policies.map((p) => p.carrier))].slice(0, 8),
      productTypes: [...new Set(policies.map((p) => p.type).filter(Boolean))],
      openFindings: findings,
    };

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1200,
      system: MEETING_PREP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Advisor profile:\n${JSON.stringify(profile, null, 2)}` }],
    });

    const sheet = extractJson<PrepSheet>(messageText(completion));
    return NextResponse.json({ profile, sheet });
  } catch (error) {
    return aiErrorResponse(error, 'Meeting prep failed');
  }
}
