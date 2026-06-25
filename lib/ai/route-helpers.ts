/**
 * Shared helpers for AI Tools API routes: auth/tenant resolution + error mapping.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/db/prisma';
import { aiConfigured } from '@/lib/ai/claude';
import type { BookScope } from '@/lib/ai/valor-data-adapter';

const ADMIN_ROLES = ['ADMINISTRATOR', 'EXECUTIVE'];

export interface AiContext {
  tenantId: string;
  userId: string;
  email: string;
  isAdmin: boolean;
  /** Pass this to every adapter call so AI tools see only the user's book. */
  scope: BookScope;
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
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, role: true },
  });
  const email = dbUser?.email || user.email || '';
  const isAdmin = !!dbUser && ADMIN_ROLES.includes(dbUser.role);
  return {
    tenantId: tenant.tenantId,
    userId: user.id,
    email,
    isAdmin,
    scope: { tenantId: tenant.tenantId, email, isAdmin },
  };
}

export function aiErrorResponse(error: unknown, fallback = 'AI request failed'): NextResponse {
  const raw = error instanceof Error ? error.message : String(error);
  console.error('[AI]', raw); // full detail server-side only

  if (raw === 'Unauthorized') {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  // Anthropic SDK errors arrive as "<status> {json}" — translate to a clean,
  // user-facing message instead of leaking the raw payload to the UI.
  const status = (error as { status?: number })?.status;
  if (status === 404 || /not_found_error|model:/.test(raw)) {
    return NextResponse.json(
      { error: 'The AI model is unavailable. Please contact your administrator.' },
      { status: 502 }
    );
  }
  if (status === 401 || /authentication_error|invalid x-api-key/.test(raw)) {
    return NextResponse.json(
      { error: 'AI is not configured correctly. Please contact your administrator.' },
      { status: 502 }
    );
  }
  if (status === 429 || /rate_limit|overloaded/.test(raw)) {
    return NextResponse.json(
      { error: 'The AI service is busy. Please try again in a moment.' },
      { status: 503 }
    );
  }
  if ((status && status >= 500) || /api_error|Internal server error/.test(raw)) {
    return NextResponse.json(
      { error: 'The AI service had a temporary error. Please try again.' },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}
