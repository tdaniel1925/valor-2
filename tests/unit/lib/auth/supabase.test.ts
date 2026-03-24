import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Supabase Auth Utilities', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.DEFAULT_TENANT_ID = 'test-tenant-id';
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('syncAuthUser()', () => {
    it('should return existing user when found by Supabase ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(mockUser),
          create: vi.fn(),
          update: vi.fn(),
        },
      };

      const supabaseUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {
          full_name: 'Test User',
        },
      };

      const { syncAuthUser } = await import('@/lib/auth/supabase');

      const result = await syncAuthUser(supabaseUser, mockPrisma);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should find user by email and sync Supabase UUID when not found by ID', async () => {
      const existingUser = {
        id: 'old-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const updatedUser = {
        ...existingUser,
        id: 'user-123',
      };

      const mockPrisma = {
        user: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce(null) // First call by ID returns null
            .mockResolvedValueOnce(existingUser), // Second call by email returns user
          create: vi.fn(),
          update: vi.fn().mockResolvedValue(updatedUser),
        },
      };

      const supabaseUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {},
      };

      const { syncAuthUser } = await import('@/lib/auth/supabase');

      const result = await syncAuthUser(supabaseUser, mockPrisma);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: 'user-123' },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { email: 'test@example.com' },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { id: 'user-123' },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should create new user when not found by ID or email', async () => {
      const newUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'AGENT',
        status: 'ACTIVE',
        emailVerified: true,
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(newUser),
          update: vi.fn(),
        },
      };

      const supabaseUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {
          full_name: 'New User',
        },
      };

      const { syncAuthUser } = await import('@/lib/auth/supabase');

      const result = await syncAuthUser(supabaseUser, mockPrisma);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-123',
          email: 'newuser@example.com',
          firstName: 'New',
          lastName: 'User',
          role: 'AGENT',
          status: 'ACTIVE',
          emailVerified: true,
          tenant: { connect: { id: 'test-tenant-id' } },
        },
      });
      expect(result).toEqual(newUser);
    });

    it('should create user with email prefix when no full name provided', async () => {
      const newUser = {
        id: 'user-123',
        email: 'simple@example.com',
        firstName: 'simple',
        lastName: '',
        role: 'AGENT',
        status: 'ACTIVE',
        emailVerified: false,
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(newUser),
          update: vi.fn(),
        },
      };

      const supabaseUser = {
        id: 'user-123',
        email: 'simple@example.com',
        email_confirmed_at: null,
        user_metadata: {},
      };

      const { syncAuthUser } = await import('@/lib/auth/supabase');

      const result = await syncAuthUser(supabaseUser, mockPrisma);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-123',
          email: 'simple@example.com',
          firstName: 'simple',
          lastName: '',
          role: 'AGENT',
          status: 'ACTIVE',
          emailVerified: false,
          tenant: { connect: { id: 'test-tenant-id' } },
        },
      });
      expect(result).toEqual(newUser);
    });

    it('should set emailVerified to false when email not confirmed', async () => {
      const newUser = {
        id: 'user-123',
        email: 'unverified@example.com',
        firstName: 'Unverified',
        lastName: 'User',
        role: 'AGENT',
        status: 'ACTIVE',
        emailVerified: false,
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(newUser),
          update: vi.fn(),
        },
      };

      const supabaseUser = {
        id: 'user-123',
        email: 'unverified@example.com',
        email_confirmed_at: null,
        user_metadata: {
          full_name: 'Unverified User',
        },
      };

      const { syncAuthUser } = await import('@/lib/auth/supabase');

      const result = await syncAuthUser(supabaseUser, mockPrisma);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emailVerified: false,
          }),
        })
      );
      expect(result.emailVerified).toBe(false);
    });

    it('should link user to tenant when creating new user', async () => {
      const newUser = {
        id: 'user-123',
        email: 'tenant@example.com',
        firstName: 'Tenant',
        lastName: 'User',
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(newUser),
          update: vi.fn(),
        },
      };

      const supabaseUser = {
        id: 'user-123',
        email: 'tenant@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {
          full_name: 'Tenant User',
        },
      };

      const { syncAuthUser } = await import('@/lib/auth/supabase');

      await syncAuthUser(supabaseUser, mockPrisma);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenant: { connect: { id: 'test-tenant-id' } },
        }),
      });
    });

    it('should handle user with only first name', async () => {
      const newUser = {
        id: 'user-123',
        email: 'firstname@example.com',
        firstName: 'SingleName',
        lastName: '',
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(newUser),
          update: vi.fn(),
        },
      };

      const supabaseUser = {
        id: 'user-123',
        email: 'firstname@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {
          full_name: 'SingleName',
        },
      };

      const { syncAuthUser } = await import('@/lib/auth/supabase');

      const result = await syncAuthUser(supabaseUser, mockPrisma);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'SingleName',
          lastName: '',
        }),
      });
    });

    it('should default to "User" for firstName when no name data available', async () => {
      const newUser = {
        id: 'user-123',
        email: 'default@example.com',
        firstName: 'User',
        lastName: '',
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(newUser),
          update: vi.fn(),
        },
      };

      const supabaseUser = {
        id: 'user-123',
        email: 'default@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {
          full_name: '',
        },
      };

      const { syncAuthUser } = await import('@/lib/auth/supabase');

      await syncAuthUser(supabaseUser, mockPrisma);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'User',
          lastName: '',
        }),
      });
    });
  });

  describe('createServerSupabaseClient()', () => {
    it('should create Supabase client with correct configuration', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockCreateClient = vi.mocked(createClient);

      const { createServerSupabaseClient } = await import('@/lib/auth/supabase');

      createServerSupabaseClient();

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        {
          auth: {
            persistSession: false,
          },
        }
      );
    });
  });

  describe('createBrowserSupabaseClient()', () => {
    it('should create Supabase client with browser configuration', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockCreateClient = vi.mocked(createClient);

      const { createBrowserSupabaseClient } = await import('@/lib/auth/supabase');

      createBrowserSupabaseClient();

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        }
      );
    });
  });
});
