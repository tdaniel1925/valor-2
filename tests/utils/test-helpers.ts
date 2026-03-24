/**
 * General Test Helpers
 *
 * Miscellaneous utilities for testing.
 */

import { vi } from 'vitest';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  options?: { timeout?: number; interval?: number }
): Promise<void> {
  const timeout = options?.timeout || 5000;
  const interval = options?.interval || 100;
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout exceeded');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock console methods to suppress output during tests
 */
export function suppressConsole() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.info = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
  });
}

/**
 * Create a wrapper for React Query
 */
export function createQueryClientWrapper(): ({ children }: { children: ReactNode }) => ReactElement {
  const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Custom render function that includes providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const Wrapper = createQueryClientWrapper();
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock Next.js router
 */
export function createMockRouter(overrides?: any) {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    basePath: '',
    locale: undefined,
    locales: undefined,
    defaultLocale: undefined,
    ...overrides,
  };
}

/**
 * Mock window.matchMedia for responsive design testing
 */
export function mockMatchMedia(matches: boolean = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Mock IntersectionObserver for lazy loading tests
 */
export function mockIntersectionObserver() {
  global.IntersectionObserver = class IntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn();
    root = null;
    rootMargin = '';
    thresholds = [];
  } as any;
}

/**
 * Mock ResizeObserver for responsive components
 */
export function mockResizeObserver() {
  global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  } as any;
}

/**
 * Create mock form data
 */
export function createMockFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}

/**
 * Create mock file for upload testing
 */
export function createMockFile(
  name: string = 'test.txt',
  content: string = 'test content',
  type: string = 'text/plain'
): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

/**
 * Mock fetch for API testing
 */
export function createMockFetch(response?: any, options?: { status?: number; ok?: boolean }) {
  return vi.fn().mockResolvedValue({
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => response,
    text: async () => JSON.stringify(response),
    blob: async () => new Blob([JSON.stringify(response)]),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
  });
}

/**
 * Generate random test data
 */
export const random = {
  string: (length: number = 10): string => {
    return Math.random().toString(36).substring(2, 2 + length);
  },
  number: (min: number = 0, max: number = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  email: (): string => {
    return `test-${random.string(8)}@example.com`;
  },
  date: (start?: Date, end?: Date): Date => {
    const startTime = start?.getTime() || Date.now() - 365 * 24 * 60 * 60 * 1000;
    const endTime = end?.getTime() || Date.now();
    return new Date(startTime + Math.random() * (endTime - startTime));
  },
  boolean: (): boolean => {
    return Math.random() > 0.5;
  },
};

/**
 * Assert that a function throws an error
 */
export async function expectToThrow(
  fn: () => any,
  errorMessage?: string | RegExp
): Promise<void> {
  let error: Error | null = null;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error('Expected function to throw an error');
  }

  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      if (!error.message.includes(errorMessage)) {
        throw new Error(
          `Expected error message to include "${errorMessage}", got "${error.message}"`
        );
      }
    } else {
      if (!errorMessage.test(error.message)) {
        throw new Error(
          `Expected error message to match ${errorMessage}, got "${error.message}"`
        );
      }
    }
  }
}
