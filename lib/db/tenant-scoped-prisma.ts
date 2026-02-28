/**
 * Tenant-Scoped Prisma Client
 *
 * Provides a Prisma client wrapper that automatically sets tenant context
 * before executing queries, ensuring RLS (Row Level Security) is properly enforced.
 *
 * This prevents accidentally querying data across tenant boundaries.
 *
 * Usage in API routes:
 * ```typescript
 * import { createTenantPrisma } from '@/lib/db/tenant-scoped-prisma';
 * import { getTenantId } from '@/lib/auth/get-tenant-context';
 *
 * export async function GET(req: Request) {
 *   const tenantId = getTenantId(req);
 *   if (!tenantId) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *
 *   const prisma = await createTenantPrisma(tenantId);
 *
 *   // This query is automatically scoped to the tenant via RLS
 *   const users = await prisma.user.findMany();
 *
 *   return Response.json(users);
 * }
 * ```
 */

import { PrismaClient } from '@prisma/client';
import { setTenantContext } from '../auth/tenant-context';

/**
 * Global Prisma client instance
 * We use a singleton pattern to avoid creating multiple connections
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Create a tenant-scoped Prisma client
 *
 * This function returns the Prisma client after setting the tenant context
 * in the database session. All subsequent queries will be automatically
 * filtered by the RLS policies.
 *
 * IMPORTANT: This sets a session-level variable that persists for the
 * lifetime of the database connection. Be careful in serverless environments
 * where connections are pooled.
 *
 * @param tenantId - The tenant UUID to scope queries to
 * @returns Prisma client instance with tenant context set
 */
export async function createTenantPrisma(tenantId: string): Promise<PrismaClient> {
  // Set tenant context in database session
  await setTenantContext(tenantId);

  return prisma;
}

/**
 * Execute a Prisma query with tenant context
 *
 * Alternative API that wraps the query execution in a transaction with
 * tenant context set. This is safer for connection pooling as the context
 * is local to the transaction.
 *
 * Usage:
 * ```typescript
 * const users = await withTenantContext(tenantId, async (prisma) => {
 *   return await prisma.user.findMany();
 * });
 * ```
 *
 * @param tenantId - The tenant UUID
 * @param callback - Async function that receives the Prisma client
 * @returns Result of the callback function
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set tenant context within transaction
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );

    // Execute the callback with the transaction client
    return await callback(tx as PrismaClient);
  });
}

/**
 * Tenant-scoped query builder
 *
 * Provides a fluent API for building tenant-scoped queries.
 * Automatically injects tenantId into where clauses as a fallback
 * (RLS is the primary defense, this is defense-in-depth).
 *
 * Usage:
 * ```typescript
 * const users = await tenantQuery(tenantId)
 *   .user
 *   .findMany({
 *     where: { role: 'AGENT' }
 *   });
 * ```
 */
export function tenantQuery(tenantId: string) {
  // Create a proxy that automatically adds tenantId to queries
  return new Proxy(prisma, {
    get(target, prop) {
      const original = target[prop as keyof typeof target];

      // If it's a model (e.g., prisma.user)
      if (typeof original === 'object' && original !== null) {
        return new Proxy(original, {
          get(modelTarget, modelProp) {
            const modelMethod = modelTarget[modelProp as keyof typeof modelTarget];

            // If it's a query method (e.g., findMany, findUnique)
            if (typeof modelMethod === 'function') {
              return async (...args: any[]) => {
                // Set tenant context before query
                await setTenantContext(tenantId);

                // Add tenantId to where clause if present
                if (args[0] && typeof args[0] === 'object' && args[0].where) {
                  args[0].where = {
                    ...args[0].where,
                    tenantId,
                  };
                } else if (args[0] && typeof args[0] === 'object') {
                  args[0].where = { tenantId };
                }

                // Execute original method
                return (modelMethod as Function).apply(modelTarget, args);
              };
            }

            return modelMethod;
          },
        });
      }

      return original;
    },
  });
}

/**
 * Helper to check if RLS is properly configured
 *
 * This can be used in tests or admin endpoints to verify RLS is working.
 * It attempts to query data without setting tenant context and should fail.
 *
 * @returns True if RLS is enforced, false otherwise
 */
export async function verifyRLSEnabled(): Promise<boolean> {
  try {
    // Try to query users without setting tenant context
    // This should return 0 results if RLS is working
    const users = await prisma.user.findMany({ take: 1 });

    // If we get results without tenant context, RLS is NOT working
    return users.length === 0;
  } catch (error) {
    // If query fails completely, RLS might be too strict or there's another issue
    console.error('[RLS Verification] Error:', error);
    return false;
  }
}

/**
 * Utility to get the current tenant context from the database session
 *
 * Useful for debugging and logging.
 *
 * @returns The current tenant ID or null
 */
export async function getCurrentTenantFromSession(): Promise<string | null> {
  try {
    const result = await prisma.$queryRawUnsafe<{ current_setting: string }[]>(
      `SELECT current_setting('app.current_tenant_id', TRUE) as current_setting`
    );
    return result[0]?.current_setting || null;
  } catch (error) {
    console.error('[Tenant Session] Error getting tenant from session:', error);
    return null;
  }
}

// Export the default prisma client for cases where tenant scoping isn't needed
// (e.g., administrative operations, migrations, seeding)
export default prisma;
