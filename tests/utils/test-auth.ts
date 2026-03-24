/**
 * Authentication Test Helpers
 *
 * Utilities for testing authentication and authorization flows.
 */

import { vi } from 'vitest';
import { createMockUser, createMockSession } from './mock-supabase';

/**
 * Test user roles
 */
export enum TestUserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  VIEWER = 'VIEWER',
}

/**
 * Creates a mock authenticated context
 */
export function createMockAuthContext(options?: {
  userId?: string;
  email?: string;
  role?: TestUserRole;
  tenantId?: string;
  tenantSlug?: string;
}) {
  const userId = options?.userId || 'test-user-id';
  const email = options?.email || 'test@example.com';
  const tenantId = options?.tenantId || 'test-tenant-id';
  const tenantSlug = options?.tenantSlug || 'test-tenant';

  return {
    user: createMockUser({
      id: userId,
      email,
      user_metadata: {
        role: options?.role || TestUserRole.ADMIN,
      },
      app_metadata: {
        tenant_id: tenantId,
        tenant_slug: tenantSlug,
      },
    }),
    session: createMockSession(),
    tenantContext: {
      tenantId,
      tenantSlug,
      tenantName: 'Test Tenant',
      subdomain: tenantSlug,
    },
  };
}

/**
 * Creates a mock unauthenticated context
 */
export function createMockUnauthenticatedContext() {
  return {
    user: null,
    session: null,
    tenantContext: null,
  };
}

/**
 * Mock session storage for tests
 */
export class MockSessionStorage {
  private storage = new Map<string, string>();

  get(key: string): string | null {
    return this.storage.get(key) || null;
  }

  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  remove(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

/**
 * Mock cookies for Next.js testing
 */
export function createMockCookies() {
  const cookieStore = new Map<string, string>();

  return {
    get: vi.fn((name: string) => {
      const value = cookieStore.get(name);
      return value ? { name, value } : undefined;
    }),
    set: vi.fn((name: string, value: string, options?: any) => {
      cookieStore.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      cookieStore.delete(name);
    }),
    getAll: vi.fn(() => {
      return Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value }));
    }),
    has: vi.fn((name: string) => {
      return cookieStore.has(name);
    }),
  };
}

/**
 * Mock headers for Next.js testing
 */
export function createMockHeaders(headers?: Record<string, string>) {
  const headerStore = new Map(Object.entries(headers || {}));

  return {
    get: vi.fn((name: string) => headerStore.get(name.toLowerCase())),
    has: vi.fn((name: string) => headerStore.has(name.toLowerCase())),
    entries: vi.fn(() => headerStore.entries()),
    keys: vi.fn(() => headerStore.keys()),
    values: vi.fn(() => headerStore.values()),
    forEach: vi.fn((callback: (value: string, key: string) => void) => {
      headerStore.forEach(callback);
    }),
  };
}

/**
 * Mock request for testing API routes
 */
export function createMockRequest(options?: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  cookies?: Record<string, string>;
}) {
  return {
    method: options?.method || 'GET',
    url: options?.url || 'http://localhost:2050/api/test',
    headers: createMockHeaders(options?.headers),
    cookies: createMockCookies(),
    json: vi.fn().mockResolvedValue(options?.body || {}),
    text: vi.fn().mockResolvedValue(JSON.stringify(options?.body || {})),
    formData: vi.fn().mockResolvedValue(new FormData()),
  };
}

/**
 * Mock response for testing API routes
 */
export function createMockResponse() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: any = null;

  return {
    status: vi.fn((code: number) => {
      statusCode = code;
      return this;
    }),
    json: vi.fn((data: any) => {
      body = data;
      return new Response(JSON.stringify(data), {
        status: statusCode,
        headers: Object.fromEntries(headers),
      });
    }),
    text: vi.fn((data: string) => {
      body = data;
      return new Response(data, {
        status: statusCode,
        headers: Object.fromEntries(headers),
      });
    }),
    redirect: vi.fn((url: string, code?: number) => {
      headers.set('Location', url);
      statusCode = code || 302;
      return new Response(null, {
        status: statusCode,
        headers: Object.fromEntries(headers),
      });
    }),
    setHeader: vi.fn((name: string, value: string) => {
      headers.set(name, value);
    }),
    getStatus: () => statusCode,
    getBody: () => body,
    getHeaders: () => Object.fromEntries(headers),
  };
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(timeout = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * Simulate login flow
 */
export async function simulateLogin(email: string, password: string) {
  const user = createMockUser({ email });
  const session = createMockSession(user);

  return {
    user,
    session,
    error: null,
  };
}

/**
 * Simulate logout flow
 */
export async function simulateLogout() {
  return {
    error: null,
  };
}

/**
 * Check if user has permission
 */
export function hasPermission(role: TestUserRole, requiredRole: TestUserRole): boolean {
  const roleHierarchy: Record<TestUserRole, number> = {
    [TestUserRole.ADMIN]: 3,
    [TestUserRole.AGENT]: 2,
    [TestUserRole.VIEWER]: 1,
  };

  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}

/**
 * Mock tenant context for testing
 */
export function createMockTenantContext(overrides?: {
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  subdomain?: string;
}) {
  return {
    tenantId: overrides?.tenantId || 'test-tenant-id',
    tenantSlug: overrides?.tenantSlug || 'test-tenant',
    tenantName: overrides?.tenantName || 'Test Tenant',
    subdomain: overrides?.subdomain || 'test',
  };
}
