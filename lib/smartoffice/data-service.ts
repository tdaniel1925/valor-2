/**
 * SmartOffice Data Service
 *
 * Single source of truth for SmartOffice data
 * All endpoints should query through this service to ensure consistency
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

// ============================================================================
// Types
// ============================================================================

export interface PolicyFilters {
  agent?: string;
  agency?: string;
  carrier?: string;
  status?: string;
  search?: string;
  sortBy?: 'statusDate' | 'premium' | 'status' | 'carrier' | 'agent';
  sortOrder?: 'asc' | 'desc';
}

export interface AgentFilters {
  supervisor?: string;
  subSource?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PolicyWithMetadata {
  id: string;
  policyNumber: string;
  primaryAdvisor: string;
  productName: string;
  carrierName: string;
  primaryInsured: string;
  status: string;
  statusDate: Date | null;
  type: string;
  targetAmount: number | null;
  commAnnualizedPrem: number | null;
  weightedPremium: number | null;
  additionalData?: any;
  sourceFile: string | null;
  lastSyncDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentWithMetadata {
  id: string;
  lastName: string | null;
  firstName: string | null;
  fullName: string;
  email: string | null;
  phones: any;
  addresses: any;
  supervisor: string | null;
  subSource: string | null;
  contractList: string | null;
  ssn: string | null;
  npn: string | null;
  lastSyncDate: Date;
  sourceFile: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PoliciesResult {
  policies: PolicyWithMetadata[];
  filters: {
    agents: string[];
    agencies: string[];
    carriers: string[];
    statuses: string[];
  };
  total: number;
}

export interface AgentsResult {
  agents: AgentWithMetadata[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Policy Queries
// ============================================================================

/**
 * Get all policies with filters
 * This is the SINGLE SOURCE OF TRUTH for policy data
 */
