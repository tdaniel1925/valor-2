import { NextRequest, NextResponse } from 'next/server';
import { anthropic, AI_MODEL, messageText, extractJson } from '@/lib/ai/claude';
import { NL_SEARCH_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { fetchPolicies } from '@/lib/ai/valor-data-adapter';
import { resolveAiContext, aiErrorResponse } from '@/lib/ai/route-helpers';

export const maxDuration = 30;

interface ParsedQuery {
  advisor: string | null;
  carrier: string | null;
  status: string | null;
  search: string | null;
  intent: string;
}

/**
 * POST /api/ai/search — natural-language → structured policy search.
 * Body: { query: string }. Returns { intent, filters, policies }.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveAiContext(request);
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 });

    const completion = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 400,
      system: NL_SEARCH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    const parsed = extractJson<ParsedQuery>(messageText(completion));
    if (!parsed) {
      return NextResponse.json({ error: 'Could not interpret that search.' }, { status: 422 });
    }

    const policies = await fetchPolicies(ctx.tenantId, {
      advisor: parsed.advisor ?? undefined,
      carrier: parsed.carrier ?? undefined,
      status: parsed.status ?? undefined,
      search: parsed.search ?? undefined,
    });

    return NextResponse.json({
      intent: parsed.intent,
      filters: {
        advisor: parsed.advisor,
        carrier: parsed.carrier,
        status: parsed.status,
        search: parsed.search,
      },
      count: policies.length,
      policies: policies.slice(0, 100),
    });
  } catch (error) {
    return aiErrorResponse(error, 'Search failed');
  }
}
