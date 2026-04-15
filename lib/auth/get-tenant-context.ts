/**
 * API Route Tenant Context Helper
 *
 * Provides utility functions for API routes to extract tenant information
 * from request headers (set by middleware).
 *
 * Usage in API routes:
 * ```typescript
 * import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
 *
 * export async function GET(req: Request) {
 *   const tenant = getTenantFromRequest(req);
 *
 *   if (!tenant) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *
 *   // Use tenant.tenantId for queries
 *   const users = await prisma.user.findMany({
 *     where: { tenantId: tenant.tenantId }
 *   });
 *
 *   return Response.json(users);
 * }
 * ```
 */

import { type TenantContext } from './tenant-context';

/**
 * Extract tenant information from request headers
 *
 * The middleware sets these headers:
 * - x-tenant-id: The tenant UUID
 * - x-tenant-slug: The tenant slug (subdomain)
 * - x-tenant-name: The tenant name
 * - x-subdomain: The extracted subdomain
 *
 * @param request - The Next.js Request object
 * @returns TenantContext or null if headers not present
 */
export function getTenantFromRequest(request: Request): TenantContext | null {
  const tenantId = request.headers.get('x-tenant-id');
  const tenantSlug = request.headers.get('x-tenant-slug');
  const tenantName = request.headers.get('x-tenant-name');
  const subdomain = request.headers.get('x-subdomain');

  if (tenantId && tenantSlug && tenantName && subdomain) {
    return { tenantId, tenantSlug, tenantName, subdomain };
  }

  // Fallback: single-tenant mode — use DEFAULT_TENANT_ID env var.
  // This covers cases where middleware headers are missing (e.g. local dev
  // without the right env vars, or direct API calls in tests).
  const defaultTenantId = process.env.DEFAULT_TENANT_ID;
  if (defaultTenantId) {
    const defaultSlug = process.env.DEFAULT_TENANT_SLUG || 'valor';
    console.log('[getTenantFromRequest] Using fallback DEFAULT_TENANT_ID:', {
      defaultTenantId,
      defaultSlug,
      missingHeaders: { tenantId: !tenantId, tenantSlug: !tenantSlug, tenantName: !tenantName, subdomain: !subdomain },
    });
    return {
      tenantId: defaultTenantId,
      tenantSlug: defaultSlug,
      tenantName: process.env.DEFAULT_TENANT_NAME || 'Valor',
      subdomain: defaultSlug,
    };
  }

  console.error('[getTenantFromRequest] No tenant context available:', {
    headers: { tenantId, tenantSlug, tenantName, subdomain },
    hasDefaultTenantId: !!defaultTenantId,
  });

  return null;
}

/**
 * Extract just the tenant ID from request headers
 *
 * Convenience function when you only need the ID.
 *
 * @param request - The Next.js Request object
 * @returns The tenant ID or null
 */
export function getTenantId(request: Request): string | null {
  return request.headers.get('x-tenant-id');
}

/**
 * Require tenant context or throw error
 *
 * Use this when tenant is absolutely required for the endpoint.
 *
 * @param request - The Next.js Request object
 * @returns TenantContext (guaranteed to exist)
 * @throws Error if tenant not found
 */
export function requireTenant(request: Request): TenantContext {
  const tenant = getTenantFromRequest(request);

  if (!tenant) {
    throw new Error('Tenant context required but not found in request headers');
  }

  return tenant;
}

/**
 * Validate that a tenant ID belongs to the current request's tenant
 *
 * Useful for security checks when accepting tenant IDs in request body/params.
 *
 * Example:
 * ```typescript
 * const { organizationId } = await req.json();
 * const org = await prisma.organization.findUnique({
 *   where: { id: organizationId }
 * });
 *
 * // Verify the organization belongs to the current tenant
 * if (!validateTenantAccess(req, org.tenantId)) {
 *   return new Response('Unauthorized', { status: 403 });
 * }
 * ```
 *
 * @param request - The Next.js Request object
 * @param resourceTenantId - The tenant ID of the resource being accessed
 * @returns True if resource belongs to current tenant
 */
export function validateTenantAccess(
  request: Request,
  resourceTenantId: string
): boolean {
  const tenant = getTenantFromRequest(request);

  if (!tenant) {
    return false;
  }

  return tenant.tenantId === resourceTenantId;
}

/**
 * Create a standard unauthorized response
 *
 * Use this for consistent error responses when tenant validation fails.
 */
export function createUnauthorizedResponse(message = 'Unauthorized') {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create a standard forbidden response
 *
 * Use when user is authenticated but doesn't have access to the resource.
 */
export function createForbiddenResponse(message = 'Access denied') {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
