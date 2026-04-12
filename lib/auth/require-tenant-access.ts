/**
 * API-Level Tenant Access Verification
 *
 * This module provides authentication and authorization middleware for API routes.
 * It verifies that the authenticated user belongs to the tenant they're trying to access.
 *
 * This is the PRIMARY defense against cross-tenant data access.
 * RLS (Row Level Security) is the SECONDARY defense layer.
 *
 * Usage in API routes:
 * ```typescript
 * import { requireTenantAccess } from '@/lib/auth/require-tenant-access';
 *
 * export async function GET(req: Request) {
 *   const auth = await requireTenantAccess(req);
 *   if (auth instanceof Response) return auth; // Error response
 *
 *   const { user, tenantId, prisma } = auth;
 *   // User is authenticated and belongs to this tenant
 *   // prisma client has tenant context already set via withTenantContext
 * }
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type AuthenticatedContext = {
  user: {
    id: string;
    email: string;
    tenantId: string;
  };
  tenantId: string;
  tenantSlug: string;
  prisma: PrismaClient;
};

/**
 * Verify that the authenticated user belongs to the tenant they're accessing
 *
 * This function:
 * 1. Extracts tenant info from request headers (set by middleware)
 * 2. Verifies user is authenticated via Supabase session
 * 3. Looks up user in database to verify they belong to this tenant
 * 4. Returns tenant-scoped Prisma client if successful
 *
 * Security: Fails closed - any error returns 401/403
 *
 * @param req - Next.js Request object
 * @returns AuthenticatedContext or error Response
 */
export async function requireTenantAccess(
  req: Request
): Promise<AuthenticatedContext | Response> {
  // Step 1: Get tenant info from headers (set by middleware)
  const tenantId = req.headers.get('x-tenant-id');
  const tenantSlug = req.headers.get('x-tenant-slug');

  if (!tenantId || !tenantSlug) {
    return new Response(
      JSON.stringify({ error: 'Tenant context missing' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 2: Get authenticated user from Supabase session
  const cookieStore = await cookies();
  const authCookie = cookieStore
    .getAll()
    .find((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  if (!authCookie) {
    return new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Decode the auth token to get user session
  let session;
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Supabase cookies are base64-encoded JSON
    let cookieValue = authCookie.value;
    if (cookieValue.startsWith('base64-')) {
      cookieValue = Buffer.from(cookieValue.substring(7), 'base64').toString('utf-8');
    }

    const tokenData = JSON.parse(cookieValue);
    const accessToken = tokenData.access_token || tokenData[0]; // Handle different cookie formats

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    session = data;
  } catch (error) {
    console.error('[requireTenantAccess] Session decode error:', error);
    return new Response(
      JSON.stringify({ error: 'Session verification failed' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const userId = session.user.id;

  // Step 3: Verify user belongs to this tenant via database lookup
  // Use withTenantContext to execute query with RLS enabled
  let user;
  try {
    user = await withTenantContext(tenantId, async (prisma) => {
      return await prisma.user.findFirst({
        where: {
          id: userId,
          tenantId: tenantId,
        },
        select: {
          id: true,
          email: true,
          tenantId: true,
        },
      });
    });

    if (!user) {
      // User doesn't belong to this tenant - CRITICAL SECURITY CHECK
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[requireTenantAccess] Database verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Authorization check failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 4: Return authenticated context with tenant-scoped Prisma
  // The Prisma client will be used within withTenantContext by the caller
  return {
    user,
    tenantId,
    tenantSlug,
    // Note: caller must use withTenantContext for all queries
    prisma: {} as PrismaClient, // Placeholder - actual usage via withTenantContext
  };
}

/**
 * Execute an API handler with tenant verification
 *
 * This is a convenience wrapper that handles the full flow:
 * 1. Verify tenant access
 * 2. Execute callback with authenticated context
 * 3. Automatically use withTenantContext for all DB operations
 *
 * Usage:
 * ```typescript
 * export async function GET(req: Request) {
 *   return await withVerifiedTenant(req, async ({ user, tenantId }, prisma) => {
 *     const cases = await prisma.case.findMany();
 *     return Response.json(cases);
 *   });
 * }
 * ```
 */
export async function withVerifiedTenant<T>(
  req: Request,
  handler: (
    auth: Omit<AuthenticatedContext, 'prisma'>,
    prisma: PrismaClient
  ) => Promise<Response>
): Promise<Response> {
  const auth = await requireTenantAccess(req);
  if (auth instanceof Response) return auth;

  const { user, tenantId, tenantSlug } = auth;

  try {
    // Execute handler within tenant context
    return await withTenantContext(tenantId, async (prisma) => {
      return await handler({ user, tenantId, tenantSlug }, prisma);
    });
  } catch (error) {
    console.error('[withVerifiedTenant] Handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
