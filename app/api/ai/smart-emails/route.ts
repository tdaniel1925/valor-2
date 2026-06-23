import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText, extractJson } from '@/lib/ai/claude';
import { SMART_EMAIL_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';
import { prisma } from '@/lib/db/prisma';

export const maxDuration = 30;

interface Draft {
  subject: string;
  body: string;
}

/**
 * POST /api/ai/smart-emails — draft an email and save it to ai_email_drafts.
 * Body: { purpose: string, recipient?: string, context?: string, tone?: string }.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();
    const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : '';
    if (!purpose) return NextResponse.json({ error: 'purpose is required' }, { status: 400 });

    const recipient = typeof body.recipient === 'string' ? body.recipient.trim() : '';
    const context = typeof body.context === 'string' ? body.context.trim() : '';
    const tone = typeof body.tone === 'string' ? body.tone.trim() : 'professional';

    const prompt = [
      `Purpose: ${purpose}`,
      recipient ? `Recipient: ${recipient}` : '',
      context ? `Context: ${context}` : '',
      `Tone: ${tone}`,
    ]
      .filter(Boolean)
      .join('\n');

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 900,
      system: SMART_EMAIL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const draft = extractJson<Draft>(messageText(completion));
    if (!draft?.subject || !draft?.body) {
      return NextResponse.json({ error: 'Could not generate an email.' }, { status: 422 });
    }

    const saved = await prisma.aiEmailDraft.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        recipient: recipient || null,
        subject: draft.subject,
        body: draft.body,
        context: context || null,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: saved.id, draft });
  } catch (error) {
    return aiErrorResponse(error, 'Email drafting failed');
  }
}
