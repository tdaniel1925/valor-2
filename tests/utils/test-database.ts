/**
 * Test Database Helpers
 *
 * Utilities for setting up and tearing down test data in the database.
 */

import { vi } from 'vitest';

/**
 * Mock Prisma Client for Testing
 */
export function createMockPrismaClient() {
  const mockQueryResult = {
    count: 0,
  };

  const mockFindMany = vi.fn().mockResolvedValue([]);
  const mockFindUnique = vi.fn().mockResolvedValue(null);
  const mockFindFirst = vi.fn().mockResolvedValue(null);
  const mockCreate = vi.fn().mockResolvedValue({});
  const mockUpdate = vi.fn().mockResolvedValue({});
  const mockDelete = vi.fn().mockResolvedValue({});
  const mockUpsert = vi.fn().mockResolvedValue({});
  const mockCount = vi.fn().mockResolvedValue(0);
  const mockAggregate = vi.fn().mockResolvedValue({});
  const mockGroupBy = vi.fn().mockResolvedValue([]);
  const mockDeleteMany = vi.fn().mockResolvedValue(mockQueryResult);
  const mockUpdateMany = vi.fn().mockResolvedValue(mockQueryResult);
  const mockCreateMany = vi.fn().mockResolvedValue(mockQueryResult);

  const createModelMock = () => ({
    findMany: mockFindMany,
    findUnique: mockFindUnique,
    findFirst: mockFindFirst,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    upsert: mockUpsert,
    count: mockCount,
    aggregate: mockAggregate,
    groupBy: mockGroupBy,
    deleteMany: mockDeleteMany,
    updateMany: mockUpdateMany,
    createMany: mockCreateMany,
  });

  return {
    tenant: createModelMock(),
    user: createModelMock(),
    case: createModelMock(),
    quote: createModelMock(),
    commission: createModelMock(),
    contact: createModelMock(),
    policy: createModelMock(),
    carrier: createModelMock(),
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi.fn((callback) => callback(this)),
    $executeRaw: vi.fn().mockResolvedValue(0),
    $queryRaw: vi.fn().mockResolvedValue([]),
  };
}

/**
 * Test data factories
 */
export const testDataFactories = {
  tenant: (overrides?: any) => ({
    id: 'test-tenant-id',
    slug: 'test-tenant',
    name: 'Test Tenant',
    status: 'ACTIVE',
    subdomain: 'test',
    customDomain: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  user: (overrides?: any) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN',
    tenantId: 'test-tenant-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  case: (overrides?: any) => ({
    id: 'test-case-id',
    caseNumber: 'CASE-001',
    status: 'PENDING',
    clientName: 'Test Client',
    tenantId: 'test-tenant-id',
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  quote: (overrides?: any) => ({
    id: 'test-quote-id',
    quoteNumber: 'QUOTE-001',
    status: 'PENDING',
    premium: 1000,
    caseId: 'test-case-id',
    carrierId: 'test-carrier-id',
    tenantId: 'test-tenant-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  commission: (overrides?: any) => ({
    id: 'test-commission-id',
    amount: 100,
    status: 'PENDING',
    caseId: 'test-case-id',
    tenantId: 'test-tenant-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  carrier: (overrides?: any) => ({
    id: 'test-carrier-id',
    name: 'Test Carrier',
    code: 'TEST',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

/**
 * Seed test data into the database
 */
export async function seedTestData(prisma: any, data: any) {
  // This would be used with a real test database
  // For now, it's a placeholder for when you need to seed actual test data
  console.log('Seeding test data:', data);
}

/**
 * Clean up test data from the database
 */
export async function cleanupTestData(prisma: any) {
  // This would be used with a real test database
  // For now, it's a placeholder for when you need to clean up after tests
  console.log('Cleaning up test data');
}

/**
 * Create a test database transaction
 */
export function createTestTransaction() {
  return {
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
  };
}
