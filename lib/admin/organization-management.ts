import { prisma } from "@/lib/db/prisma";

export interface CreateOrganizationInput {
  name: string;
  type: string;
  parentId?: string;
  ein?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  type?: string;
  parentId?: string;
  ein?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status?: string;
}

/**
 * Create a new organization
 */
export async function createOrganization(
  input: CreateOrganizationInput,
  createdBy: string
) {
  const { parentId, ...data } = input;

  // Validate parent organization exists if provided
  if (parentId) {
    const parent = await prisma.organization.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new Error("Parent organization not found");
    }

    // Check for circular reference
    if (await hasCircularReference(parentId, parentId)) {
      throw new Error("Circular organization hierarchy detected");
    }
  }

  const organization = await prisma.organization.create({
    data: {
      ...data,
      type: data.type as any,
      parentId,
      status: "ACTIVE",
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: "ORGANIZATION_CREATE",
      entityType: "ORGANIZATION",
      entityId: organization.id,
      changes: JSON.stringify(input),
    },
  });

  return organization;
}

/**
 * Update an organization
 */
export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput,
  updatedBy: string
) {
  const currentOrg = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!currentOrg) {
    throw new Error("Organization not found");
  }

  // Validate parent change
  if (input.parentId !== undefined) {
    if (input.parentId) {
      const parent = await prisma.organization.findUnique({
        where: { id: input.parentId },
      });

      if (!parent) {
        throw new Error("Parent organization not found");
      }

      // Prevent setting self as parent
      if (input.parentId === organizationId) {
        throw new Error("Organization cannot be its own parent");
      }

      // Check for circular reference
      if (await hasCircularReference(input.parentId, organizationId)) {
        throw new Error("Circular organization hierarchy detected");
      }
    }
  }

  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...input,
      type: input.type as any,
      status: input.status as any,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: "ORGANIZATION_UPDATE",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      changes: JSON.stringify({
        before: currentOrg,
        after: input,
      }),
    },
  });

  return updatedOrg;
}

/**
 * Delete an organization (soft delete)
 */
export async function deleteOrganization(
  organizationId: string,
  deletedBy: string
) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      children: true,
      members: {
        where: { isActive: true },
      },
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  // Check for active children
  if (organization.children.length > 0) {
    throw new Error(
      "Cannot delete organization with child organizations. Please reassign or delete child organizations first."
    );
  }

  // Check for active members
  if (organization.members.length > 0) {
    throw new Error(
      "Cannot delete organization with active members. Please reassign or remove members first."
    );
  }

  // Soft delete
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      status: "INACTIVE",
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: "ORGANIZATION_DELETE",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      changes: JSON.stringify({
        name: organization.name,
        type: organization.type,
      }),
    },
  });
}

/**
 * Get organization hierarchy tree
 */
export async function getOrganizationHierarchy(rootId?: string) {
  const where = rootId ? { id: rootId } : { parentId: null };

  const rootOrgs = await prisma.organization.findMany({
    where: {
      ...where,
      status: "ACTIVE",
    },
    include: {
      _count: {
        select: {
          members: { where: { isActive: true } },
          contracts: true,
        },
      },
    },
  });

  // Build hierarchy tree recursively
  const buildTree = async (orgId: string, depth: number = 0): Promise<any> => {
    if (depth > 10) {
      // Prevent infinite recursion
      return null;
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        children: {
          where: { status: "ACTIVE" },
          include: {
            _count: {
              select: {
                members: { where: { isActive: true } },
                contracts: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: { where: { isActive: true } },
            contracts: true,
          },
        },
      },
    });

    if (!org) return null;

    const children = await Promise.all(
      org.children.map((child) => buildTree(child.id, depth + 1))
    );

    return {
      ...org,
      children: children.filter((c) => c !== null),
      depth,
    };
  };

  if (rootId) {
    return await buildTree(rootId);
  }

  // Build tree for all root organizations
  const trees = await Promise.all(rootOrgs.map((org) => buildTree(org.id)));

  return trees.filter((t) => t !== null);
}

