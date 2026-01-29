import { prisma } from "@/lib/db/prisma";

export interface CommissionSplitConfig {
  userId: string;
  organizationId: string;
  split: number; // Percentage (0-100)
  role?: string;
}

/**
 * Update commission split for an organization member
 */
export async function updateMemberCommissionSplit(
  organizationId: string,
  userId: string,
  split: number,
  updatedBy: string
) {
  // Validate split percentage
  if (split < 0 || split > 100) {
    throw new Error("Commission split must be between 0 and 100");
  }

  // Check if member exists
  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      isActive: true,
    },
  });

  if (!member) {
    throw new Error("Organization member not found");
  }

  // Validate that updating this split won't cause total to exceed 100%
  const allMembers = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      isActive: true,
    },
  });

  // Calculate new total with this update
  let newTotal = 0;
  for (const m of allMembers) {
    if (m.userId === userId) {
      newTotal += split; // New split for this user
    } else {
      newTotal += (m.commissionSplit || 0) * 100; // Convert decimal to percentage
    }
  }

  // CRITICAL: Enforce hard limit - total must not exceed 100%
  if (newTotal > 100) {
    throw new Error(
      `Cannot update commission split: total would be ${newTotal.toFixed(2)}% which exceeds 100%. ` +
      `Current total is ${((newTotal - split + (member.commissionSplit || 0) * 100)).toFixed(2)}%. ` +
      `Please adjust splits to ensure the total does not exceed 100%.`
    );
  }

  // Update commission split (convert percentage to decimal)
  const updatedMember = await prisma.organizationMember.update({
    where: { id: member.id },
    data: {
      commissionSplit: split / 100,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: "COMMISSION_SPLIT_UPDATE",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      changes: JSON.stringify({
        userId,
        oldSplit: member.commissionSplit,
        newSplit: split,
      }),
    },
  });

  return updatedMember;
}

/**
 * Update commission splits for multiple members at once
 */
export async function bulkUpdateCommissionSplits(
  configs: CommissionSplitConfig[],
  updatedBy: string
) {
  // Validate all splits are within valid range
  for (const config of configs) {
    if (config.split < 0 || config.split > 100) {
      throw new Error(
        `Invalid split for user ${config.userId}: must be between 0 and 100`
      );
    }
  }

  // Group configs by organization to validate totals
  const configsByOrg = configs.reduce((acc, config) => {
    if (!acc[config.organizationId]) {
      acc[config.organizationId] = [];
    }
    acc[config.organizationId].push(config);
    return acc;
  }, {} as Record<string, CommissionSplitConfig[]>);

  // Validate that total splits per organization don't exceed 100%
  for (const [orgId, orgConfigs] of Object.entries(configsByOrg)) {
    // Get current members and their splits
    const currentMembers = await prisma.organizationMember.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
      },
    });

    // Calculate new total by applying the updates
    let newTotal = 0;
    const userIdsBeingUpdated = new Set(orgConfigs.map(c => c.userId));

    // Add splits for users being updated
    for (const config of orgConfigs) {
      newTotal += config.split;
    }

    // Add splits for users NOT being updated
    for (const member of currentMembers) {
      if (!userIdsBeingUpdated.has(member.userId)) {
        newTotal += (member.commissionSplit || 0) * 100; // Convert decimal to percentage
      }
    }

    // CRITICAL: Enforce hard limit - total must not exceed 100%
    if (newTotal > 100) {
      throw new Error(
        `Cannot update commission splits for organization ${orgId}: ` +
        `total would be ${newTotal.toFixed(2)}% which exceeds 100%. ` +
        `Please adjust splits to ensure the total does not exceed 100%.`
      );
    }
  }

  const results = await Promise.all(
    configs.map(async (config) => {
      try {
        const member = await updateMemberCommissionSplit(
          config.organizationId,
          config.userId,
          config.split,
          updatedBy
        );
        return {
          success: true,
          userId: config.userId,
          organizationId: config.organizationId,
          member,
        };
      } catch (error: any) {
        return {
          success: false,
          userId: config.userId,
          organizationId: config.organizationId,
          error: error.message,
        };
      }
    })
  );

  return results;
}

/**
 * Get commission split configuration for an organization
 */
export async function getOrganizationCommissionConfig(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      isActive: true,
    },
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
    orderBy: {
      commissionSplit: "desc",
    },
  });

  // Calculate total split allocation
  const totalSplit = members.reduce(
    (sum, member) => sum + (member.commissionSplit || 0),
    0
  );

  return {
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      user: m.user,
      role: m.role,
      commissionSplit: m.commissionSplit,
      joinedAt: m.joinedAt,
    })),
    totalSplit,
    isValid: totalSplit <= 100,
  };
}

