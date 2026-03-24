/**
 * Enhanced Global Test Setup
 *
 * This file is run before all tests via vitest.config.ts
 * Sets up global mocks, environment variables, and test utilities.
 */

import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mockIntersectionObserver, mockResizeObserver, mockMatchMedia } from './utils/test-helpers';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_STARTER_PRICE_ID = 'price_starter_test';
process.env.STRIPE_PROFESSIONAL_PRICE_ID = 'price_professional_test';
process.env.STRIPE_ENTERPRISE_PRICE_ID = 'price_enterprise_test';
process.env.DEFAULT_TENANT_ID = 'test-tenant-id';
process.env.DEFAULT_TENANT_SLUG = 'test-tenant';
process.env.DEFAULT_TENANT_NAME = 'Test Tenant';
process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'valorfs.app';
process.env.NODE_ENV = 'test';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
  useParams: vi.fn(() => ({})),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Setup browser APIs
beforeAll(() => {
  // Mock IntersectionObserver
  mockIntersectionObserver();

  // Mock ResizeObserver
  mockResizeObserver();

  // Mock matchMedia
  mockMatchMedia();

  // Mock window.scrollTo
  window.scrollTo = vi.fn();

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  // Mock sessionStorage
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

// Global test cleanup
afterAll(() => {
  vi.resetAllMocks();
});
