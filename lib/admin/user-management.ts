import { prisma } from "@/lib/db/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  password?: string;
  sendInvite?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  mfaEnabled?: boolean;
}

/**
 * Create a new user with Supabase Auth and database record
 */
export async function createUser(
  input: CreateUserInput,
  createdBy: string
): Promise<any> {
  const { email, firstName, lastName, phone, role, password, sendInvite } =
    input;

  // Create user in Supabase Auth
  const authResult = await supabase.auth.admin.createUser({
    email,
    password: password || generateRandomPassword(),
    email_confirm: !sendInvite, // Auto-confirm if not sending invite
    user_metadata: {
      firstName,
      lastName,
      role,
    },
  });

  if (authResult.error) {
    throw new Error(`Failed to create auth user: ${authResult.error.message}`);
  }

  const authUserId = authResult.data.user!.id;

  // Create user in database
  const user = await prisma.user.create({
    data: {
      id: authUserId,
      email,
      firstName,
      lastName,
      phone,
      role,
      status: "ACTIVE",
      emailVerified: !sendInvite,
    },
  });

  // Create user profile
  await prisma.userProfile.create({
    data: {
      userId: user.id,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: "USER_CREATE",
      entityType: "USER",
      entityId: user.id,
      changes: JSON.stringify({
        email,
        firstName,
        lastName,
        role,
      }),
    },
  });

  // Send invite email if requested
  if (sendInvite) {
    await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        firstName,
        lastName,
        role,
      },
    });
  }

  return user;
}

/**
 * Update an existing user
 */
export async function updateUser(
  userId: string,
  input: UpdateUserInput,
  updatedBy: string
): Promise<any> {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  // Update Supabase Auth if email changed
  if (input.email && input.email !== currentUser.email) {
    const authResult = await supabase.auth.admin.updateUserById(userId, {
      email: input.email,
    });

    if (authResult.error) {
      throw new Error(
        `Failed to update auth email: ${authResult.error.message}`
      );
    }
  }

  // Update database record
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...input,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: "USER_UPDATE",
      entityType: "USER",
      entityId: userId,
      changes: JSON.stringify({
        before: currentUser,
        after: input,
      }),
    },
  });

  return updatedUser;
}

/**
 * Delete a user (soft delete - set status to INACTIVE)
 */
export async function deleteUser(
  userId: string,
  deletedBy: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Soft delete in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "INACTIVE",
    },
  });

  // Disable in Supabase Auth
  await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "876000h", // ~100 years
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: "USER_DELETE",
      entityType: "USER",
      entityId: userId,
      changes: JSON.stringify({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
    },
  });
}

/**
 * Reset a user's password
 */
export async function resetUserPassword(
  userId: string,
  newPassword?: string,
  sendResetEmail?: boolean
): Promise<{ password?: string; resetLink?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (sendResetEmail) {
    // Send password reset email
    const resetResult = await supabase.auth.resetPasswordForEmail(user.email);

    if (resetResult.error) {
      throw new Error(
        `Failed to send reset email: ${resetResult.error.message}`
      );
    }

    return { resetLink: "Password reset email sent" };
  } else {
    // Set new password directly
    const password = newPassword || generateRandomPassword();

    const authResult = await supabase.auth.admin.updateUserById(userId, {
      password,
    });

    if (authResult.error) {
      throw new Error(
        `Failed to reset password: ${authResult.error.message}`
      );
    }

    return { password };
  }
}

/**
 * Get users with filters and pagination
 */
export async function getUsers(filters?: {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  organizationId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters?.role) {
    where.role = filters.role;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { email: { contains: filters.search, mode: "insensitive" } },
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.organizationId) {
    where.organizations = {
      some: {
        organizationId: filters.organizationId,
        isActive: true,
      },
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        organizations: {
          where: { isActive: true },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            cases: true,
            contracts: true,
            commissions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    limit: filters?.limit || 50,
    offset: filters?.offset || 0,
  };
}

/**
 * Get user by ID with full details
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      organizations: {
        where: { isActive: true },
        include: {
          organization: true,
        },
      },
      cases: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      contracts: {
        take: 10,
        orderBy: { requestedAt: "desc" },
      },
      commissions: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          cases: true,
          contracts: true,
          commissions: true,
          quotes: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Assign user to organization
 */
export async function assignUserToOrganization(
  userId: string,
  organizationId: string,
  role: string,
  commissionSplit?: number,
  assignedBy?: string
) {
  // Check if already a member
  const existing = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  if (existing) {
    // Reactivate if inactive
    if (!existing.isActive) {
      const updated = await prisma.organizationMember.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          role: role as any,
          commissionSplit,
        },
      });

      if (assignedBy) {
        await prisma.auditLog.create({
          data: {
            userId: assignedBy,
            action: "ORGANIZATION_MEMBER_REACTIVATE",
            entityType: "ORGANIZATION",
            entityId: organizationId,
            changes: JSON.stringify({
              userId,
              role,
              commissionSplit,
            }),
          },
        });
      }

      return updated;
    }

    throw new Error("User is already a member of this organization");
  }

  const member = await prisma.organizationMember.create({
    data: {
      userId,
      organizationId,
      role: role as any,
      commissionSplit,
      isActive: true,
    },
  });

  if (assignedBy) {
    await prisma.auditLog.create({
      data: {
        userId: assignedBy,
        action: "ORGANIZATION_MEMBER_ADD",
        entityType: "ORGANIZATION",
        entityId: organizationId,
        changes: JSON.stringify({
          userId,
          role,
          commissionSplit,
        }),
      },
    });
  }

  return member;
}

/**
 * Remove user from organization
 */
export async function removeUserFromOrganization(
  userId: string,
  organizationId: string,
  removedBy?: string
) {
  const member = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
      isActive: true,
    },
  });

  if (!member) {
    throw new Error("User is not a member of this organization");
  }

  // Soft delete
  await prisma.organizationMember.update({
    where: { id: member.id },
    data: {
      isActive: false,
      leftAt: new Date(),
    },
  });

  if (removedBy) {
    await prisma.auditLog.create({
      data: {
        userId: removedBy,
        action: "ORGANIZATION_MEMBER_REMOVE",
        entityType: "ORGANIZATION",
        entityId: organizationId,
        changes: JSON.stringify({
          userId,
          role: member.role,
        }),
      },
    });
  }
}

/**
 * Generate random password
 */
function generateRandomPassword(): string {
  const length = 16;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Get user activity statistics
 */
export async function getUserActivity(userId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    caseCount,
    quoteCount,
    commissionTotal,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.case.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    }),
    prisma.quote.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    }),
    prisma.commission.aggregate({
      where: {
        userId,
        createdAt: { gte: since },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    period: {
      days,
      start: since,
      end: new Date(),
    },
    cases: caseCount,
    quotes: quoteCount,
    commissions: {
      total: commissionTotal._sum.amount || 0,
    },
    recentActivity: recentAuditLogs,
  };
}
