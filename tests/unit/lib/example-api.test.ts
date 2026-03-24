/**
 * Example API Test
 *
 * This demonstrates how to test API functions using the test utilities.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockSupabaseClient,
  createMockResponse,
  createMockError,
} from '@/tests/utils';

// Example API function to test
async function getTenantById(supabase: any, tenantId: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error) throw error;
  return data;
}

describe('getTenantById', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it('returns tenant data when found', async () => {
    const mockTenant = {
      id: 'tenant-123',
      name: 'Test Tenant',
      slug: 'test-tenant',
    };

    // Mock the chain of methods
    mockSupabase.from().select().eq().single.mockResolvedValue(
      createMockResponse(mockTenant)
    );

    const result = await getTenantById(mockSupabase, 'tenant-123');

    expect(result).toEqual(mockTenant);
    expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
  });

  it('throws error when tenant not found', async () => {
    mockSupabase.from().select().eq().single.mockResolvedValue(
      createMockError('Not found')
    );

    await expect(getTenantById(mockSupabase, 'invalid-id')).rejects.toThrow();
  });
});
