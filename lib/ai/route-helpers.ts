/**
 * Shared helpers for AI Tools API routes: auth/tenant resolution + error mapping.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { aiConfigured } from '@/lib/ai/claude';

export interface AiContext {
  tenantId: string;
  userId: string;
  email: string;
}

/** Resolve tenant + authed user, or return a NextResponse to short-circuit. */
export async function resolveAiContext(
  request: NextRequest
): Promise<AiContext | NextResponse> {
  const tenant = getTenantFromRequest(request);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
  }
  if (!aiConfigured()) {
    return NextResponse.json(
      { error: 'AI is not configured. Set ANTHROPIC_API_KEY.' },
      { status: 503 }
    );
  }
  const user = await requireAuth(request);
  return { tenantId: tenant.tenantId, userId: user.id, email: user.email ?? '' };
}

export function aiErrorResponse(error: unknown, fallback = 'AI request failed'): NextResponse {
  const message = error instanceof Error ? error.message : fallback;
  const status = message === 'Unauthorized' ? 401 : 500;
  console.error('[AI]', message);
  return NextResponse.json({ error: message }, { status });
}
