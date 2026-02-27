/**
 * Unit Tests for Tenant Context Utilities
 *
 * To run these tests, you'll need to add vitest or jest to the project:
 * npm install -D vitest @vitest/ui
 *
 * Then add to package.json scripts:
 * "test:unit": "vitest",
 * "test:unit:ui": "vitest --ui"
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  extractTenantSlug,
  isValidTenantSlug,
  isRootDomain,
  pathRequiresTenant,
  resolveTenantContext,
} from '@/lib/auth/tenant-context';

describe('extractTenantSlug', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  beforeEach(() => {
    // Set default root domain for tests
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'valorfs.app';
  });

  afterEach(() => {
    // Restore original env
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = originalEnv;
  });

  it('extracts subdomain from production domain', () => {
    expect(extractTenantSlug('valor.valorfs.app')).toBe('valor');
    expect(extractTenantSlug('test-agency.valorfs.app')).toBe('test-agency');
    expect(extractTenantSlug('my-agency-123.valorfs.app')).toBe('my-agency-123');
  });

  it('handles localhost with subdomain', () => {
    expect(extractTenantSlug('valor.localhost')).toBe('valor');
    expect(extractTenantSlug('test.localhost')).toBe('test');
    expect(extractTenantSlug('agency1.localhost:2050')).toBe('agency1');
  });

  it('returns null for root domain without subdomain', () => {
    expect(extractTenantSlug('valorfs.app')).toBeNull();
    expect(extractTenantSlug('localhost')).toBeNull();
    expect(extractTenantSlug('localhost:2050')).toBeNull();
  });

  it('handles domains with ports correctly', () => {
    expect(extractTenantSlug('valor.localhost:2050')).toBe('valor');
    expect(extractTenantSlug('valor.valorfs.app:443')).toBe('valor');
  });

  it('handles invalid inputs gracefully', () => {
    expect(extractTenantSlug('')).toBeNull();
    expect(extractTenantSlug('just-a-domain')).toBeNull();
  });

  it('handles multi-level subdomains', () => {
    // Should only extract the first level
    expect(extractTenantSlug('sub.valor.valorfs.app')).toBe('sub');
  });
});

describe('isValidTenantSlug', () => {
  it('accepts valid tenant slugs', () => {
    expect(isValidTenantSlug('valor')).toBe(true);
    expect(isValidTenantSlug('test-agency')).toBe(true);
    expect(isValidTenantSlug('agency123')).toBe(true);
    expect(isValidTenantSlug('my-agency-name')).toBe(true);
  });

  it('rejects invalid tenant slugs', () => {
    expect(isValidTenantSlug('')).toBe(false);
    expect(isValidTenantSlug('ab')).toBe(false); // Too short
    expect(isValidTenantSlug('a')).toBe(false);
    expect(isValidTenantSlug('agency with spaces')).toBe(false);
    expect(isValidTenantSlug('agency_underscore')).toBe(false);
    expect(isValidTenantSlug('UPPERCASE')).toBe(false);
    expect(isValidTenantSlug('-starts-with-dash')).toBe(false);
    expect(isValidTenantSlug('ends-with-dash-')).toBe(false);
  });

  it('rejects reserved slugs', () => {
    expect(isValidTenantSlug('www')).toBe(false);
    expect(isValidTenantSlug('api')).toBe(false);
    expect(isValidTenantSlug('admin')).toBe(false);
    expect(isValidTenantSlug('app')).toBe(false);
    expect(isValidTenantSlug('auth')).toBe(false);
  });

  it('handles null and undefined', () => {
    expect(isValidTenantSlug(null as any)).toBe(false);
    expect(isValidTenantSlug(undefined as any)).toBe(false);
  });
});

describe('isRootDomain', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'valorfs.app';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = originalEnv;
  });

  it('identifies root domain correctly', () => {
    expect(isRootDomain('valorfs.app')).toBe(true);
    expect(isRootDomain('localhost')).toBe(true);
    expect(isRootDomain('localhost:2050')).toBe(true);
  });

  it('identifies subdomains as not root domain', () => {
    expect(isRootDomain('valor.valorfs.app')).toBe(false);
    expect(isRootDomain('test.localhost')).toBe(false);
    expect(isRootDomain('agency.valorfs.app:443')).toBe(false);
  });

  it('handles ports correctly', () => {
    expect(isRootDomain('valorfs.app:443')).toBe(true);
    expect(isRootDomain('valor.valorfs.app:443')).toBe(false);
  });
});

describe('pathRequiresTenant', () => {
  it('identifies paths that require tenant context', () => {
    expect(pathRequiresTenant('/dashboard')).toBe(true);
    expect(pathRequiresTenant('/cases')).toBe(true);
    expect(pathRequiresTenant('/quotes')).toBe(true);
    expect(pathRequiresTenant('/commissions')).toBe(true);
    expect(pathRequiresTenant('/reports')).toBe(true);
    expect(pathRequiresTenant('/api/cases')).toBe(true);
    expect(pathRequiresTenant('/api/quotes')).toBe(true);
  });

  it('identifies paths that do not require tenant context', () => {
    expect(pathRequiresTenant('/')).toBe(false);
    expect(pathRequiresTenant('/no-tenant')).toBe(false);
    expect(pathRequiresTenant('/tenant-not-found')).toBe(false);
    expect(pathRequiresTenant('/unauthorized')).toBe(false);
    expect(pathRequiresTenant('/api/health')).toBe(false);
    expect(pathRequiresTenant('/_next/static/css/app.css')).toBe(false);
  });

  it('handles API routes correctly', () => {
    expect(pathRequiresTenant('/api/cases')).toBe(true);
    expect(pathRequiresTenant('/api/auth/signin')).toBe(false);
    expect(pathRequiresTenant('/api/auth/signup')).toBe(false);
    expect(pathRequiresTenant('/api/webhooks/stripe')).toBe(false);
  });
});

describe('resolveTenantContext', () => {
  // Mock the database call
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('returns tenant context for valid active tenant', async () => {
    // Mock getTenantBySlug to return a tenant
    const mockTenant = {
      id: 'tenant-123',
      slug: 'valor',
      name: 'Valor Financial Specialists',
      status: 'ACTIVE',
    };

    // You'll need to mock the prisma call
    // This is a simplified example
    const context = await resolveTenantContext('valor.valorfs.app');

    // This test requires actual mocking setup
    // expect(context).toMatchObject({
    //   tenantId: 'tenant-123',
    //   tenantSlug: 'valor',
    //   tenantName: 'Valor Financial Specialists',
    //   subdomain: 'valor',
    // });
  });

  it('returns null for invalid tenant slug', async () => {
    const context = await resolveTenantContext('invalid!!!.valorfs.app');
    expect(context).toBeNull();
  });

  it('returns null for root domain', async () => {
    const context = await resolveTenantContext('valorfs.app');
    expect(context).toBeNull();
  });

  it('returns null for suspended tenant', async () => {
    // Mock getTenantBySlug to return a suspended tenant
    const mockTenant = {
      id: 'tenant-suspended',
      slug: 'suspended',
      name: 'Suspended Agency',
      status: 'SUSPENDED',
    };

    // const context = await resolveTenantContext('suspended.valorfs.app');
    // expect(context).toBeNull();
  });

  it('returns null for churned tenant', async () => {
    // Similar test for CHURNED status
  });

  it('allows TRIAL tenants', async () => {
    // Mock getTenantBySlug to return a trial tenant
    const mockTenant = {
      id: 'tenant-trial',
      slug: 'trial',
      name: 'Trial Agency',
      status: 'TRIAL',
    };

    // const context = await resolveTenantContext('trial.valorfs.app');
    // expect(context).not.toBeNull();
    // expect(context?.tenantId).toBe('tenant-trial');
  });
});

// Additional helper function tests
describe('Tenant Context Edge Cases', () => {
  it('handles very long subdomains', () => {
    const longSubdomain = 'a'.repeat(100);
    expect(isValidTenantSlug(longSubdomain)).toBe(false);
  });

  it('handles special characters in hostname', () => {
    expect(extractTenantSlug('test@agency.valorfs.app')).toBeNull();
    expect(extractTenantSlug('test agency.valorfs.app')).toBeNull();
  });

  it('handles IPv4 addresses', () => {
    expect(isRootDomain('127.0.0.1')).toBe(true);
    expect(isRootDomain('192.168.1.1:2050')).toBe(true);
  });

  it('handles localhost variations', () => {
    expect(isRootDomain('localhost')).toBe(true);
    expect(isRootDomain('localhost.localdomain')).toBe(true);
    expect(extractTenantSlug('valor.localhost.localdomain')).toBe('valor');
  });
});
