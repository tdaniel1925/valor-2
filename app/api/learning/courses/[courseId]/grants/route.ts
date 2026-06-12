import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { GRANTEE_TYPES, authErrorStatus } from '@/lib/learning/access';

const VALID_ROLES = ['AGENT', 'MANAGER', 'ADMINISTRATOR', 'EXECUTIVE'];

async function assertCourseInTenant(tenantId: string, courseId: string): Promise<boolean> {
  const course = await withTenantContext(tenantId, (tx) =>
    tx.course.findFirst({ where: { id: courseId, tenantId }, select: { id: true } })
  );
  return Boolean(course);
}

/** GET /api/learning/courses/[courseId]/grants — admin list grants */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { courseId } = await params;

    if (!(await assertCourseInTenant(admin.tenantId, courseId))) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const grants = await prisma.courseGrant.findMany({
      where: { courseId },
      select: {
        id: true,
        granteeType: true,
        role: true,
        userId: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json({ grants });
  } catch (error: unknown) {
    console.error('[LEARNING] list grants error:', error);
    const message = error instanceof Error ? error.message : 'Failed to list grants';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}

/**
 * PUT /api/learning/courses/[courseId]/grants — admin replace grant list
 * Body: { grants: [{ granteeType: 'ALL' | 'ROLE' | 'USER', role?, userId? }] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { courseId } = await params;
    const body = await request.json();

    if (!Array.isArray(body.grants)) {
      return NextResponse.json({ error: 'grants array is required' }, { status: 400 });
    }

    // Validate + dedupe before touching the DB
    const seen = new Set<string>();
    const cleaned: { granteeType: string; role: string | null; userId: string | null }[] = [];
    for (const g of body.grants) {
      if (!GRANTEE_TYPES.includes(g?.granteeType)) {
        return NextResponse.json({ error: `Invalid granteeType: ${g?.granteeType}` }, { status: 400 });
      }
      if (g.granteeType === 'ROLE' && !VALID_ROLES.includes(g.role)) {
        return NextResponse.json({ error: `Invalid role: ${g.role}` }, { status: 400 });
      }
      if (g.granteeType === 'USER' && typeof g.userId !== 'string') {
        return NextResponse.json({ error: 'USER grants need a userId' }, { status: 400 });
      }
      const key = `${g.granteeType}|${g.granteeType === 'ROLE' ? g.role : ''}|${g.granteeType === 'USER' ? g.userId : ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cleaned.push({
        granteeType: g.granteeType,
        role: g.granteeType === 'ROLE' ? g.role : null,
        userId: g.granteeType === 'USER' ? g.userId : null,
      });
    }

    if (!(await assertCourseInTenant(admin.tenantId, courseId))) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // USER grants must reference users inside this tenant
    const userIds = cleaned.filter((g) => g.userId).map((g) => g.userId as string);
    if (userIds.length > 0) {
      const found = await prisma.user.count({ where: { id: { in: userIds }, tenantId: admin.tenantId } });
      if (found !== new Set(userIds).size) {
        return NextResponse.json({ error: 'One or more userIds are not in this tenant' }, { status: 400 });
      }
    }

    await prisma.$transaction([
      prisma.courseGrant.deleteMany({ where: { courseId } }),
      ...(cleaned.length > 0
        ? [prisma.courseGrant.createMany({ data: cleaned.map((g) => ({ ...g, courseId })) })]
        : []),
    ]);

    const grants = await prisma.courseGrant.findMany({
      where: { courseId },
      select: { id: true, granteeType: true, role: true, userId: true },
    });

    return NextResponse.json({ grants });
  } catch (error: unknown) {
    console.error('[LEARNING] replace grants error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update grants';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
