import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock fetch globally
global.fetch = vi.fn();

describe('Middleware', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'valorfs.app';
    process.env.DEFAULT_TENANT_ID = 'default-tenant-id';
    process.env.DEFAULT_TENANT_SLUG = 'valor';
    process.env.DEFAULT_TENANT_NAME = 'Valor';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetAllMocks();
  });

  describe('extractTenantSlug()', () => {
    it('should extract subdomain from localhost with port', () => {
      // We need to test this through the middleware since extractTenantSlug is not exported
      // We'll verify by checking the headers set by middleware
      const { middleware } = require('@/middleware');

      const request = new NextRequest('http://agency1.localhost:3000/dashboard', {
        headers: {
          host: 'agency1.localhost:3000',
        },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => [
          {
            id: 'tenant-123',
            name: 'Agency One',
            slug: 'agency1',
          },
        ],
      } as Response);

      // Execute middleware
      middleware(request);

      // Verify fetch was called with agency1
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('slug=eq.agency1'),
        expect.any(Object)
      );
    });

    it('should extract subdomain from localhost without port', () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('http://agency2.localhost/dashboard', {
        headers: {
          host: 'agency2.localhost',
        },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => [
          {
            id: 'tenant-456',
            name: 'Agency Two',
            slug: 'agency2',
          },
        ],
      } as Response);

      middleware(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('slug=eq.agency2'),
        expect.any(Object)
      );
    });

    it('should extract subdomain from production domain', () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://agency1.valorfs.app/dashboard', {
        headers: {
          host: 'agency1.valorfs.app',
        },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => [
          {
            id: 'tenant-789',
            name: 'Agency One Production',
            slug: 'agency1',
          },
        ],
      } as Response);

      middleware(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('slug=eq.agency1'),
        expect.any(Object)
      );
    });

    it('should return null for root localhost', () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          host: 'localhost:3000',
        },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => [],
      } as Response);

      middleware(request);

      // Should not call fetch for root domain
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null for root production domain', () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://valorfs.app/dashboard', {
        headers: {
          host: 'valorfs.app',
        },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => [],
      } as Response);

      middleware(request);

      // Should not call fetch for root domain
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle www subdomain as root', () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://www.valorfs.app/dashboard', {
        headers: {
          host: 'www.valorfs.app',
        },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => [],
      } as Response);

      middleware(request);

      // www should be treated as a subdomain
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('slug=eq.www'),
        expect.any(Object)
      );
    });

    it('should handle multi-level subdomains', () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://app.agency1.valorfs.app/dashboard', {
        headers: {
          host: 'app.agency1.valorfs.app',
        },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => [],
      } as Response);

      middleware(request);

      // Should extract the full subdomain portion
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('slug=eq.app.agency1'),
        expect.any(Object)
      );
    });
  });

  describe('middleware tenant resolution', () => {
    it('should set tenant headers when subdomain tenant is found', async () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://agency1.valorfs.app/dashboard', {
        headers: {
          host: 'agency1.valorfs.app',
        },
      });

      const mockCookies = [
        { name: 'sb-test-auth-token', value: 'valid-token' },
      ];

      Object.defineProperty(request, 'cookies', {
        value: {
          getAll: () => mockCookies,
        },
        writable: true,
      });

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => [
          {
            id: 'tenant-123',
            name: 'Agency One',
            slug: 'agency1',
          },
        ],
      } as Response);

      const response = await middleware(request);

      // Verify the response has the tenant headers
      const headers = response.headers;
      expect(headers.get('x-tenant-id')).toBe('tenant-123');
      expect(headers.get('x-tenant-slug')).toBe('agency1');
      expect(headers.get('x-tenant-name')).toBe('Agency One');
      expect(headers.get('x-subdomain')).toBe('agency1');
    });

    it('should use default tenant for root domain', async () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://valorfs.app/dashboard', {
        headers: {
          host: 'valorfs.app',
        },
      });

      const mockCookies = [
        { name: 'sb-test-auth-token', value: 'valid-token' },
      ];

      Object.defineProperty(request, 'cookies', {
        value: {
          getAll: () => mockCookies,
        },
        writable: true,
      });

      const response = await middleware(request);

      // Should use default tenant from env
      const headers = response.headers;
      expect(headers.get('x-tenant-id')).toBe('default-tenant-id');
      expect(headers.get('x-tenant-slug')).toBe('valor');
      expect(headers.get('x-tenant-name')).toBe('Valor');
      expect(headers.get('x-subdomain')).toBe('valor');
    });

    it('should not set tenant headers when lookup fails', async () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://unknown.valorfs.app/dashboard', {
        headers: {
          host: 'unknown.valorfs.app',
        },
      });

      const mockCookies = [
        { name: 'sb-test-auth-token', value: 'valid-token' },
      ];

      Object.defineProperty(request, 'cookies', {
        value: {
          getAll: () => mockCookies,
        },
        writable: true,
      });

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => [],
      } as Response);

      const response = await middleware(request);

      const headers = response.headers;
      expect(headers.get('x-tenant-id')).toBeNull();
      expect(headers.get('x-tenant-slug')).toBeNull();
    });

    it('should handle tenant lookup errors gracefully', async () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://agency1.valorfs.app/dashboard', {
        headers: {
          host: 'agency1.valorfs.app',
        },
      });

      const mockCookies = [
        { name: 'sb-test-auth-token', value: 'valid-token' },
      ];

      Object.defineProperty(request, 'cookies', {
        value: {
          getAll: () => mockCookies,
        },
        writable: true,
      });

      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      const response = await middleware(request);

      // Should continue without tenant headers
      expect(response).toBeDefined();
      const headers = response.headers;
      expect(headers.get('x-tenant-id')).toBeNull();
    });
  });

  describe('middleware authentication', () => {
    it('should allow access to public paths without session', async () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://valorfs.app/login', {
        headers: {
          host: 'valorfs.app',
        },
      });

      Object.defineProperty(request, 'cookies', {
        value: {
          getAll: () => [],
        },
        writable: true,
      });

      const response = await middleware(request);

      // Should not redirect
      expect(response.status).not.toBe(307);
    });

    it('should redirect to login when no session and private path', async () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://valorfs.app/dashboard', {
        headers: {
          host: 'valorfs.app',
        },
      });

      Object.defineProperty(request, 'cookies', {
        value: {
          getAll: () => [],
        },
        writable: true,
      });

      const response = await middleware(request);

      // Should redirect to login
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirectTo=%2Fdashboard');
    });

    it('should allow access when session cookie exists', async () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://valorfs.app/dashboard', {
        headers: {
          host: 'valorfs.app',
        },
      });

      const mockCookies = [
        { name: 'sb-test-auth-token', value: 'valid-token' },
      ];

      Object.defineProperty(request, 'cookies', {
        value: {
          getAll: () => mockCookies,
        },
        writable: true,
      });

      const response = await middleware(request);

      // Should not redirect
      expect(response.status).toBe(200);
    });

    it('should allow API routes without authentication', async () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://valorfs.app/api/webhooks/stripe', {
        headers: {
          host: 'valorfs.app',
        },
      });

      Object.defineProperty(request, 'cookies', {
        value: {
          getAll: () => [],
        },
        writable: true,
      });

      const response = await middleware(request);

      // Should not redirect
      expect(response.status).not.toBe(307);
    });

    it('should detect session cookie with sb- prefix', async () => {
      const { middleware } = require('@/middleware');

      const request = new NextRequest('https://valorfs.app/dashboard', {
        headers: {
          host: 'valorfs.app',
        },
      });

      const mockCookies = [
        { name: 'other-cookie', value: 'value' },
        { name: 'sb-custom-auth-token', value: 'token' },
      ];

      Object.defineProperty(request, 'cookies', {
        value: {
          getAll: () => mockCookies,
        },
        writable: true,
      });

      const response = await middleware(request);

      // Should allow access
      expect(response.status).toBe(200);
    });
  });
});
