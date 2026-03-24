/**
 * Mock Supabase Client for Testing
 *
 * Provides a mock implementation of the Supabase client for unit tests.
 * Use this to avoid actual database calls during testing.
 */

import { vi } from 'vitest';

export interface MockSupabaseUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface MockSupabaseSession {
  access_token: string;
  refresh_token: string;
  user: MockSupabaseUser;
  expires_at?: number;
}

export interface MockSupabaseResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Creates a mock Supabase user object
 */
export function createMockUser(overrides?: Partial<MockSupabaseUser>): MockSupabaseUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {},
    ...overrides,
  };
}

/**
 * Creates a mock Supabase session object
 */
export function createMockSession(user?: MockSupabaseUser): MockSupabaseSession {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: user || createMockUser(),
    expires_at: Date.now() + 3600000, // 1 hour from now
  };
}

/**
 * Creates a successful mock response
 */
export function createMockResponse<T>(data: T): MockSupabaseResponse<T> {
  return {
    data,
    error: null,
  };
}

/**
 * Creates an error mock response
 */
export function createMockError(message: string, code?: string): MockSupabaseResponse<null> {
  return {
    data: null,
    error: { message, code },
  };
}

/**
 * Creates a complete mock Supabase client
 */
export function createMockSupabaseClient() {
  const mockUser = createMockUser();
  const mockSession = createMockSession(mockUser);

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(createMockResponse({})),
      maybeSingle: vi.fn().mockResolvedValue(createMockResponse({})),
      then: vi.fn((resolve) => resolve(createMockResponse([]))),
    })),
    rpc: vi.fn().mockResolvedValue(createMockResponse({})),
    storage: {
      from: vi.fn((bucket: string) => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null,
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(['mock data']),
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        list: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://mock-storage.url/${path}` },
        })),
      })),
    },
  };
}

/**
 * Creates a mock Supabase server client (for server components)
 */
export function createMockSupabaseServerClient() {
  return createMockSupabaseClient();
}

/**
 * Mock for createClient from @supabase/supabase-js
 */
export const mockCreateClient = vi.fn(() => createMockSupabaseClient());

/**
 * Mock for createServerClient from @supabase/ssr
 */
export const mockCreateServerClient = vi.fn(() => createMockSupabaseServerClient());