/**
 * Validate commission split configuration
 */
export async function validateCommissionConfig(organizationId: string) {
  const config = await getOrganizationCommissionConfig(organizationId);

  const issues: string[] = [];

  if (config.totalSplit > 100) {
    issues.push(
      `Total commission split (${config.totalSplit}%) exceeds 100%`
    );
  }

  // Check for members without splits
  const membersWithoutSplit = config.members.filter(
    (m) => !m.commissionSplit || m.commissionSplit === 0
  );

  if (membersWithoutSplit.length > 0) {
    issues.push(
      `${membersWithoutSplit.length} member(s) have no commission split configured`
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    totalSplit: config.totalSplit,
    memberCount: config.members.length,
  };
}

/**
 * Auto-balance commission splits evenly across members
 */
export async function autoBalanceCommissionSplits(
  organizationId: string,
  updatedBy: string
) {
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      isActive: true,
    },
  });

  if (members.length === 0) {
    throw new Error("No active members in organization");
  }

  // Calculate even split
  const evenSplit = Math.floor(100 / members.length);
  const remainder = 100 % members.length;

  const updates = members.map((member, index) =>
    prisma.organizationMember.update({
      where: { id: member.id },
      data: {
        // Give remainder to first member(s)
        commissionSplit: evenSplit + (index < remainder ? 1 : 0),
      },
    })
  );

  await Promise.all(updates);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: "COMMISSION_SPLIT_AUTO_BALANCE",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      changes: JSON.stringify({
        memberCount: members.length,
        evenSplit,
      }),
    },
  });

  return await getOrganizationCommissionConfig(organizationId);
}

/**
 * Get commission split history for an organization
 */
export async function getCommissionSplitHistory(
  organizationId: string,
  limit: number = 50
) {
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "ORGANIZATION",
      entityId: organizationId,
      action: {
        in: [
          "COMMISSION_SPLIT_UPDATE",
          "COMMISSION_SPLIT_AUTO_BALANCE",
          "ORGANIZATION_MEMBER_ADD",
          "ORGANIZATION_MEMBER_REMOVE",
        ],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return auditLogs;
}

/**
 * Calculate effective commission split for a user across all organizations
 */
export async function getUserEffectiveCommissionSplit(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  return memberships.map((m) => ({
    organizationId: m.organizationId,
    organization: m.organization,
    role: m.role,
    commissionSplit: m.commissionSplit || 0,
    joinedAt: m.joinedAt,
  }));
}

/**
 * Set default commission split for new members
 */
export async function setDefaultCommissionSplit(
  organizationId: string,
  defaultSplit: number,
  updatedBy: string
) {
  if (defaultSplit < 0 || defaultSplit > 100) {
    throw new Error("Default split must be between 0 and 100");
  }

  // Store in organization metadata or a separate config table
  // For now, we'll use the organization's name as a simple approach
  // In production, you'd want a separate configuration table

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: "DEFAULT_COMMISSION_SPLIT_UPDATE",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      changes: JSON.stringify({
        defaultSplit,
      }),
    },
  });

  return {
    organizationId,
    defaultSplit,
  };
}

/**
 * Preview commission split impact for a case
 */
export async function previewCommissionSplit(
  caseId: string,
  totalCommission: number
) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      user: {
        include: {
          organizations: {
            where: { isActive: true },
            include: {
              organization: {
                include: {
                  members: {
                    where: { isActive: true },
                    include: {
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!caseData) {
    throw new Error("Case not found");
  }

  // Get user's primary organization
  const primaryOrg = caseData.user.organizations[0]?.organization;

  if (!primaryOrg) {
    return {
      caseId,
      totalCommission,
      splits: [
        {
          userId: caseData.userId,
          userName: `${caseData.user.firstName} ${caseData.user.lastName}`,
          amount: totalCommission,
          percentage: 100,
        },
      ],
    };
  }

  // Calculate splits based on organization members
  const splits = primaryOrg.members.map((member) => {
    const percentage = member.commissionSplit || 0;
    const amount = (totalCommission * percentage) / 100;

    return {
      userId: member.userId,
      userName: `${member.user.firstName} ${member.user.lastName}`,
      role: member.role,
      percentage,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimals
    };
  });

  return {
    caseId,
    totalCommission,
    organizationId: primaryOrg.id,
    organizationName: primaryOrg.name,
    splits: splits.filter((s) => s.percentage > 0),
  };
}