export async function getPolicies(
  tenantId: string,
  filters: PolicyFilters = {}
): Promise<PoliciesResult> {
  return await withTenantContext(tenantId, async (prisma) => {
    // Build where clause
    const where: Prisma.SmartOfficePolicyWhereInput = {
      tenantId,
    };

    if (filters.agent) {
      where.primaryAdvisor = { contains: filters.agent, mode: 'insensitive' };
    }

    if (filters.carrier) {
      where.carrierName = { contains: filters.carrier, mode: 'insensitive' };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { policyNumber: { contains: filters.search, mode: 'insensitive' } },
        { primaryInsured: { contains: filters.search, mode: 'insensitive' } },
        { primaryAdvisor: { contains: filters.search, mode: 'insensitive' } },
        { carrierName: { contains: filters.search, mode: 'insensitive' } },
        { productName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const sortBy = filters.sortBy || 'statusDate';
    const sortOrder = filters.sortOrder || 'desc';

    let orderBy: Prisma.SmartOfficePolicyOrderByWithRelationInput = {};

    switch (sortBy) {
      case 'premium':
        orderBy = { commAnnualizedPrem: sortOrder };
        break;
      case 'status':
        orderBy = { status: sortOrder };
        break;
      case 'carrier':
        orderBy = { carrierName: sortOrder };
        break;
      case 'agent':
        orderBy = { primaryAdvisor: sortOrder };
        break;
      default:
        orderBy = { statusDate: sortOrder };
    }

    // Fetch policies
    const policies = await prisma.smartOfficePolicy.findMany({
      where,
      orderBy,
    });

    // Get unique filter values (for filter dropdowns)
    const allPolicies = await prisma.smartOfficePolicy.findMany({
      where: { tenantId },
      select: {
        primaryAdvisor: true,
        carrierName: true,
        status: true,
      },
    });

    const agents = Array.from(
      new Set(allPolicies.map(p => p.primaryAdvisor).filter(Boolean))
    ).sort() as string[];

    const carriers = Array.from(
      new Set(allPolicies.map(p => p.carrierName).filter(Boolean))
    ).sort() as string[];

    const statuses = Array.from(
      new Set(allPolicies.map(p => p.status).filter(Boolean))
    ).sort() as string[];

    return {
      policies: policies.map(p => ({
        ...p,
        // Normalize the data structure for consistency
        carrierName: p.carrierName,
      })) as PolicyWithMetadata[],
      filters: {
        agents,
        agencies: [], // Not implemented yet
        carriers,
        statuses,
      },
      total: policies.length,
    };
  });
}

/**
 * Get a single policy by ID
 */
export async function getPolicyById(
  tenantId: string,
  policyId: string
): Promise<PolicyWithMetadata | null> {
  return await withTenantContext(tenantId, async (prisma) => {
    const policy = await prisma.smartOfficePolicy.findFirst({
      where: {
        id: policyId,
        tenantId,
      },
    });

    return policy as PolicyWithMetadata | null;
  });
}

/**
 * Get a single policy by policy number
 */
export async function getPolicyByNumber(
  tenantId: string,
  policyNumber: string
): Promise<PolicyWithMetadata | null> {
  return await withTenantContext(tenantId, async (prisma) => {
    const policy = await prisma.smartOfficePolicy.findFirst({
      where: {
        policyNumber,
        tenantId,
      },
    });

    return policy as PolicyWithMetadata | null;
  });
}

// ============================================================================
// Agent Queries
// ============================================================================

/**
 * Get all agents with filters
 * This is the SINGLE SOURCE OF TRUTH for agent data
 */
export async function getAgents(
  tenantId: string,
  filters: AgentFilters = {}
): Promise<AgentsResult> {
  return await withTenantContext(tenantId, async (prisma) => {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.SmartOfficeAgentWhereInput = {
      tenantId,
    };

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { npn: { contains: filters.search, mode: 'insensitive' } },
        { supervisor: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.supervisor) {
      where.supervisor = { contains: filters.supervisor, mode: 'insensitive' };
    }

    if (filters.subSource) {
      where.subSource = { contains: filters.subSource, mode: 'insensitive' };
    }

    // Fetch agents
    const [agents, total] = await Promise.all([
      prisma.smartOfficeAgent.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip,
        take: limit,
      }),
      prisma.smartOfficeAgent.count({ where }),
    ]);

    return {
      agents: agents as AgentWithMetadata[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
}

/**
 * Get a single agent by ID
 */
export async function getAgentById(
  tenantId: string,
  agentId: string
): Promise<AgentWithMetadata | null> {
  return await withTenantContext(tenantId, async (prisma) => {
    const agent = await prisma.smartOfficeAgent.findFirst({
      where: {
        id: agentId,
        tenantId,
      },
    });

    return agent as AgentWithMetadata | null;
  });
}

// ============================================================================
// Statistics & Aggregations
// ============================================================================

/**
 * Get policy statistics
 */
export async function getPolicyStats(tenantId: string) {
  return await withTenantContext(tenantId, async (prisma) => {
    const [
      totalCount,
      inforceCount,
      pendingCount,
      totalPremium,
    ] = await Promise.all([
      prisma.smartOfficePolicy.count({ where: { tenantId } }),
      prisma.smartOfficePolicy.count({
        where: { tenantId, status: { contains: 'INFORCE', mode: 'insensitive' } },
      }),
      prisma.smartOfficePolicy.count({
        where: { tenantId, status: { contains: 'PENDING', mode: 'insensitive' } },
      }),
      prisma.smartOfficePolicy.aggregate({
        where: { tenantId },
        _sum: { commAnnualizedPrem: true },
      }),
    ]);

    return {
      total: totalCount,
      inforce: inforceCount,
      pending: pendingCount,
      totalPremium: totalPremium._sum.commAnnualizedPrem || 0,
    };
  });
}

/**
 * Get agent statistics
 */
export async function getAgentStats(tenantId: string) {
  return await withTenantContext(tenantId, async (prisma) => {
    const totalCount = await prisma.smartOfficeAgent.count({
      where: { tenantId },
    });

    return {
      total: totalCount,
    };
  });
}

/**
 * Get the most recent sync information
 */
export async function getLastSyncInfo(tenantId: string) {
  return await withTenantContext(tenantId, async (prisma) => {
    const [lastPolicySync, lastAgentSync] = await Promise.all([
      prisma.smartOfficePolicy.findFirst({
        where: { tenantId },
        orderBy: { lastSyncDate: 'desc' },
        select: { lastSyncDate: true, sourceFile: true },
      }),
      prisma.smartOfficeAgent.findFirst({
        where: { tenantId },
        orderBy: { lastSyncDate: 'desc' },
        select: { lastSyncDate: true, sourceFile: true },
      }),
    ]);

    return {
      policies: lastPolicySync,
      agents: lastAgentSync,
    };
  });
}