/**
 * Get organization with full details
 */
export async function getOrganizationById(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      children: {
        where: { status: "ACTIVE" },
        include: {
          _count: {
            select: {
              members: { where: { isActive: true } },
            },
          },
        },
      },
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      },
      contracts: {
        take: 10,
        orderBy: { requestedAt: "desc" },
      },
      _count: {
        select: {
          members: { where: { isActive: true } },
          contracts: true,
        },
      },
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  return organization;
}

/**
 * Get organization ancestry path (from root to current org)
 */
export async function getOrganizationPath(organizationId: string) {
  const path: any[] = [];
  let currentId: string | null = organizationId;
  let depth = 0;

  while (currentId && depth < 10) {
    const org = await prisma.organization.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
      },
    });

    if (!org) break;

    path.unshift(org); // Add to beginning of array
    currentId = org.parentId;
    depth++;
  }

  return path;
}

/**
 * Move organization to a new parent
 */
export async function moveOrganization(
  organizationId: string,
  newParentId: string | null,
  movedBy: string
) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  // Validate new parent
  if (newParentId) {
    if (newParentId === organizationId) {
      throw new Error("Organization cannot be its own parent");
    }

    const newParent = await prisma.organization.findUnique({
      where: { id: newParentId },
    });

    if (!newParent) {
      throw new Error("New parent organization not found");
    }

    // Check for circular reference
    if (await hasCircularReference(newParentId, organizationId)) {
      throw new Error("Move would create circular hierarchy");
    }
  }

  const oldParentId = organization.parentId;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      parentId: newParentId,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: movedBy,
      action: "ORGANIZATION_MOVE",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      changes: JSON.stringify({
        from: oldParentId,
        to: newParentId,
      }),
    },
  });
}

/**
 * Get all organizations with filters
 */
export async function getOrganizations(filters?: {
  type?: string;
  status?: string;
  search?: string;
  parentId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { ein: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.parentId !== undefined) {
    where.parentId = filters.parentId;
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            members: { where: { isActive: true } },
            contracts: true,
            children: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    organizations,
    total,
    limit: filters?.limit || 50,
    offset: filters?.offset || 0,
  };
}

/**
 * Check if moving an organization would create a circular reference
 */
async function hasCircularReference(
  potentialParentId: string,
  childId: string
): Promise<boolean> {
  let currentId: string | null = potentialParentId;
  let depth = 0;

  while (currentId && depth < 10) {
    if (currentId === childId) {
      return true; // Circular reference detected
    }

    const org = await prisma.organization.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!org) break;

    currentId = org.parentId;
    depth++;
  }

  return false;
}

/**
 * Get organization statistics
 */
export async function getOrganizationStats(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        where: { isActive: true },
      },
      contracts: true,
      children: {
        where: { status: "ACTIVE" },
      },
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  // Get commission totals
  const memberIds = organization.members.map((m) => m.userId);

  const commissionStats = await prisma.commission.aggregate({
    where: {
      userId: { in: memberIds },
    },
    _sum: {
      amount: true,
    },
    _count: true,
  });

  // Get case statistics
  const caseStats = await prisma.case.groupBy({
    by: ["status"],
    where: {
      userId: { in: memberIds },
    },
    _count: true,
  });

  return {
    members: {
      total: organization.members.length,
      byRole: organization.members.reduce(
        (acc, m) => {
          acc[m.role] = (acc[m.role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
    contracts: {
      total: organization.contracts.length,
      byStatus: organization.contracts.reduce(
        (acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
    children: {
      total: organization.children.length,
    },
    commissions: {
      total: commissionStats._sum.amount || 0,
      count: commissionStats._count,
    },
    cases: {
      total: caseStats.reduce((sum, s) => sum + s._count, 0),
      byStatus: caseStats.reduce(
        (acc, s) => {
          acc[s.status] = s._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  };
}
