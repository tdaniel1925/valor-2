/**
 * Tenant Context Utilities
 *
 * Provides functions for extracting tenant information from requests,
 * validating tenant slugs, and managing tenant-scoped database sessions.
 *
 * This is the core of our multi-tenant architecture, ensuring that all
 * database queries are properly scoped to the correct tenant.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Tenant context information extracted from the request
 */
export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  subdomain: string;
}

/**
 * Extract tenant slug from a hostname
 *
 * Examples:
 * - agency1.valorfs.app → "agency1"
 * - demo.localhost:2050 → "demo"
 * - valorfs.app → null (root domain, no tenant)
 *
 * @param hostname - The full hostname from the request (e.g., req.headers.host)
 * @returns The extracted slug, or null if no subdomain
 */
export function extractTenantSlug(hostname: string): string | null {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'valorfs.app';

  // Remove port if present (for localhost:2050)
  const cleanHostname = hostname.split(':')[0];

  // Handle localhost specially
  if (cleanHostname.includes('localhost')) {
    const parts = cleanHostname.split('.');
    if (parts.length > 1) {
      return parts[0]; // Return subdomain part before localhost
    }
    return null; // Just "localhost" with no subdomain
  }

  // Check if hostname ends with root domain
  if (cleanHostname.endsWith(rootDomain)) {
    // Extract subdomain
    const subdomain = cleanHostname.replace(`.${rootDomain}`, '');

    // If subdomain === rootDomain, we're on the root domain (no tenant)
    if (subdomain === rootDomain.replace(`.${rootDomain}`, '')) {
      return null;
    }

    // Return the subdomain if it's not empty and different from root
    return subdomain || null;
  }

  return null;
}

/**
 * Validate that a slug follows allowed format
 * - Lowercase letters, numbers, hyphens only
 * - Must start with letter
 * - Must be 3-50 characters
 *
 * @param slug - The tenant slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidTenantSlug(slug: string): boolean {
  const slugRegex = /^[a-z][a-z0-9-]{2,49}$/;
  return slugRegex.test(slug);
}

/**
 * Fetch tenant information from database by slug
 *
 * @param slug - The tenant slug
 * @returns Tenant record or null if not found
 */
export async function getTenantBySlug(slug: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    return tenant;
  } catch (error) {
    console.error('[tenant-context] Error fetching tenant:', error);
    return null;
  }
}

/**
 * Resolve full tenant context from a hostname
 *
 * This is the main function used by middleware to get tenant information.
 * It extracts the slug, validates it, and fetches the tenant from the database.
 *
 * @param hostname - The request hostname
 * @returns TenantContext or null if no valid tenant found
 */
export async function resolveTenantContext(
  hostname: string
): Promise<TenantContext | null> {
  // Extract slug from hostname
  const slug = extractTenantSlug(hostname);

  if (!slug) {
    return null; // No subdomain = no tenant
  }

  // Validate slug format
  if (!isValidTenantSlug(slug)) {
    console.warn(`[tenant-context] Invalid slug format: ${slug}`);
    return null;
  }

  // Fetch tenant from database
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    console.warn(`[tenant-context] Tenant not found for slug: ${slug}`);
    return null;
  }

  // Check tenant status
  if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
    console.warn(`[tenant-context] Tenant ${slug} is not active (status: ${tenant.status})`);
    return null;
  }

  // Return tenant context
  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    subdomain: slug,
  };
}

/**
 * Set tenant context in database session
 *
 * This function sets the PostgreSQL session variable that RLS policies use
 * to filter queries. MUST be called before any tenant-scoped database operation.
 *
 * Usage in API routes:
 * ```typescript
 * import { setTenantContext } from '@/lib/auth/tenant-context';
 *
 * export async function GET(req: Request) {
 *   const tenantId = req.headers.get('x-tenant-id');
 *   await setTenantContext(tenantId);
 *
 *   // Now all Prisma queries are scoped to this tenant
 *   const users = await prisma.user.findMany();
 * }
 * ```
 *
 * @param tenantId - The tenant UUID to set in session
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  try {
    // Set PostgreSQL session variable for RLS
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );
  } catch (error) {
    console.error('[tenant-context] Error setting tenant context:', error);
    throw new Error('Failed to set tenant context');
  }
}

/**
 * Clear tenant context from database session
 *
 * Useful for cleanup in tests or when switching contexts
 */
export async function clearTenantContext(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`RESET app.current_tenant_id`);
  } catch (error) {
    console.error('[tenant-context] Error clearing tenant context:', error);
  }
}

/**
 * Get the current tenant ID from session (for debugging)
 *
 * @returns The current tenant ID or null
 */
export async function getCurrentTenantId(): Promise<string | null> {
  try {
    const result = await prisma.$queryRawUnsafe<{ current_setting: string }[]>(
      `SELECT current_setting('app.current_tenant_id', TRUE) as current_setting`
    );
    return result[0]?.current_setting || null;
  } catch (error) {
    console.error('[tenant-context] Error getting current tenant ID:', error);
    return null;
  }
}

/**
 * Helper function to check if a request is for the root domain (no tenant)
 *
 * @param hostname - The request hostname
 * @returns True if this is the root domain with no subdomain
 */
export function isRootDomain(hostname: string): boolean {
  const slug = extractTenantSlug(hostname);
  return slug === null;
}

/**
 * List of paths that don't require tenant context
 * These are typically marketing pages, auth pages, or API health checks
 */
export const NO_TENANT_REQUIRED_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/health',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

/**
 * Check if a path requires tenant context
 *
 * @param pathname - The request pathname
 * @returns True if tenant is required for this path
 */
export function pathRequiresTenant(pathname: string): boolean {
  return !NO_TENANT_REQUIRED_PATHS.some(path => pathname.startsWith(path));
}
