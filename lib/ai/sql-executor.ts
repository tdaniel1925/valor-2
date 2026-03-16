import { prisma } from '@/lib/db/prisma';

export async function executeSafeSQL(
  sql: string,
  tenantId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    // Security checks
    const sqlLower = sql.toLowerCase();

    // Must include tenant filter
    if (!sqlLower.includes('tenantid')) {
      throw new Error('Query must filter by tenantId for security');
    }

    if (!sqlLower.includes(tenantId.toLowerCase())) {
      throw new Error('Query must use the current tenant ID');
    }

    // Block destructive operations
    const forbidden = ['insert', 'update', 'delete', 'drop', 'truncate', 'alter', 'create', 'grant', 'revoke'];
    if (forbidden.some(kw => sqlLower.includes(kw))) {
      throw new Error('Only SELECT queries are allowed');
    }

    // Execute query
    console.log('[SQL Executor] Executing query:', sql);
    const results = await prisma.$queryRawUnsafe(sql);

    console.log('[SQL Executor] Query returned', Array.isArray(results) ? results.length : 0, 'rows');

    return { success: true, data: results as any[] };

  } catch (error: any) {
    console.error('[SQL Executor] Error:', error.message);
    return { success: false, error: error.message };
  }
}
