/**
 * Learning Center access resolution.
 *
 * A course is visible to everyone in the catalog, but only ACCESSIBLE when:
 *  - the user has an admin role (ADMINISTRATOR | EXECUTIVE), or
 *  - a grant exists with granteeType ALL, or
 *  - a grant exists with granteeType ROLE matching the user's role, or
 *  - a grant exists with granteeType USER matching the user's id.
 *
 * Locked courses surface an unlock message: course.unlockMessage overrides
 * the tenant-wide TrainingSettings.defaultUnlockMessage.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/server-auth';

export const GRANTEE_TYPES = ['ALL', 'ROLE', 'USER'] as const;
export type GranteeType = (typeof GRANTEE_TYPES)[number];

export const ADMIN_ROLES = ['ADMINISTRATOR', 'EXECUTIVE'];

export interface LearningUser {
  id: string;
  role: string;
  tenantId: string;
  email: string;
}

export interface GrantLike {
  granteeType: string;
  role: string | null;
  userId: string | null;
}

export const FALLBACK_UNLOCK_MESSAGE =
  'Complete the previous courses or contact your administrator to unlock this content.';

/** Authenticated DB user for learning routes (throws "Unauthorized" / "User not found"). */
export async function requireDbUser(request: NextRequest): Promise<LearningUser> {
  const authUser = await requireAuth(request);
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true, tenantId: true, email: true },
  });
  if (!dbUser) throw new Error('User not found');
  return dbUser;
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}

export function hasCourseAccess(grants: GrantLike[], user: LearningUser): boolean {
  if (isAdminRole(user.role)) return true;
  return grants.some(
    (g) =>
      g.granteeType === 'ALL' ||
      (g.granteeType === 'ROLE' && g.role === user.role) ||
      (g.granteeType === 'USER' && g.userId === user.id)
  );
}

export function resolveUnlockMessage(
  courseUnlockMessage: string | null,
  tenantDefault: string | null | undefined
): string {
  return courseUnlockMessage?.trim() || tenantDefault?.trim() || FALLBACK_UNLOCK_MESSAGE;
}

/** Tenant default unlock message (null when no settings row exists yet). */
export async function getTenantDefaultUnlockMessage(tenantId: string): Promise<string | null> {
  const settings = await prisma.trainingSettings.findUnique({
    where: { tenantId },
    select: { defaultUnlockMessage: true },
  });
  return settings?.defaultUnlockMessage ?? null;
}

/** Map an auth helper error to an HTTP status. */
export function authErrorStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : '';
  if (message === 'Unauthorized') return 401;
  if (message.includes('admin access required')) return 403;
  if (message === 'User not found') return 404;
  return 500;
}
